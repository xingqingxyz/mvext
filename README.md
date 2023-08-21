# My VSCode Extension

This extension ships a set of pragmatic web dev features:

- [Case Transform](#case-transform)
- [Quickly Switch (Test) File](#quickly-switch-test-file)
- [Eval With Selection](#eval-with-selection)
- [TypeScript Code Actions](#typescript-code-actions)

## Features

### Case Transform

Transform (multiple) cursor position or selection to many cases. Cases: `titleCase`, `camelCase`, `constantCase`, `pascalCase`, `kebabCase`, `snakeCase`, `sentenceCase`, `dotCase`, `pathCase`, `headerCase`, `noCase`, `lowerCase`, `upperCase` (command search _mvext_ to know shortcuts)

### Quickly Switch (Test) File

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

### Eval With Selection

Using current editor selection, according to `editorLangId`, to eval the code and instantly replace it. Supports language ids (shortcut `ctrl+alt+e`):

- `/(java|type)script(react)?|vue|svelte|markdown|mdx/` (Node.js / Deno)
- `powershell` (pwsh or fallback to powershell.exe)
- `bat` (cmd.exe)
- `bash` (bash or "C:\Program Files\Git\bin\bash.exe" on windows)
- `ignore` (pwsh on win32, otherwise bash)

> Setting config `mvext.evalWithSelection.useDeno` to true to use deno to eval any javascript code.

#### Eval By Shell Integration

There is also a way to exec in current active terminal, it will
automatically detect to decide which wrapper code to send, it is so fun~ (shortcut `ctrl+alt+s`)

### TypeScript Code Actions

- `Delete Function Call`

  transform from `func('hello')` to `'hello'`

---
