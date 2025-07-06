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
