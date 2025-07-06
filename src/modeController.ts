import { EventEmitter } from 'vscode'

export type Mode = 'normal' | 'insert' | 'pending' | 'visual' | 'command'

class ModeController {
  //#region events
  private insertLeave = new EventEmitter<Mode>()
  public onInsertLeave(listener: (e: Mode) => unknown) {
    return this.insertLeave.event(listener)
  }
  private insertEnter = new EventEmitter<Mode>()
  public onInsertEnter(listener: (e: Mode) => unknown) {
    return this.insertEnter.event(listener)
  }
  private normalLeave = new EventEmitter<Mode>()
  public onNormalLeave(listener: (e: Mode) => unknown) {
    return this.normalLeave.event(listener)
  }
  private normalEnter = new EventEmitter<Mode>()
  public onNormalEnter(listener: (e: Mode) => unknown) {
    return this.normalEnter.event(listener)
  }
  private pendingLeave = new EventEmitter<Mode>()
  public onPendingLeave(listener: (e: Mode) => unknown) {
    return this.pendingLeave.event(listener)
  }
  private pendingEnter = new EventEmitter<Mode>()
  public onpendingEnter(listener: (e: Mode) => unknown) {
    return this.pendingEnter.event(listener)
  }
  private visualLeave = new EventEmitter<Mode>()
  public onVisualLeave(listener: (e: Mode) => unknown) {
    return this.visualLeave.event(listener)
  }
  private visualEnter = new EventEmitter<Mode>()
  public onVisualEnter(listener: (e: Mode) => unknown) {
    return this.visualEnter.event(listener)
  }
  private commandLeave = new EventEmitter<Mode>()
  public onCommandLeave(listener: (e: Mode) => unknown) {
    return this.commandLeave.event(listener)
  }
  private commandEnter = new EventEmitter<Mode>()
  public onCommandEnter(listener: (e: Mode) => unknown) {
    return this.commandEnter.event(listener)
  }
  //#endregion
  //#region event firer
  private _mode: Mode = 'insert'
  public get mode() {
    return this._mode
  }
  public set mode(mode: Mode) {
    // @ts-expect-error unknown
    this[`on${this._mode[0].toUpperCase() + this._mode.slice(1)}Leave`].fire(
      mode,
    )
    this._mode = mode
    // @ts-expect-error unknown
    this[`on${mode[0].toUpperCase() + mode.slice(1)}Enter`].fire(mode)
  }
  //#endregion
}

export const modeController = new ModeController()
