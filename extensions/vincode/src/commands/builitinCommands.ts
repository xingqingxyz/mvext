import { commands } from 'vscode'

interface BuilitinCommands {
  cursorMove(options: {
    to:
      | 'left'
      | 'right'
      | 'up'
      | 'down'
      | 'prevBlankLine'
      | 'nextBlankLine'
      | 'wrappedLineStart'
      | 'wrappedLineEnd'
      | 'wrappedLineColumnCenter'
      | 'wrappedLineFirstNonWhitespaceCharacter'
      | 'wrappedLineLastNonWhitespaceCharacter'
      | 'viewPortTop'
      | 'viewPortCenter'
      | 'viewPortBottom'
      | 'viewPortIfOutside'
    by: 'line' | 'wrappedLine' | 'character' | 'halfLine'
    value?: number
    select?: boolean
  }): Thenable<void>
  editorScroll(options: {
    to: 'up' | 'down'
    by: 'line' | 'wrappedLine' | 'page' | 'halfPage' | 'editor'
    value?: number
    revealCursor?: boolean
  }): Thenable<void>
  revealLine(
    lineNumber: number,
    at: 'top' | 'center' | 'bottom',
  ): Thenable<void>
}

export const builitinCommands: BuilitinCommands = (
  ['cursorMove', 'editorScroll'] as const
).reduce(
  (o, t) => ((o[t] = (...args) => commands.executeCommand(t, ...args)), o),
  {} as BuilitinCommands,
)

/**
 * editor.actions.findWithArgs - Open a new In-Editor Find Widget with specific options.
 * @param searchString - String to prefill the find input
 * @param replaceString - String to prefill the replace input
 * @param isRegex - enable regex
 * @param preserveCase - try to keep the same case when replacing
 * @param findInSelection - restrict the find location to the current selection
 * @param matchWholeWord
 * @param isCaseSensitive
 */
export function execFindWithArgs(options: {
  searchString: string
  replaceString?: string
  isRegex?: boolean
  preserveCase?: boolean
  findInSelection?: boolean
  matchWholeWord?: boolean
  isCaseSensitive?: boolean
  findInAllFiles?: boolean
}) {
  return commands.executeCommand<void>(
    options.findInAllFiles
      ? 'workbench.action.findInFiles'
      : 'editor.actions.findWithArgs',
    options.searchString,
    options.replaceString,
    options.isRegex,
    options.preserveCase,
    options.findInSelection,
    options.matchWholeWord,
    options.isCaseSensitive,
  )
}
