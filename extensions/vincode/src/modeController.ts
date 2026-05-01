import {
  commands,
  EventEmitter,
  TextEditorCursorStyle,
  TextEditorLineNumbersStyle,
  window,
  workspace,
  type ExtensionContext,
} from 'vscode'
import { statusBarItem } from './statusBarItem'
import { kebabToPascal } from './util'

export type Mode = 'normal' | 'insert' | 'leap' | 'less' | 'visual'

class ModeController {
  //#region events
  private normalEnter = new EventEmitter<void>()
  public onNormalEnter(listener: () => unknown) {
    return this.normalEnter.event(listener)
  }
  private insertEnter = new EventEmitter<void>()
  public onInsertEnter(listener: () => unknown) {
    return this.insertEnter.event(listener)
  }
  private visualEnter = new EventEmitter<void>()
  public onVisualEnter(listener: () => unknown) {
    return this.visualEnter.event(listener)
  }
  private lessLeave = new EventEmitter<void>()
  public onLessLeave(listener: () => unknown) {
    return this.lessLeave.event(listener)
  }
  private lessEnter = new EventEmitter<void>()
  public onLessEnter(listener: () => unknown) {
    return this.lessEnter.event(listener)
  }
  //#endregion
  private prevMode: Mode = 'insert'
  private _mode: Mode = 'insert'
  public get mode() {
    return this._mode
  }
  public async setMode(mode: Mode) {
    this.prevMode = this._mode
    this[(this._mode + 'Leave') as 'normalEnter']?.fire()
    await this._updateMode()
    this[((this._mode = mode) + 'Enter') as 'normalEnter']?.fire()
  }
  public async restoreMode() {
    await this.setMode(this.prevMode)
  }
  private async _updateMode() {
    statusBarItem.text = `|-${this._mode.toUpperCase()}-|`
    statusBarItem.show()
    await commands.executeCommand('setContext', 'vincode.mode', this._mode)
  }
  private _onNormalEnter() {
    const editor = window.activeTextEditor!
    editor.options.lineNumbers = TextEditorLineNumbersStyle.Relative
    editor.options.cursorStyle = TextEditorCursorStyle.Block
  }
  private _onInsertEnter() {
    const editor = window.activeTextEditor!
    editor.options.lineNumbers =
      TextEditorLineNumbersStyle[
        kebabToPascal(
          workspace.getConfiguration('editor').get<string>('lineNumbers')!,
        ) as 'On'
      ]
    editor.options.cursorStyle =
      TextEditorCursorStyle[
        kebabToPascal(
          workspace.getConfiguration('editor').get<string>('cursorStyle')!,
        ) as 'Line'
      ]
  }
  private _onVisualEnter() {
    const editor = window.activeTextEditor!
    editor.options.lineNumbers = TextEditorLineNumbersStyle.Relative
    editor.options.cursorStyle = TextEditorCursorStyle.Underline
  }
  private async _onLessEnter() {
    window.activeTextEditor!.options.cursorStyle = TextEditorCursorStyle.Block
    await commands.executeCommand('workbench.action.toggleZenMode')
  }
  private async _onLessLeave() {
    window.activeTextEditor!.options.cursorStyle =
      TextEditorCursorStyle[
        kebabToPascal(
          workspace.getConfiguration('editor').get<string>('cursorStyle')!,
        ) as 'Line'
      ]
    await commands.executeCommand('workbench.action.exitZenMode')
  }
  constructor(context: ExtensionContext) {
    context.subscriptions.push(
      this.normalEnter.event(this._onNormalEnter.bind(this)),
      this.insertEnter.event(this._onInsertEnter.bind(this)),
      this.lessEnter.event(this._onLessEnter.bind(this)),
      this.lessLeave.event(this._onLessLeave.bind(this)),
    )
    void this._updateMode()
  }
}

export let modeController: ModeController
export function initModeController(context: ExtensionContext) {
  modeController = new ModeController(context)
}
