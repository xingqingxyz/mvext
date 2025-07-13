import { commands, type ExtensionContext } from 'vscode'
import { ActionHandlerKind, actionTire } from './actionTire'
import { ModeController } from './modeController'
import { produceAction } from './motion'
import { statusBarItem } from './statusBarItem'
import { logger } from './util/logger'

const enum SequenceKind {
  Init,
  Command,
  Digit,
  ArgStr,
  Invoke,
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
  constructor(context: ExtensionContext) {
    this.modeController = new ModeController(context)
    this.handler.next()
    this.updateStatusBarItem()
    for (const args of produceAction()) {
      actionTire.add(...args)
    }
    actionTire.add('v', {
      kind: ActionHandlerKind.Immediate,
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
      commands.registerCommand('vincode.nextSequence', (key) =>
        this.handler.next(key),
      ),
    )
  }
  updateStatusBarItem() {
    statusBarItem.text = `|-${this.modeController.mode.toUpperCase()}-|\t${this.sequence}`
    statusBarItem.show()
  }
  clear() {
    this.sequence = new ConsumerSequence()
    this.actionTireNode = actionTire
    this.updateStatusBarItem()
  }
  nextSequence(key: string) {
    switch (this.sequence.kind) {
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
            this.sequence.kind = SequenceKind.Digit
            return true
          default:
            this.sequence.kind = SequenceKind.Command
            return true
        }
      case SequenceKind.Digit:
        if (Number.isNaN(+key)) {
          this.sequence.kind = SequenceKind.Command
          return true
        }
        this.sequence[SequenceKind.Digit] += key
        break
      case SequenceKind.Command: {
        if (this.actionTireNode.meta) {
          throw 'last sequence invoke or kind transform failed'
        }
        const node = this.actionTireNode.children[key.charCodeAt(0)]
        if (!node) {
          throw 'unknown key: ' + key
        }
        this.actionTireNode = node
        this.sequence[SequenceKind.Command] += key
        switch (node.meta?.kind) {
          case ActionHandlerKind.Immediate:
            this.sequence.kind = SequenceKind.Invoke
            return true
          case ActionHandlerKind.Count:
          case ActionHandlerKind.Terminator:
            this.sequence.kind = SequenceKind.ArgStr
            break
        }
        break
      }
      case SequenceKind.ArgStr:
        switch (this.actionTireNode.meta!.kind) {
          case ActionHandlerKind.Immediate:
            throw 'last immediate invoke not cleared'
          case ActionHandlerKind.Count:
            if (
              this.actionTireNode.meta!.count ===
              (this.sequence[SequenceKind.ArgStr] += key).length
            ) {
              this.sequence.kind = SequenceKind.Invoke
              return true
            }
            break
          case ActionHandlerKind.Terminator:
            if (this.actionTireNode.meta!.terminator === key) {
              this.sequence.kind = SequenceKind.Invoke
              return true
            }
            this.sequence[SequenceKind.ArgStr] += key
            break
        }
        break
      case SequenceKind.Invoke:
        try {
          const digit = this.sequence[SequenceKind.Digit]
          this.actionTireNode.meta!.handler({
            command: this.sequence[SequenceKind.Command],
            count: digit.length ? +digit : undefined,
            argStr: this.sequence[SequenceKind.ArgStr],
            select: this.inVisual,
          })
          this.clear()
        } catch (e) {
          throw `handler failed for ${this.sequence}: ${e}`
        }
        break
    }
    return false
  }
  *handleSequence() {
    let key: string
    while (true) {
      key = yield
      try {
        while (this.nextSequence(key)) {}
        this.updateStatusBarItem()
      } catch (e) {
        this.clear()
        logger.error(`nextSequence: ${e}`)
      }
    }
  }
}
