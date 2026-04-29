import { commands, env, Selection, window, type ExtensionContext } from 'vscode'
import { Action } from './action'
import {
  ActionHandlerKind,
  actionTire,
  type ActionHandler,
  type ActionHandlerContext,
} from './actionTire'
import { Leap } from './leap'
import { modeController } from './modeController'
import { Motion } from './motion'
import { statusBarItem } from './statusBarItem'
import { TextObject } from './textObject'
import { reverseCase } from './util'
import { logger } from './util/logger'

const enum SequenceKind {
  Init,
  Digit,
  Command,
  ArgStr,
  Invoke,
}

class ConsumerSequence {
  [SequenceKind.Digit] = '';
  [SequenceKind.Command] = '';
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
  private inComposition = false
  private compositionSequence = ''
  private actionTireNode = actionTire
  private sequence = new ConsumerSequence()
  constructor(context: ExtensionContext) {
    const handler = this.handleSequence()
    const leap = new Leap(context)
    handler.next()
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
          case 'normal':
          case 'visual':
            if (this.inComposition) {
              this.compositionSequence += arg.text
            } else {
              handler.next(arg.text)
            }
            return
        }
      }),
      commands.registerCommand('compositionStart', (arg) => {
        switch (modeController.mode) {
          case 'insert':
            return commands.executeCommand('default:compositionStart', arg)
          case 'normal':
          case 'visual':
            this.inComposition = true
            return
        }
      }),
      commands.registerCommand('compositionEnd', async (arg) => {
        switch (modeController.mode) {
          case 'insert':
            return commands.executeCommand('default:compositionEnd', arg)
          case 'normal':
          case 'visual':
            this.inComposition = false
            for (const key of this.compositionSequence) {
              handler.next(key)
            }
            this.compositionSequence = ''
            return
        }
      }),
      commands.registerCommand('vincode.nextSequence', (key) =>
        handler.next(key),
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
    const handlers: Record<string, ActionHandler> & ThisType<typeof Motion> = {
      ''(context) {
        const editor = window.activeTextEditor!
        editor.revealRange((editor.selection = this.getRanges(context)[0]))
      },
      async c(context: ActionHandlerContext) {
        await handlers.d(context)
        await modeController.setMode('insert')
      },
      async d(context: ActionHandlerContext) {
        await window.activeTextEditor!.edit((edit) => {
          for (const range of this.getRanges(context)) {
            if (!range.isEmpty) {
              edit.delete(range)
            }
          }
        })
      },
      async y(context: ActionHandlerContext) {
        const { document } = window.activeTextEditor!
        await env.clipboard.writeText(
          this.getRanges(context)
            .map((range) => document.getText(range))
            .join('\n'),
        )
      },
      async gs(context: ActionHandlerContext) {
        const { document } = window.activeTextEditor!
        await env.clipboard.writeText(
          this.getRanges(context)
            .map((range) => document.getText(range))
            .join('\n'),
        )
      },
      async gu(context: ActionHandlerContext, lower = true) {
        const editor = window.activeTextEditor!
        const { document } = editor
        await editor.edit((edit) => {
          for (const range of this.getRanges(context)) {
            if (!range.isEmpty) {
              edit.replace(
                range,
                document
                  .getText(range)
                  [`toLocale${lower ? 'Low' : 'Upp'}erCase`](),
              )
            }
          }
        })
      },
      gU(context) {
        return handlers.gu(context, false)
      },
      async '~'(context: ActionHandlerContext, forward = true) {
        const editor = window.activeTextEditor!
        const { document } = editor
        await editor.edit((edit) => {
          for (const range of this.getRanges(context)) {
            if (!range.isEmpty) {
              edit.replace(range, reverseCase(document.getText(range)))
            }
          }
        })
        editor.revealRange(
          (editor.selection = new Selection(
            editor.selection.anchor,
            document.validatePosition(
              editor.selection.active.translate(undefined, forward ? 1 : -1),
            ),
          )),
        )
      },
      'g~'(context) {
        return handlers['~'](context, false)
      },
    }
    for (const [key, meta] of Motion) {
      for (const [prefix, handler] of Object.entries(handlers)) {
        actionTire.add(prefix + key, { ...meta, handler })
      }
    }
    for (const key of TextObject) {
      for (const [prefix, handler] of Object.entries(handlers)) {
        actionTire.add(prefix + key, {
          kind: ActionHandlerKind.Immediate,
          handler,
        })
      }
    }
    for (const [key, meta] of Action) {
      actionTire.add(key, meta)
    }
    console.log(Array.from(actionTire))
  }
  updateStatusBarItem() {
    statusBarItem.text = `|-${modeController.mode.toUpperCase()}-| ${this.sequence.toString()}`
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
          void this.actionTireNode.meta!.handler({
            command: this.sequence[SequenceKind.Command],
            count: digit.length ? +digit : undefined,
            argStr: this.sequence[SequenceKind.ArgStr],
          })
          this.clear()
        } catch (e) {
          throw `handler failed for ${this.sequence.toString()}: ${e as any}`
        }
        break
    }
    return false
  }
  *handleSequence(): Generator<void, void, string> {
    while (true) {
      const key = yield
      try {
        while (this.nextSequence(key)) {}
        this.updateStatusBarItem()
      } catch (e) {
        this.clear()
        logger.error(`nextSequence: ${e as any}`)
      }
    }
  }
}
