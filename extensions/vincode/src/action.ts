/* eslint-disable @typescript-eslint/no-unused-vars */
import { commands, env, Position, Range, Selection, window } from 'vscode'
import { ActionHandlerKind, type ActionMeta } from './actionTire'
import { modeController } from './modeController'
import { reverseCase } from './util'

class Action {
  async r(count: number) {
    await modeController.setMode('insert')
    await commands.executeCommand('editor.action.toggleOvertypeInsertMode')
  }
  async R(count: number) {
    await modeController.setMode('insert')
    await await commands.executeCommand(
      'editor.action.toggleOvertypeInsertMode',
    )
  }
  async u(count: number) {
    while (count--) {
      await commands.executeCommand('undo')
    }
  }
  async U(count: number) {
    while (count--) {
      await commands.executeCommand('redo')
    }
  }
  async i(count: number) {
    await modeController.setMode('insert')
  }
  async I(count: number) {
    await modeController.setMode('insert')
    await commands.executeCommand('cursorHome')
  }
  async a(count: number) {
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
  async A(count: number) {
    await modeController.setMode('insert')
    await commands.executeCommand('cursorEnd')
  }
  async o(count: number) {
    await modeController.setMode('insert')
    await commands.executeCommand('editor.action.insertLineAfter')
  }
  async O(count: number) {
    await modeController.setMode('insert')
    await commands.executeCommand('editor.action.insertLineBefore')
  }
  async p(count: number) {
    const text = await env.clipboard.readText()
    const editor = window.activeTextEditor!
    await editor.edit((edit) =>
      edit.replace(editor.selection, text.repeat(count)),
    )
  }
  async P(count: number) {
    const text = await env.clipboard.readText()
    const editor = window.activeTextEditor!
    if (editor.selection.isEmpty) {
      const position = new Position(
        editor.selection.start.line,
        Math.max(0, editor.selection.start.character - 1),
      )
      editor.selection = new Selection(position, position)
      await editor.edit((edit) => edit.insert(position, text.repeat(count)))
    } else {
      await editor.edit((edit) =>
        edit.replace(editor.selection, text.repeat(count)),
      )
    }
  }
  async yy(count: number) {
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
  async Y(count: number) {
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
  async dd(count: number) {
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
  async D(count: number) {
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
  async x(count: number) {
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
  async X(count: number) {
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
  async cc(count: number) {
    await modeController.setMode('insert')
    await this.dd(count)
  }
  async C(count: number) {
    await modeController.setMode('insert')
    await this.D(count)
  }
  V(count: number) {
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
  async grr(count: number) {
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
        text,
      ),
    )
  }
  async gR(count: number) {
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
  async '~'(count: number) {
    const editor = window.activeTextEditor!
    const {
      document,
      selection: { start },
    } = editor
    if (editor.selection.isEmpty) {
      const range = new Range(
        start,
        editor.document.validatePosition(
          start.with(undefined, start.character + count),
        ),
      )
      await editor.edit((edit) =>
        edit.replace(range, reverseCase(document.getText(range))),
      )
    } else {
      await editor.edit((edit) =>
        editor.selections.forEach((selection) =>
          edit.replace(selection, reverseCase(document.getText(selection))),
        ),
      )
    }
  }
  async ' '(count: number) {}
  async v(count: number) {
    await modeController.setMode(
      modeController.mode === 'visual' ? 'normal' : 'visual',
    )
  }
  async '\\m'(count: number) {
    await commands.executeCommand('vincode.manKeyword')
  }
  async '\\w'(count: number) {
    await commands.executeCommand('vincode.leapToWordStart')
  }
  async '\\l'(count: number) {
    await modeController.setMode('less')
  }
  async gu(count: number) {
    const editor = window.activeTextEditor!
    if (editor.selection.isEmpty) {
      return
    }
    await editor.edit((edit) =>
      editor.selections.forEach((selection) =>
        edit.replace(
          selection,
          editor.document.getText(selection).toLowerCase(),
        ),
      ),
    )
  }
  async gU(count: number) {
    const editor = window.activeTextEditor!
    if (editor.selection.isEmpty) {
      return
    }
    await editor.edit((edit) =>
      editor.selections.forEach((selection) =>
        edit.replace(
          selection,
          editor.document.getText(selection).toUpperCase(),
        ),
      ),
    )
  }
  async S(count: number, char: string) {
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
}

export function* produceAction(): Generator<[string, ActionMeta]> {
  const action = new Action()
  for (const name of Object.getOwnPropertyNames(Action.prototype)) {
    switch (Action.prototype[name as '~'].length) {
      case 1:
        yield [
          name,
          {
            kind: ActionHandlerKind.Immediate,
            handler(context) {
              action[name as '~'](context.count ?? 1)
            },
          },
        ]
        break
      case 2:
        yield [
          name,
          {
            kind: ActionHandlerKind.Count,
            count: 1,
            handler(context) {
              action[name as 'S'](context.count ?? 1, context.argStr!)
            },
          },
        ]
        break
      default:
        console.log('skipped action key ' + name)
        break
    }
  }
}
