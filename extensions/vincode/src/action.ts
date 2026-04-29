/* eslint-disable @typescript-eslint/no-unused-vars */
import { commands, env, Position, Range, Selection, window } from 'vscode'
import { ActionHandlerKind, type ActionMeta } from './actionTire'
import { modeController } from './modeController'

export class Action {
  static async r(count: number) {
    await modeController.setMode('insert')
    await commands.executeCommand('editor.action.toggleOvertypeInsertMode')
  }
  static R(count: number) {
    return this.r(count)
  }
  static async u(count: number) {
    while (count--) {
      await commands.executeCommand('undo')
    }
  }
  static async U(count: number) {
    while (count--) {
      await commands.executeCommand('redo')
    }
  }
  static async i(count: number) {
    await modeController.setMode('insert')
  }
  static async I(count: number) {
    await modeController.setMode('insert')
    await commands.executeCommand('cursorHome')
  }
  static async a(count: number) {
    const editor = window.activeTextEditor!
    const position = editor.document.validatePosition(
      new Position(
        editor.selection.active.line,
        editor.selection.active.character + 1,
      ),
    )
    editor.selection = new Selection(position, position)
    await modeController.setMode('insert')
  }
  static async A(count: number) {
    await modeController.setMode('insert')
    await commands.executeCommand('cursorEnd')
  }
  static async o(count: number) {
    await modeController.setMode('insert')
    await commands.executeCommand('editor.action.insertLineAfter')
  }
  static async O(count: number) {
    await modeController.setMode('insert')
    await commands.executeCommand('editor.action.insertLineBefore')
  }
  static async p(count: number) {
    const text = await env.clipboard.readText()
    const editor = window.activeTextEditor!
    await editor.edit((edit) =>
      edit.replace(editor.selection, text.repeat(count)),
    )
  }
  static async P(count: number) {
    const text = await env.clipboard.readText()
    const editor = window.activeTextEditor!
    if (editor.selection.isEmpty) {
      const position = new Position(
        editor.selection.start.line,
        Math.max(0, editor.selection.start.character - 1),
      )
      editor.selection = new Selection(position, position)
    }
    await editor.edit((edit) =>
      edit.replace(editor.selection, text.repeat(count)),
    )
  }
  static async yy(count: number) {
    const {
      document,
      selection: { active },
    } = window.activeTextEditor!
    await env.clipboard.writeText(
      document.getText(
        new Range(
          active.line,
          0,
          Math.min(document.lineCount, active.line + count),
          0,
        ),
      ),
    )
  }
  static async Y(count: number) {
    const {
      document,
      selection: { active },
    } = window.activeTextEditor!
    await env.clipboard.writeText(
      document.getText(
        new Range(
          active,
          new Position(Math.min(document.lineCount, active.line + count), 0),
        ),
      ),
    )
  }
  static async dd(count: number) {
    const editor = window.activeTextEditor!
    const {
      document,
      selection: { active },
    } = editor
    await editor.edit((edit) =>
      edit.delete(
        new Range(
          active.line,
          0,
          Math.min(document.lineCount, active.line + count),
          0,
        ),
      ),
    )
  }
  static async D(count: number) {
    const editor = window.activeTextEditor!
    const {
      document,
      selection: { active },
    } = editor
    await editor.edit((edit) =>
      edit.delete(
        new Range(
          active,
          new Position(Math.min(document.lineCount, active.line + count), 0),
        ),
      ),
    )
  }
  static async x(count: number) {
    const editor = window.activeTextEditor!
    const {
      selection: { start },
    } = editor
    if (editor.selection.isEmpty) {
      await editor.edit((edit) =>
        edit.delete(
          new Range(
            start,
            editor.document.validatePosition(
              start.with(undefined, start.character + count),
            ),
          ),
        ),
      )
    } else {
      await editor.edit((edit) =>
        editor.selections.forEach((selection) => edit.delete(selection)),
      )
    }
  }
  static async X(count: number) {
    const editor = window.activeTextEditor!
    const {
      selection: { start },
    } = editor
    if (editor.selection.isEmpty) {
      await editor.edit((edit) =>
        edit.delete(
          new Range(
            start,
            new Position(start.line, Math.max(0, start.character - count)),
          ),
        ),
      )
    } else {
      await editor.edit((edit) =>
        editor.selections.forEach((selection) => edit.delete(selection)),
      )
    }
  }
  static async cc(count: number) {
    await this.dd(count)
    await modeController.setMode('insert')
  }
  static async C(count: number) {
    await this.D(count)
    await modeController.setMode('insert')
  }
  static V(count: number) {
    const editor = window.activeTextEditor!
    const {
      document,
      selection: { active },
    } = editor
    editor.selection = new Selection(
      active.with(undefined, 0),
      new Position(Math.min(document.lineCount, active.line + count), 0),
    )
  }
  static async grr(count: number) {
    const editor = window.activeTextEditor!
    const {
      document,
      selection: { active },
    } = editor
    const text = await env.clipboard.readText()
    await editor.edit((edit) =>
      edit.replace(
        new Range(
          active.line,
          0,
          Math.min(document.lineCount, active.line + count),
          0,
        ),
        text + '\n',
      ),
    )
  }
  static async grR(count: number) {
    const editor = window.activeTextEditor!
    const {
      document,
      selection: { active },
    } = editor
    const text = await env.clipboard.readText()
    await editor.edit((edit) =>
      edit.replace(
        new Range(
          active,
          new Position(Math.min(document.lineCount, active.line + count), 0),
        ),
        text,
      ),
    )
  }
  static async ' '(count: number) {}
  static async '\\k'(count: number) {
    await commands.executeCommand('vincode.manKeyword')
  }
  static async '\\w'(count: number) {
    await commands.executeCommand('vincode.leapToWordStart')
  }
  static async '\\l'(count: number) {
    await modeController.setMode('less')
  }
  static async S(count: number, char: string) {
    const editor = window.activeTextEditor!
    if (editor.selection.isEmpty) {
      return
    }
    let rpair, index
    if ((index = '([{<'.indexOf(char)) !== -1) {
      char = char.repeat(count)
      rpair = ')]}>'[index].repeat(count)
    } else if ((index = ')]}>'.indexOf(char)) !== -1) {
      rpair = ' ' + char.repeat(count)
      char = '([{<'[index].repeat(count) + ' '
    } else {
      char = rpair = char.repeat(count)
    }
    await editor.edit((edit) =>
      editor.selections.forEach((selection) =>
        edit.replace(
          selection,
          char + editor.document.getText(selection) + rpair,
        ),
      ),
    )
  }
  static *[Symbol.iterator](): Generator<[string, ActionMeta]> {
    for (const name of Object.getOwnPropertyNames(this)) {
      switch (this[name as 'C'].length) {
        case 1:
          yield [
            name,
            {
              kind: ActionHandlerKind.Immediate,
              handler: (context) => this[name as 'C'](context.count ?? 1),
            },
          ]
          break
        case 2:
          yield [
            name,
            {
              kind: ActionHandlerKind.Count,
              count: 1,
              handler: (context) =>
                this[name as 'S'](context.count ?? 1, context.argStr!),
            },
          ]
          break
        default:
          console.log('skipped action key ' + name)
          break
      }
    }
  }
}
