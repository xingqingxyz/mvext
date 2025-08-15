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
  static readonly leapChars = 'ajskdlfghquwieorptyzxcvbnm'
  static get2AtIndex(index: number) {
    // prevent overflow
    return this.leapChars[(index / 26) >> 0 % 26] + this.leapChars[index % 26]
  }
  private readonly twoDT = window.createTextEditorDecorationType({
    color: 'transparent',
    before: {
      margin: '0 -2ch 0 0',
      color: new ThemeColor('errorForeground'),
    },
  })
  private readonly oneDT = window.createTextEditorDecorationType({
    color: 'transparent',
    before: {
      margin: '0 -1ch 0 0',
      color: new ThemeColor('errorForeground'),
    },
  })
  private decorations?: DecorationOptions[]
  constructor(context: ExtensionContext) {
    context.subscriptions.push(
      this.twoDT,
      this.oneDT,
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
      this.twoDT,
      (this.decorations = editor.visibleRanges.flatMap((range) =>
        Array.from(
          postLookupRegExp(editor.document, range.start, /\w+/g),
          (position, index) =>
            ({
              range: new Range(
                position,
                position.with(undefined, position.character + 2),
              ),
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
  async nextChar(char: string) {
    const decorations = this.decorations!.filter(
      (decoration) =>
        decoration.renderOptions!.before!.contentText![0] === char,
    )
    if (!decorations.length) {
      return
    }
    switch (decorations[0].renderOptions!.before!.contentText!.length) {
      case 2: {
        const editor = window.activeTextEditor!
        editor.setDecorations(this.twoDT, [])
        editor.setDecorations(
          this.oneDT,
          (this.decorations = decorations.map(
            ({ range: { start }, renderOptions }) =>
              ({
                range: new Range(
                  start,
                  start.with(undefined, start.character + 1),
                ),
                renderOptions: {
                  before: {
                    contentText: renderOptions!.before!.contentText![1],
                  },
                },
              }) as DecorationOptions,
          )),
        )
        return
      }
      case 1: {
        const editor = window.activeTextEditor!
        editor.selection = new Selection(
          editor.selection.isEmpty
            ? decorations[0].range.start
            : editor.selection.anchor,
          decorations[0].range.start,
        )
        await this.clear()
        return
      }
    }
  }
  async clear() {
    const editor = window.activeTextEditor!
    editor.setDecorations(this.oneDT, [])
    editor.setDecorations(this.twoDT, [])
    this.decorations = undefined
    await modeController.restoreMode()
  }
}
