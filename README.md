# My VSCode Extension

This extension ships a set of pragmatic web dev features:

- [caseTransform](#case-transform)
- [quicklySwitchFile](#quickly-switch-file)
- [evalWithSelection](#eval-with-selection)
- [TypeScript Code Actions](#typescript-code-actions)

## Features

### Case Transform

Transform (multiple) cursor position or selection to many cases. Cases: `titleCase`, `camelCase`, `constantCase`, `pascalCase`, `kebabCase`, `snakeCase`, `sentenceCase`, `dotCase`, `pathCase`, `headerCase`, `noCase`, `lowerCase`, `upperCase` (command search _mvext_ to know shortcuts)

### Quickly Switch File

Quickly switch you source file between `.js/.css/.html` or `.js/.ts` (shortcut `alt+o`).

#### on local machine

| from       | to                              |
| ---------- | ------------------------------- |
| .js        | .html/.htm                      |
| .css       | .html/.htm                      |
| .html/.htm | .css/.js                        |
| .ts        | `/dist/**/*.js`, `/out/**/*.js` |

#### on web

| from       | to         |
| ---------- | ---------- |
| .js        | .html/.htm |
| .css       | .html/.htm |
| .html/.htm | .css/.js   |
| .ts        | .js        |

Or switch your source file between `*.*` and `./__tests__/*.test.*` or `./__tests__/*.spec.*` (shortcut `alt+shift+t`)

### Eval With Selection

Using current editor selection, according to `editorLangId`, to eval the code and instantly replace it. Supports language ids (shortcut `ctrl+alt+e`):

- `/(java|type)script(react)?|vue|svelte|markdown|mdx/` (Node.js / Deno)
- `powershell` (pwsh or fallback to powershell.exe)
- `bat` (cmd.exe)
- `bash` (bash or "C:\Program Files\Git\bin\bash.exe" on windows)

> Setting config `mvext.evalWithSelection.useDeno` to true to use deno to eval any javascript code.

> Setting config `mvext.evalWithSelection.bashExecutable` on any settings.json file to switch the `bash` executable.

### TypeScript Code Actions

- `Delete Function Call`

  transform from `func('hello')` to `'hello'`
