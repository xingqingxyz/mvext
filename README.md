# mvext

This extension ships a set of useful tools:

- [Case Transform](#case-transform)
- [Quickly Switch File](#quickly-switch-file)
- [Apply Shell Edit](#apply-shell-edit)
- [TypeScript Code Actions](#typescript-code-actions)
- [Path Complete](#path-complete)

## Features

### Case Transform

Transform (multiple) cursor position or selection to many cases. Cases: `title`, `camel`, `constant`, `pascal`, `kebab`, `snake`, `sentence`, `dot`, `path`, `header`, `normal`, `lower`, `upper`

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
- `shellscript` (bash)

### TypeScript Code Actions

- `Delete Function Call`

  transform from `func('hello')` to `'hello'`

- `Swap Vars`

  transform from `[a.b, c.d, e.f]` to `[a.b, c.d, e.f] = [e.f, c.d, a.b]`

---

### Path Complete

Provide path completions for files.

## For more information

Welcome to visit this [homepage](https://github.com/xingqingxyz/mvext)
