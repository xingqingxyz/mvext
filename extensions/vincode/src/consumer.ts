import { commands, env, Selection, window, type ExtensionContext } from 'vscode'
import { produceAction } from './action'
import {
  ActionHandlerKind,
  actionTire,
  type ActionHandlerContext,
} from './actionTire'
import { Leap } from './leap'
import { modeController } from './modeController'
import { Motion, produceMeta } from './motion'
import { statusBarItem } from './statusBarItem'
import { produceKey, TextObject } from './textObject'
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
  compositionSequence = ''
  actionTireNode = actionTire
  sequence = new ConsumerSequence()
  handler = this.handleSequence()
  constructor(context: ExtensionContext) {
    const leap = new Leap(context)
    this.handler.next()
    this.setupActionTire()
    context.subscriptions.push(
      commands.registerCommand('type', (arg: { text: string }) => {
        switch (modeController.mode) {
          case 'less':
            return
          case 'leap':
            return leap.nextChar(arg.text)
          case 'insert':
            return commands.executeCommand('default:type', arg)
          default:
            if (this.inComposition) {
              this.compositionSequence += arg.text
              return
            }
            this.handler.next(arg.text)
            return
        }
      }),
      commands.registerCommand('compositionStart', (arg) => {
        if (modeController.mode === 'insert') {
          return commands.executeCommand('default:compositionStart', arg)
        }
        this.inComposition = true
        return
      }),
      commands.registerCommand('compositionEnd', async (arg) => {
        if (modeController.mode === 'insert') {
          if (this.compositionSequence.length) {
            // returns received text
            await commands.executeCommand('default:compositionStart', {})
            for (const text of this.compositionSequence) {
              await commands.executeCommand('default:type', { text })
            }
            this.compositionSequence = ''
          }
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
      commands.registerCommand(
        'vincode.toggleVimMode',
        async (mode?: boolean) => {
          const curMode = modeController.mode === 'normal'
          mode ??= !curMode
          if (mode === curMode) {
            return
          }
          await modeController.setMode(mode ? 'normal' : 'insert')
        },
      ),
    )
  }
  setupActionTire() {
    const motion = new Motion()
    const motionHandlers = {
      '': motion.cursorMove.bind(motion),
      c: async (context: ActionHandlerContext) => {
        await window.activeTextEditor!.edit((edit) =>
          edit.delete(motion.getSeletion(context)),
        )
        await modeController.setMode('insert')
      },
      d: async (context: ActionHandlerContext) => {
        await window.activeTextEditor!.edit((edit) =>
          edit.delete(motion.getSeletion(context)),
        )
      },
      y: async (context: ActionHandlerContext) => {
        const range = motion.getSeletion(context)
        if (!range.isEmpty) {
          await env.clipboard.writeText(
            window.activeTextEditor!.document.getText(range),
          )
        }
      },
    }
    for (const [key, meta] of produceMeta()) {
      for (const [prefix, handler] of Object.entries(motionHandlers)) {
        actionTire.add(prefix + key, { ...meta, handler })
      }
    }
    const textObject = new TextObject()
    const textObjectHandlers = {
      '': (context: ActionHandlerContext) => {
        if (modeController.mode === 'visual') {
          const range = textObject.getRange(context)
          window.activeTextEditor!.selection = new Selection(
            range.start,
            range.end,
          )
        }
      },
      c: async (context: ActionHandlerContext) => {
        await window.activeTextEditor!.edit((edit) =>
          edit.delete(textObject.getRange(context)),
        )
        await modeController.setMode('insert')
      },
      d: async (context: ActionHandlerContext) => {
        await window.activeTextEditor!.edit((edit) =>
          edit.delete(textObject.getRange(context)),
        )
      },
      y: async (context: ActionHandlerContext) => {
        const range = textObject.getRange(context)
        if (!range.isEmpty) {
          await env.clipboard.writeText(
            window.activeTextEditor!.document.getText(range),
          )
        }
      },
    }
    for (const key of produceKey()) {
      for (const [prefix, handler] of Object.entries(textObjectHandlers)) {
        actionTire.add(prefix + key, {
          kind: ActionHandlerKind.Immediate,
          handler,
        })
      }
    }
    for (const [key, meta] of produceAction()) {
      actionTire.add(key, meta)
    }
    console.log(Array.from(actionTire))
  }
  updateStatusBarItem() {
    statusBarItem.text = `|-${modeController.mode.toUpperCase()}-| ${this.sequence}`
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
