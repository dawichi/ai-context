#!/usr/bin/env bun
import { Command, Option } from 'commander'
import { version as pkgVersion, description as pkgDescription } from '../package.json'
import path from 'node:path'
import { Glob } from 'bun'

// --- Configuration Type Definition ---
// This interface defines the expected structure of the user's ai-context.config.ts
export interface AiContextUserConfig {
    patterns: string[]
    output?: string
    // Add other potential config options here in the future
}

// This interface will hold the resolved configuration after merging CLI args and config file
interface ResolvedAiContextConfig {
    patterns: string[]
    outputFilePath: string
    configFilePath: string
}

// --- CLI Option Interface ---
interface CliCommandOptions {
    config: string // Path to the config file
    output?: string // Optional output path from CLI
}

/**
 * Loads and validates the user's configuration from the specified TypeScript file.
 * @param configPath Path to the ai-context.config.ts file.
 * @returns The validated user configuration.
 */
async function loadUserConfiguration(configPath: string): Promise<AiContextUserConfig> {
    const absoluteConfigPath = path.resolve(configPath)
    let configModule

    try {
        configModule = await import(absoluteConfigPath)
    } catch (error) {
        console.error(`❌ Error: Could not import config file at '${absoluteConfigPath}'.`)
        if (error instanceof Error && error.message.includes('Cannot find module')) {
            console.error(`Please ensure the file exists and is a valid TypeScript or JavaScript module.`)
        } else if (error instanceof Error) {
            console.error('Details:', error.message)
        } else {
            console.error('Details:', error)
        }
        process.exit(1)
    }

    if (!configModule.default) {
        console.error(`❌ Error: Config file '${absoluteConfigPath}' must have a default export.`)
        process.exit(1)
    }

    const userConfig = configModule.default as Partial<AiContextUserConfig>

    // Validate the config structure
    if (!userConfig.patterns || !Array.isArray(userConfig.patterns)) {
        console.error(`❌ Error: Config file '${absoluteConfigPath}' must export an object with a 'patterns' array.`)
        process.exit(1)
    }
    if (userConfig.patterns.some(p => typeof p !== 'string')) {
        console.error(`❌ Error: All 'patterns' in '${absoluteConfigPath}' must be strings.`)
        process.exit(1)
    }
    if (userConfig.output && typeof userConfig.output !== 'string') {
        console.error(`❌ Error: 'output' field in '${absoluteConfigPath}', if present, must be a string.`)
        process.exit(1)
    }

    return {
        patterns: userConfig.patterns,
        output: userConfig.output,
    }
}

/**
 * Generates the context file based on the resolved configuration.
 * @param config The resolved configuration.
 */
async function generateContextFile(config: ResolvedAiContextConfig): Promise<void> {
    if (config.patterns.length === 0) {
        console.warn(`⚠️ No patterns to process. Output file '${config.outputFilePath}' will not be created or will be empty.`)
        // Optionally, write an empty file or a comment indicating no files were matched
        await Bun.write(config.outputFilePath, '# No files matched the provided patterns.\n')
        return
    }

    console.log('\n🔍 Finding files matching patterns...')
    const matchedFilePaths = new Set<string>() // Use a Set to store unique file paths
    const cwd = process.cwd()

    for (const pattern of config.patterns) {
        // Bun.Glob expects a single pattern string.
        // It also supports "ignore" patterns if they start with "!" directly within its own logic,
        // but for combining multiple include/exclude patterns from an array,
        // we'd typically handle includes first, then filter excludes, or use a library
        // that supports complex pattern arrays.
        // For now, let's assume patterns are mostly includes, or simple "!" prefixes handled by Bun.Glob.
        // A more advanced setup might involve filtering after collecting all potential matches.

        const glob = new Glob(pattern)
        console.log(`  Scanning for pattern: "${pattern}"`)
        for await (const file of glob.scan('.')) {
            // Scan from cwd
            // glob.scan(".") returns paths relative to the scan root, which is cwd here.
            // So, 'file' is already relative to cwd.
            matchedFilePaths.add(file)
        }
    }

    // Convert Set to Array and sort for consistent order (optional but nice)
    const filesToInclude = Array.from(matchedFilePaths).sort()

    if (filesToInclude.length === 0) {
        console.log('No files found matching any of the patterns.')
        await Bun.write(config.outputFilePath, '# No files matched any of the provided patterns.\n')
        return
    }

    console.log(`\nFound ${filesToInclude.length} unique file(s) to include:`)
    filesToInclude.forEach(file => console.log(`  - ${file}`))

    let finalMarkdownContent = ``
    finalMarkdownContent += `<!-- Context generated by ai-context on ${new Date().toISOString()} -->\n`
    finalMarkdownContent += `<!-- Config file: ${path.relative(cwd, config.configFilePath)} -->\n\n`

    for (const relativeFilePath of filesToInclude) {
        // Since relativeFilePath is already relative to cwd from glob.scan(".")
        const absoluteFilePath = path.resolve(cwd, relativeFilePath)
        try {
            const fileContent = await Bun.file(absoluteFilePath).text()
            const normalizedPathComment = relativeFilePath.replace(/\\/g, '/')

            finalMarkdownContent += `// path: ${normalizedPathComment}\n`
            // Add a hint for the language if possible, based on extension
            const extension = path.extname(normalizedPathComment).substring(1)
            finalMarkdownContent += `\`\`\`${extension}\n` // Add language hint to code block
            finalMarkdownContent += `${fileContent.trim()}\n`
            finalMarkdownContent += '```\n\n'
        } catch (error) {
            console.warn(
                `⚠️ Warning: Could not read file '${absoluteFilePath}'. Skipping. Error: ${error instanceof Error ? error.message : error}`,
            )
        }
    }

    try {
        await Bun.write(config.outputFilePath, finalMarkdownContent)
        console.log(`\n✅ Successfully wrote context to '${config.outputFilePath}'`)
    } catch (error) {
        console.error(`❌ Error writing output file '${config.outputFilePath}':`)
        if (error instanceof Error) {
            console.error(error.message)
        } else {
            console.error(error)
        }
        process.exit(1)
    }
}

