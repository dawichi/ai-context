#!/usr/bin/env bun
import { Command, Option } from 'commander'
import { version as pkgVersion, description as pkgDescription } from '../package.json'
import path from 'node:path'
// import { Glob } from "bun"; // We'll use this in the next step

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

    if (resolvedConfig.patterns.length === 0) {
        console.warn(`⚠️ Warning: No glob patterns found in config file '${resolvedConfig.configFilePath}'. The output will be empty.`)
    } else {
        console.log('\n📋 Parsed glob patterns from config:')
        resolvedConfig.patterns.forEach(pattern => console.log(`  - "${pattern}"`))
    }
    console.log(`\n📝 Final output will be written to: '${resolvedConfig.outputFilePath}'`)

    // --- Next Major Steps ---
    // 1. Initialize Bun.Glob with resolvedConfig.patterns
    //    const glob = new Glob(resolvedConfig.patterns);
    //    const files = await Array.fromAsync(glob.scan('.')); // Scan from current dir or project root?

    // 2. For each matched file:
    //    - Read its content (e.g., await Bun.file(filePath).text())
    //    - Prepend the `// path: <relative_path_to_file>` comment

    // 3. Concatenate all file contents into one big string.

    // 4. Write the big string to resolvedConfig.outputFilePath
    //    await Bun.write(resolvedConfig.outputFilePath, finalMarkdownContent);

    console.log('\n✅ Processing complete (stubbed).')
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
