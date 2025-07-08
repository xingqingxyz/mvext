import {
  commands,
  StatusBarAlignment,
  window,
  type ExtensionContext,
} from 'vscode'
import { ActionHandlerKind, actionTire } from './actionTire'
import { ModeController } from './modeController'
import { produceAction } from './motion'
import { execFilePm, noop } from './util'
import { logger } from './util/logger'

const enum SequenceKind {
  Init,
  Command,
  Digit,
  ArgStr,
}

class ConsumerSequence {
  [SequenceKind.Command] = '';
  [SequenceKind.Digit] = '';
  [SequenceKind.ArgStr] = ''
  kind = SequenceKind.Init
  toString() {
    return (
      this[SequenceKind.Digit] +
      this[SequenceKind.Command] +
      this[SequenceKind.ArgStr]
    )
  }
}

export class Consumer {
  inComposition = false
  inVisual = false
  compositionSequence = ''
  actionTireNode = actionTire
  sequence = new ConsumerSequence()
  handler = this.handleSequence()
  modeController: ModeController
  statusBarItem = window.createStatusBarItem(
    'modeLine',
    StatusBarAlignment.Left,
    9,
  )
  constructor(context: ExtensionContext) {
    this.modeController = new ModeController(context)
    this.handler.next()
    this.statusBarItem.name = 'Vincode Mode Line'
    this.statusBarItem.tooltip = 'enqueued keys'
    this.updateStatusBarItem()
    for (const args of produceAction()) {
      actionTire.add(...args)
    }
    actionTire.add('v', {
      kind: ActionHandlerKind.Invoke,
      handler: () => {
        this.inVisual = !this.inVisual
      },
    })
    context.subscriptions.push(
      commands.registerCommand('type', (arg: { text: string }) => {
        if (this.modeController.mode !== 'normal') {
          return commands.executeCommand('default:type', arg)
        } else if (this.inComposition) {
          this.compositionSequence += arg.text
        } else {
          this.handler.next(arg.text)
        }
        return
      }),
      commands.registerCommand('compositionStart', (arg) => {
        if (this.modeController.mode !== 'normal') {
          return commands.executeCommand('default:compositionStart', arg)
        }
        this.inComposition = true
        return
      }),
      commands.registerCommand('compositionEnd', (arg) => {
        if (this.modeController.mode !== 'normal') {
          return commands.executeCommand('default:compositionEnd', arg)
        }
        this.inComposition = false
        for (const key of this.compositionSequence) {
          this.handler.next(key)
        }
        this.compositionSequence = ''
        return
      }),
    )
  }
  updateStatusBarItem() {
    this.statusBarItem.text = `|-${this.modeController.mode.toUpperCase()}-|\t${this.sequence}`
    this.statusBarItem.show()
  }
  clear() {
    this.sequence = new ConsumerSequence()
    this.actionTireNode = actionTire
    this.updateStatusBarItem()
  }
  tryInvoke() {
    try {
      const digit = this.sequence[SequenceKind.Digit]
      this.actionTireNode.meta!.handler({
        command: this.sequence[SequenceKind.Command],
        count: digit.length ? +digit : undefined,
        argStr: this.sequence[SequenceKind.ArgStr],
        select: this.inVisual,
      })
    } catch {
      logger.error('handler failed for ' + this.sequence)
    } finally {
      this.clear()
    }
  }
  tryPushInvoke(key: string) {
    let { kind } = this.sequence
    switch (kind) {
      case SequenceKind.Init:
        switch (key) {
          case '1':
          case '2':
          case '3':
          case '4':
          case '5':
          case '6':
          case '7':
          case '8':
          case '9':
            kind = SequenceKind.Digit
            break
          default:
            kind = SequenceKind.Command
            break
        }
        break
      case SequenceKind.Digit:
        if (Number.isNaN(+key)) {
          kind = SequenceKind.Command
        }
        break
    }
    let invoke
    switch (kind) {
      case SequenceKind.Command: {
        const node = this.actionTireNode.children[key.charCodeAt(0)]
        if (!node) {
          this.clear()
          logger.error('unknown key: ' + key)
          if (process.platform === 'linux') {
            void execFilePm('/usr/bin/paplay', [
              '/usr/share/sounds/gnome/default/alerts/string.ogg',
            ]).catch(noop)
          }
          return
        }
        this.actionTireNode = node
        switch (node.meta?.kind) {
          case ActionHandlerKind.Invoke:
            invoke = true
            break
          case ActionHandlerKind.Count:
            this.sequence.kind = SequenceKind.ArgStr
            break
          case ActionHandlerKind.Terminator:
            this.sequence.kind = SequenceKind.ArgStr
            break
        }
        break
      }
      case SequenceKind.ArgStr: {
        const meta = this.actionTireNode.meta!
        switch (meta.kind) {
          case ActionHandlerKind.Invoke:
            this.clear()
            logger.error('invoke sequence not cleared, is last invoke failed?')
            return
          case ActionHandlerKind.Count:
            invoke =
              this.sequence[SequenceKind.ArgStr].length + 1 === meta.count
            break
          case ActionHandlerKind.Terminator:
            invoke = key === meta.terminator
            if (invoke) {
              key = ''
            }
            break
        }
        break
      }
    }
    this.sequence[kind] += key
    this.updateStatusBarItem()
    if (invoke) {
      this.tryInvoke()
    }
    return
  }
  *handleSequence() {
    while (true) {
      this.tryPushInvoke(yield)
    }
  }
}
