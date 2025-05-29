# ai-context-builder 🤖📝

**Easily generate comprehensive AI prompt context from your codebase. Define sources, get a Markdown file.**

[![npm version](https://badge.fury.io/js/ai-context-builder.svg)](https://badge.fury.io/js/ai-context-builder)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`ai-context-builder` is a command-line interface (CLI) tool designed to help software engineers efficiently gather and structure code context for use with AI assistants and Large Language Models (LLMs).

## 🤔 Why `ai-context-builder`?

When working with AI to assist in software development, developers often find themselves in one of two modes:

1.  **AI Has Full Control ("Vibe Coding"):** Tools where the AI has broad access to the project and makes changes across multiple files based on a prompt. This can be powerful but sometimes lacks precision or control.
2.  **Developer Keeps Control:** The developer identifies a specific task, gathers the necessary code context (files, snippets, etc.), and instructs the AI to perform that specific task. The developer then integrates the AI's output.

Many experienced developers prefer the second mode for its precision and control, especially in existing codebases. However, manually collecting and formatting this context for every task is tedious and error-prone:

-   Copy-pasting multiple files into a prompt.
-   Forgetting crucial related files.
-   Losing track of which snippet came from where.
-   Repeating this process every time the code changes or a new, similar task arises.

`ai-context-builder` solves this by allowing you to define your context sources once in a configuration file. Then, with a single command, it bundles all specified code into a structured Markdown file, ready to be pasted into your AI chat or used via an API.

**Use Cases:**

-   Refactoring specific modules and providing all relevant files to an AI.
-   Asking an AI to write unit tests for a set of related components.
-   Generating documentation for a feature by providing its core files.
-   Getting an AI to explain a complex section of code by feeding it all interconnected parts.
-   Any scenario where you need to provide a curated set of code files as context to an LLM.

## ✨ Features

-   **Declarative Context Definition:** Define which files to include using a simple `ai-context-builder.config.ts` file.
-   **Glob Pattern Support:** Use powerful glob patterns (e.g., `src/**/*.ts`, `!src/**/*.spec.ts`) to specify file sets.
-   **Single Markdown Output:** Concatenates all specified file contents into one organized Markdown file.
-   **Clear File Path Comments:** Each included file's content is preceded by a `// path: path/to/file.ext` comment, making it easy for both you and the AI to identify the source.
-   **Language Hints for Code Blocks:** Automatically adds language identifiers (e.g., ` ```ts`) to Markdown code blocks for better syntax highlighting.
-   **CLI Interface:** Easy to run from your terminal.
-   **Built with Bun & TypeScript:** Fast, modern, and type-safe.

## 🚀 Installation & Usage

The easiest way to use `ai-context-builder` is with `npx` (or `bunx`), which requires no global installation:

```bash
npx ai-context-builder [options]
```

Or, using Bun's bunx:

```bash
bunx ai-context-builder [options]
```

Alternatively, you can install it globally (once published to npm):

```bash
npm install -g ai-context-builder
# or
bun install -g ai-context-builder
```

## ⚙️ Configuration

`ai-context-builder` uses a TypeScript configuration file, typically named `ai-context-builder.config.ts`, in the root of your project.

Example `ai-context-builder.config.ts`:

```ts
// ai-context-builder.config.ts

// Interface for type safety (optional but recommended)
export interface AiContextUserConfig {
    /** Glob patterns to include files. */
    patterns: string[]
    /**
     * Optional output path for the generated Markdown file.
     * Can be overridden by the --output CLI flag.
     * Defaults to 'prompt.md' if not set here or via CLI.
     */
    output?: string
}

const config: AiContextUserConfig = {
    patterns: [
        'src/**/*.ts', // Include all TypeScript files in src
        '!src/**/*.spec.ts', // Exclude test files
        'docs/**/*.md', // Include all Markdown files in docs
        'package.json', // Include the package.json file
        'README.md', // Include this README
    ],
    output: 'project-context.md', // Specify the output file name
}

export default config
```

### Configuration Options:

-   `patterns: string[]`: An array of glob patterns to include files.
    -   Standard glob syntax is supported.
    -   Patterns starting with `!` are treated as exclusion patterns.
-   `output?: string`: (Optional) The name and path for the generated Markdown file. This can be overridden by the `--output` CLI flag. If not specified here or via the CLI, it defaults to `    prompt.md`.

## 💻 CLI Options

```txt
Usage: ai-context-builder [options]

Easily generate comprehensive AI prompt context from your codebase. Define sources, get a Markdown file.

Options:
  -V, --version        output the version number
  -c, --config <path>  Path to the configuration file (e.g., ai-context-builder.config.ts) (default: "ai-context-builder.config.ts")
  -o, --output <path>  Path for the output Markdown file (default: "prompt.md", or value from config file)
  -h, --help           display help for command

```

### Precedence for Output Path:

1. Value from `--output` CLI flag.
2. Value from `output` property in `ai-context-builder.config.ts`.
3. Default: `prompt.md`.

## 🛠️ Example Workflow

1. **Create a configuration file** in your project root named `ai-context-builder.config.ts`:

```ts
// ai-context-builder.config.ts
const config = {
    patterns: ['src/feature-x/**/*.ts', 'src/shared/utils.ts'],
    output: 'feature-x-context.md',
}
export default config
```

2. **Run the CLI** to generate the context file:

```bash
npx ai-context-builder
```

(If your config file is named differently or located elsewhere, use `npx ai-context-builder -c path/to/your/config.ts`)

3. **Find your context file:** A file named `feature-x-context.md` will be created in your project root.

4. **Paste into your AI tool** of choice.

## 🔮 Future Features & Roadmap

We have several exciting features planned to make `ai-context-builder` even more powerful:

-   **Advanced Glob Negation/Exclusion:** More sophisticated handling of include/exclude patterns across the entire `patterns` array (e.g., ensuring `!pattern` always subtracts from the set of files matched by preceding positive patterns).

-   **`.gitignore` & `.ai-contextignore` Support:** Automatically respect rules in `.gitignore` files (and potentially a dedicated `.ai-contextignore` file) to exclude files by default.

-   **Watch Mode (`--watch`):** Automatically regenerate the context file when any of the matched source files or the configuration file change.

-   **Enhanced Error Handling & Verbose Mode (`--verbose`):** Provide more granular error messages and a verbose logging option for debugging.

-   **Automated Tests:** Implement a comprehensive test suite for greater stability and easier contributions.

-   **Pre-defined Context "Sets":** Allow defining multiple named context "sets" or "profiles" within a single `ai-context-builder.config.ts` file, and select one via a CLI flag (e.g., `ai-context-builder --profile api-refactor`).

-   **Token Count Estimation:** Optionally estimate the token count of the generated context to help users stay within LLM limits.

-   **Customizable Output Format:** Allow users to define custom templates for the output file, beyond the default Markdown structure.

## 🤝 Contributing

Contributions are welcome! If you have ideas for new features, bug fixes, or improvements, please feel free to:

-   Open an issue to discuss your ideas.
-   Submit a pull request with your changes.

Please ensure your code adheres to the project's linting standards and that any new features are appropriately documented.

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
