import {
  commands,
  DecorationRangeBehavior,
  TextEditorCursorStyle,
  TextEditorLineNumbersStyle,
  window,
  workspace,
  type ExtensionContext,
} from 'vscode'
import { setExtContext } from './config'

let isVimMode = false
export async function activate(context: ExtensionContext) {
  setExtContext(context)
  const defaultCommands = [
    'type',
    'cut',
    'paste',
    'undo',
    'redo',
    'replacePreviousChar',
    'compositionStart',
    'compositionType',
    'compositionEnd',
  ]
  await workspace.openTextDocument({
    language: 'plain',
    encoding: 'utf8',
    content: defaultCommands.join('\n'),
  })
  context.subscriptions.push(
    commands.registerTextEditorCommand('vincode.toggleVimMode', (editor) => {
      if ((isVimMode = !isVimMode)) {
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
    }),
    ...defaultCommands.map((cmd) =>
      commands.registerCommand(cmd, (...args) => {
        console.log(...args)
        return commands.executeCommand('default:' + cmd, ...args)
      }),
    ),
  )
}
