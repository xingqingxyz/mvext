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

export type Mode = 'normal' | 'insert' | 'pending' | 'visual' | 'command'

export class ModeController {
  //#region events
  private insertLeave = new EventEmitter<void>()
  public onInsertLeave(listener: () => unknown) {
    return this.insertLeave.event(listener)
  }
  private insertEnter = new EventEmitter<void>()
  public onInsertEnter(listener: () => unknown) {
    return this.insertEnter.event(listener)
  }
  private normalLeave = new EventEmitter<void>()
  public onNormalLeave(listener: () => unknown) {
    return this.normalLeave.event(listener)
  }
  private normalEnter = new EventEmitter<void>()
  public onNormalEnter(listener: () => unknown) {
    return this.normalEnter.event(listener)
  }
  private pendingLeave = new EventEmitter<void>()
  public onPendingLeave(listener: () => unknown) {
    return this.pendingLeave.event(listener)
  }
  private pendingEnter = new EventEmitter<void>()
  public onpendingEnter(listener: () => unknown) {
    return this.pendingEnter.event(listener)
  }
  private visualLeave = new EventEmitter<void>()
  public onVisualLeave(listener: () => unknown) {
    return this.visualLeave.event(listener)
  }
  private visualEnter = new EventEmitter<void>()
  public onVisualEnter(listener: () => unknown) {
    return this.visualEnter.event(listener)
  }
  private commandLeave = new EventEmitter<void>()
  public onCommandLeave(listener: () => unknown) {
    return this.commandLeave.event(listener)
  }
  private commandEnter = new EventEmitter<void>()
  public onCommandEnter(listener: () => unknown) {
    return this.commandEnter.event(listener)
  }
  //#endregion
  //#region mode
  private _mode: Mode = 'insert'
  public get mode() {
    return this._mode
  }
  public async setMode(mode: Mode) {
    this[(this._mode + 'Leave') as 'insertLeave'].fire()
    this[((this._mode = mode) + 'Enter') as 'insertLeave'].fire()
    await this._updateMode()
  }
  private async _updateMode() {
    statusBarItem.text = `|-${this._mode.toUpperCase()}-|`
    statusBarItem.show()
    await commands.executeCommand('setContext', 'vincode.vimMode', this._mode)
  }
  private _onNormalEnter() {
    const editor = window.activeTextEditor!
    editor.options.lineNumbers = TextEditorLineNumbersStyle.Relative
    editor.options.cursorStyle = TextEditorCursorStyle.Block
  }
  private _onNormalLeave() {
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
  constructor(context: ExtensionContext) {
    context.subscriptions.push(
      this.normalEnter.event(this._onNormalEnter.bind(this)),
      this.normalLeave.event(this._onNormalLeave.bind(this)),
    )
    this._updateMode()
  }
  //#endregion
}
