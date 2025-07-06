import { setExtContext } from '@/config'
import {
  commands,
  DecorationRangeBehavior,
  Position,
  Range,
  TextEditorCursorStyle,
  TextEditorLineNumbersStyle,
  TextEditorRevealType,
  window,
  type ExtensionContext,
} from 'vscode'
import { builitinCommands } from './util'

let isVimMode = false
export async function activate(context: ExtensionContext) {
  setExtContext(context)
  context.subscriptions.push(
    commands.registerCommand('vincode.toggleVimMode', toggleVimMode),
    commands.registerCommand('type', async (arg) => {
      const editor = window.activeTextEditor!
      const select = !!editor.selections.find((v) => !v.isEmpty)
      switch (arg.text as string) {
        case 'h':
          return builitinCommands.cursorMove({
            to: 'left',
            by: 'character',
            select,
          })
        case 'j':
          return builitinCommands.cursorMove({
            to: 'down',
            by: 'wrappedLine',
            select,
          })
        case 'k':
          return builitinCommands.cursorMove({
            to: 'up',
            by: 'wrappedLine',
            select,
          })
        case 'l':
          return builitinCommands.cursorMove({
            to: 'right',
            by: 'character',
            select,
          })
        case '0':
          return builitinCommands.cursorMove({
            to: 'wrappedLineStart',
            by: 'wrappedLine',
          })
        case '^':
        case '_':
          return builitinCommands.cursorMove({
            to: 'wrappedLineFirstNonWhitespaceCharacter',
            by: 'wrappedLine',
            select,
          })
        case '$':
          return builitinCommands.cursorMove({
            to: 'wrappedLineLastNonWhitespaceCharacter',
            by: 'wrappedLine',
            select,
          })
        case '-':
          return builitinCommands.cursorMove({
            to: 'up',
            by: 'line',
            select,
          })
        case '+':
          return builitinCommands.cursorMove({
            to: 'down',
            by: 'line',
            select,
          })
        case 'f':
        case ' ':
          return builitinCommands.editorScroll({ to: 'down', by: 'page' })
        case 'b':
          return builitinCommands.editorScroll({ to: 'up', by: 'page' })
        case 'd':
          return builitinCommands.editorScroll({ to: 'down', by: 'halfPage' })
        case 'u':
          return builitinCommands.editorScroll({ to: 'up', by: 'halfPage' })
        case 'e':
          return builitinCommands.editorScroll({
            to: 'down',
            by: 'wrappedLine',
          })
        case 'y':
          return builitinCommands.editorScroll({ to: 'up', by: 'wrappedLine' })
        case 'g':
          return editor.revealRange(
            new Range(0, 0, 0, 0),
            TextEditorRevealType.AtTop,
          )
        case 'G':
          return editor.revealRange(
            new Range(
              editor.document.lineCount - 1,
              0,
              editor.document.lineCount - 1,
              0,
            ),
          )
        case 'I': {
          const position = new Position(
            editor.selection.active.line,
            editor.document.lineAt(
              editor.selection.active,
            ).firstNonWhitespaceCharacterIndex,
          )
          editor.revealRange(new Range(position, position))
          return toggleVimMode(false)
        }
        case 'i':
          return toggleVimMode(false)
        case 'A': {
          const line = editor.document.lineAt(editor.selection.active)
          const character = line.text.trimEnd().length
          editor.revealRange(
            new Range(line.lineNumber, character, line.lineNumber, character),
          )
          return toggleVimMode(false)
        }
        case 'a':
          await builitinCommands.cursorMove({ to: 'right', by: 'character' })
          return toggleVimMode(false)
      }
      return commands.executeCommand('default:type', arg)
    }),
  )
}

function toggleVimMode(mode = !isVimMode) {
  const editor = window.activeTextEditor!
  isVimMode = mode
  if (isVimMode) {
    const decoration = window.createTextEditorDecorationType({
      rangeBehavior: DecorationRangeBehavior.OpenClosed,
      color: 'red',
    })
    editor.setDecorations(decoration, editor.selections)
    editor.options.cursorStyle = TextEditorCursorStyle.Block
    editor.options.lineNumbers = TextEditorLineNumbersStyle.Relative
  } else {
    editor.options.cursorStyle = TextEditorCursorStyle.Line
    editor.options.lineNumbers = TextEditorLineNumbersStyle.On
  }
}
