# VSC mvext

This extension ships a set of useful tools:

- [Case Transform](#case-transform)
- [Quickly Switch File](#quickly-switch-file)
- [Apply Shell Edit](#apply-shell-edit)
- [TypeScript Code Actions](#typescript-code-actions)
- [Path Complete](#path-complete)

## Features

### Case Transform

Transform (multiple) cursor position or selection to many cases. Cases: `titleCase`, `camelCase`, `constantCase`, `pascalCase`, `kebabCase`, `snakeCase`, `sentenceCase`, `dotCase`, `pathCase`, `headerCase`, `noCase`, `lowerCase`, `upperCase` (command search _mvext_ to know shortcuts)

### Quickly Switch File

Quickly switch you source file between `.js/.css/.html` or `.js/.ts` (shortcut `alt+o`).

#### Switch File

| from  | to    |
| ----- | ----- |
| .js   | .html |
| .css  | .html |
| .html | .css  |
| .ts   | .js   |

### Apply Shell Edit

Using current editor selection, according to `editorLangId`, to eval the code and instantly replace it. Supports language ids (shortcut `ctrl+alt+s`):

- `/(java|type)script(react)?|vue|svelte|markdown|mdx/` (Node.js | Deno | Bun.js)
- `powershell` (pwsh)
- `ignore` (pwsh | bash)

### TypeScript Code Actions

- `Delete Function Call`

  transform from `func('hello')` to `'hello'`

- `Swap Vars`

  transform from `[a.b, c.d, e.f]` to `[a.b, c.d, e.f] = [e.f, c.d, a.b]`

---

### Path Complete

Provide path completions for files.

## Extension Settings

- `mvext.applyShellEdit.pwshExec`: set pwsh excutable path
- `mvext.applyShellEdit.useExternalNode`: use custom node
- `mvext.applyShellEdit.nodeCommandLine`: set node runtime and args, in one array
- `mvext.pathComplete.expandPaths`: set workspace's path completion map

## For more information

Welcome to visit this [homepage](https://github.com/xingqingxyz/mvext)
