# My VSCode Extension

This extension ships a set of pragmatic web dev features:

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

| from            | to             |
| --------------- | -------------- |
| .js             | .html          |
| .css            | .html          |
| .html?          | .css           |
| `src/**/*.tsx?` | `dist/**/*.js` |

#### Switch Test File

Or switch your source file between `/[base].[ext]` and `/__tests__/[base].{test,spec}.[ext]` (shortcut `alt+shift+t`)

### Apply Shell Edit

Using current editor selection, according to `editorLangId`, to eval the code and instantly replace it. Supports language ids (shortcut `ctrl+alt+s`):

- `/(java|type)script(react)?|vue|svelte|markdown|mdx/` (Node.js / Deno)
- `powershell` (pwsh or `mvext.applyShellEdit.pwshExec`)
- `ignore` (pwsh)

> Setting config `mvext.applyShellEdit.useDeno` to true to use deno to eval any javascript code.

### TypeScript Code Actions

- `Delete Function Call`

  transform from `func('hello')` to `'hello'`

- `Swap Vars`

  transform from `[a.b, c.d, e.f]` to `[a.b, c.d, e.f] = [e.f, c.d, a.b]`

---

### Path Complete

Provide path completions for files.