async function main() {
    const program = new Command()
    const defaultConfigFileName = 'ai-context.config.ts'
    const defaultOutputFileName = 'prompt.md'

    program
        .name('ai-context')
        .version(pkgVersion)
        .description(pkgDescription)
        .addOption(
            new Option('-c, --config <path>', 'Path to the configuration file (e.g., ai-context.config.ts)').default(defaultConfigFileName),
        )
        .addOption(
            new Option('-o, --output <path>', 'Path for the output Markdown file'),
            // Default is not set here directly, will be handled in logic to respect config file
        )
        .parse(process.argv)

    const cliOptions = program.opts<CliCommandOptions>()

    console.log('🚀 ai-context CLI starting...')
    console.log(`Attempting to load config from: '${cliOptions.config}'`)

    const userConfig = await loadUserConfiguration(cliOptions.config)

    // Determine the final output path with precedence: CLI > Config File > Default
    let finalOutputFilePath: string
    const outputSource = program.getOptionValueSource('output')

    if (outputSource === 'cli' && cliOptions.output) {
        finalOutputFilePath = cliOptions.output // User explicitly set it via CLI
        console.log(`Output path set from CLI: '${finalOutputFilePath}'`)
    } else if (userConfig.output) {
        finalOutputFilePath = userConfig.output // Config file has it
        console.log(`Output path set from config file: '${finalOutputFilePath}'`)
    } else {
        finalOutputFilePath = defaultOutputFileName // Default
        console.log(`Output path set to default: '${finalOutputFilePath}'`)
    }

    const resolvedConfig: ResolvedAiContextConfig = {
        patterns: userConfig.patterns,
        outputFilePath: path.resolve(finalOutputFilePath), // Resolve to absolute path
        configFilePath: path.resolve(cliOptions.config),
    }

    if (resolvedConfig.patterns.length === 0 && !userConfig.output) {
        // Check if patterns are empty AND output wasn't explicitly set in config
        console.warn(`⚠️ Warning: No glob patterns found in config file '${resolvedConfig.configFilePath}'.`)
        // No need to call generateContextFile if there are no patterns and no explicit output in config
        // because generateContextFile would just write a "no files matched" message.
        // We can let it proceed if userConfig.output was set, as they might expect an empty file.
    } else {
        console.log('\n📋 Parsed glob patterns from config:')
        resolvedConfig.patterns.forEach(pattern => console.log(`  - "${pattern}"`))
    }
    console.log(`\n📝 Final output will be written to: '${resolvedConfig.outputFilePath}'`)

    // Now call the function to do the actual work
    await generateContextFile(resolvedConfig)
}

main().catch(err => {
    console.error('\n❌ An unexpected error occurred in main execution:')
    if (err instanceof Error) {
        console.error(err.message)
        if (err.stack) {
            // console.error(err.stack); // Can be noisy, enable for deep debugging
        }
    } else {
        console.error(err)
    }
    process.exit(1)
})
