import {
  commands,
  Range,
  Selection,
  ThemeColor,
  window,
  type DecorationOptions,
  type ExtensionContext,
} from 'vscode'
import { modeController } from './modeController'
import { postLookupRegExp } from './util/bracketLookup'

export class Leap {
  static readonly twoDT = window.createTextEditorDecorationType({
    before: {
      color: new ThemeColor('textLink.foreground'),
    },
  })
  static readonly leapChars = 'ajskdlfghquwieorptyzxcvbnm'
  static get2AtIndex(index: number) {
    // prevent overflow
    return this.leapChars[(index / 26) >> 0 % 26] + this.leapChars[index % 26]
  }
  private sequence = ''
  private decorations?: DecorationOptions[]
  constructor(context: ExtensionContext) {
    context.subscriptions.push(
      commands.registerCommand(
        'vincode.leapToWordStart',
        this.start.bind(this),
      ),
      commands.registerCommand('vincode.cancelLeap', this.clear.bind(this)),
    )
  }
  async start() {
    const editor = window.activeTextEditor!
    editor.setDecorations(
      Leap.twoDT,
      (this.decorations = editor.visibleRanges.flatMap((range) =>
        Array.from(
          postLookupRegExp(editor.document, range.start, /\w+/g),
          (position, index) =>
            ({
              range: new Range(position, position),
              renderOptions: {
                before: {
                  contentText: Leap.get2AtIndex(index),
                },
              },
            }) as DecorationOptions,
        ),
      )),
    )
    await modeController.setMode('leap')
  }
  nextChar(char: string) {
    const sequence = this.sequence + char
    const decorations = this.decorations!.filter((decoration) =>
      decoration.renderOptions!.before!.contentText!.startsWith(sequence),
    )
    if (!decorations.length) {
      return
    }
    switch (sequence.length) {
      case 1:
        this.sequence = sequence
        this.decorations = decorations
        window.activeTextEditor!.setDecorations(Leap.twoDT, decorations)
        return
      case 2: {
        const editor = window.activeTextEditor!
        editor.selection = new Selection(
          editor.selection.isEmpty
            ? decorations[0].range.start
            : editor.selection.anchor,
          decorations[0].range.start,
        )
        void this.clear()
        return
      }
    }
  }
  async clear() {
    window.activeTextEditor!.setDecorations(Leap.twoDT, [])
    this.sequence = ''
    this.decorations = undefined
    await modeController.restoreMode()
  }
}
