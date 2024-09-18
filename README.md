# mvext

This extension ships a set of useful tools:

- [Transform Case](#transform-case)
- [Edit by Shell](#edit-by-shell)
- [Path Complete](#path-complete)
- [Toggle Hex Color Language](#toggle-hex-color-language)
- [TypeScript Code Actions](#typescript-code-actions)
- [Quickly Switch File](#quickly-switch-file)

## Features

### Transform Case

Transform editor selections (empty selection fallback to cursor line) to target
word case. All word cases: `title`, `camel`, `constant`, `pascal`, `kebab`,
`snake`, `sentence`, `dot`, `path`, `header`, `normal`, `lower`, `upper`

### Edit by Shell

#### Apply Shell Edit

Using current editor selections, according to `editorLangId`, for each eval the
code and replace it (shortcut `ctrl+alt+s`) with process's stdout if success
else stderr. Supported language ids are:

- `/(java|type)script(react)?|vue|svelte|markdown|mdx/` (javascript)
- `powershell` (pwsh)
- `shellscript` (bash)

#### Apply Terminal Filter

Join editor selections by '\n' and send it to the active terminal, then wait for
user edits and run, if command is not failed and has outputs, replace the first
selection to command output.

#### Apply Terminal Edit

For each editor selections, eval it's text in active terminal and replace it to
command output if command is not failed and has outputs.

### Path Complete

Provide path completions for files.

### Toggle Hex Color Language

Simply toggle hex color blocks for each language.

### TypeScript Code Actions

- `Delete Function Call`

  transform from `func('hello')` to `'hello'`

- `Swap Vars`

  transform from `[a.b, c.d, e.f]` to `[a.b, c.d, e.f] = [e.f, c.d, a.b]`

### Quickly Switch File

Quickly switch you source file between `.js/.css/.html` or `.js/.ts` (shortcut `alt+o`).

| from  | to    |
| ----- | ----- |
| .js   | .html |
| .css  | .html |
| .html | .css  |
| .ts   | .js   |

## For More Information

[!Read the source](https://github.com/xingqingxyz/mvext)
