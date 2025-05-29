#!/usr/bin/env bun
import { Command } from 'commander'
import { version, description } from '../package.json'

interface CliOptions {
    config: string
    output: string
}

function main() {
    const program = new Command()

    program
        .name('ai-context')
        .version(version)
        .description(description)
        .requiredOption(
            // Changed to requiredOption for config
            '-c, --config <path>',
            'Path to the context definition file (e.g., .prompt-context-definition)',
            '.prompt-context-definition',
        )
        .option(
            // Kept as option for output, with a default
            '-o, --output <path>',
            'Path for the output Markdown file',
            'prompt.md',
        )
        .parse(process.argv)

    const options = program.opts<CliOptions>()

    console.log('ai-context CLI running with options: 👋')
    console.log('Config file path:', options.config)
    console.log('Output file path:', options.output)

    // Next steps:
    // 1. Read the config file (options.config)
    // 2. Parse the glob patterns from the config
    // 3. Find all matching files
    // 4. Read their content
    // 5. Format and write to the output file (options.output)
}

main()
