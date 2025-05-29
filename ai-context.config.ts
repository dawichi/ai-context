// ai-context.config.ts
// This is an example of what a user would create.

interface AiContextConfig {
    /** Glob patterns to include files. */
    patterns: string[]
    /**
     * Optional output path for the generated Markdown file.
     * Can be overridden by the --output CLI flag.
     */
    output?: string
    // Future options can be added here, e.g.:
    // ignorePatterns?: string[];
    // fileHeader?: string;
}

const config: AiContextConfig = {
    patterns: [
        'src/**/*.ts',
        '!src/**/*.spec.ts', // Example of an ignore pattern
        'docs/**/*.md',
        'package.json',
    ],
    output: 'project-context.md', // User can specify output here
}

export default config
