# Ready Go!

This extension ships a set of useful tools:

- [Transform Case](#transform-case)
- [Edit By Shell](#edit-by-shell)
- [Run Markdown Code Block](#run-markdown-code-block)
- [Path Complete](#path-complete)
- [Toggle Hex Color Language](#toggle-hex-color-language)
- [TypeScript Code Actions](#typescript-code-actions)

## Features

### Transform Case

Transform editor selections (empty selection resolves to cursor word) to target
word case. All word cases: `title`, `camel`, `constant`, `pascal`, `kebab`,
`snake`, `sentence`, `dot`, `path`, `header`, `normal`, `lower`, `upper`

### Edit By Shell

#### Eval Selection

Using current editor selections, according to `editorLangId`, for each eval the
code and replace it (shortcut `ctrl+alt+s`) with process's stdout if success
else stderr. Supported language ids are:

- `shellscript`
- `powershell`
- `python`
- `/(java|type)script(react)?|vue|svelte|markdown|mdx/` (node)

#### Terminal Filter Selection

Join editor selections by '\n' and send it to the active terminal, then wait for
user edits and run, if command is not failed and has outputs, replace the first
selection to command outputs.

#### Terminal Eval Selection

For each editor selections, eval it's text in active terminal and replace it to
command output if command is not failed and has outputs.

#### Terminal Run Selection

Like's microsoft powershell extension (F8), run selections in active terminal.

### Run Markdown Code Block

Show `CodeLens` to run markdown code blocks in code block language terminal.
Supported language ids are:

- `bat`
- `shellscript`
- `powershell`
- `python`
- `/(java|type)script(react)?/` (node)

### Path Complete

Provide path completions for files.

### Toggle Hex Color Language

Simply toggle hex color blocks for each language.

### TypeScript Code Actions

See [transform.js](./src/test/suite/tsCodeAction/transform.js) for all refactor
rewrite code actions supported for javascript languages.
