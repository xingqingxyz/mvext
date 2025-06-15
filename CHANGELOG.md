# Change Log

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.15.0]

- Feature: [`terminalLaunch`](src/terminalLaunch.ts) launch source files in active terminal from title bar.

## [0.14.0]

- Feature: [`markdownBlockRun`](src/markdownBlockRun.ts) run (`shellscript|powershell|python|javascript|typescript`) code blocks in markdown.

## [0.13.1]

- Fix: [`transformCase`] fix(transformCase): correct the impl more able to use.

## [0.12.0]

- Fix: [`pathComplete`] add `debounceTimeMs` opts for quickly typing double '\\' or '/'.
- Feature: [`toggleHexColorLanguage`] toggle hex color blocks for each language.

## [0.11.0]

- Feature: [`formatter`] provides shfmt, stylua integration based on executables.
- Feature: [`hexColor`] toggle language color provider.

## [0.10.4]

- Feature: [`transformCase`] transform case with UI, rename symbol with UI.
- Feature: [`evalSelection`] terminal eval selection, terminal filter selection.

## [0.5.0]

- Feature: [`pathComplete`](./src/pathComplete.ts): files path completer.

## [0.3.0]

- Feature: [`transformCase`](./src/transformCase.ts): transform word selections to camel, pascal, snake, kebab, title, header, dot, path, normal, lower, upper.
- Feature: [`quicklySwitchFile`](./src/quicklySwitchFile.ts): switch files between html and css/js or switch tests files.
- Feature: [`evalSelection`](./src/evalSelection.ts): exec selection in scripting languages and replace selection by results, except empty or null.
