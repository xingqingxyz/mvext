/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Position,
  Selection,
  window,
  workspace,
  type TextDocument,
} from 'vscode'
import {
  ActionHandlerKind,
  type ActionHandlerContext,
  type ActionMeta,
} from './actionTire'
import { modeController } from './modeController'
import { noop } from './util'
import {
  bracketPairLookup,
  postLookup,
  postLookupRegExp,
  preLookup,
  preLookupRegExp,
} from './util/bracketLookup'
import { findMethod } from './util/findMethod'

export class Motion {
  //#region keepLine
  '0'(document: TextDocument, position: Position, count: number): Position {
    return document.lineAt(position).range.start
  }
  '|'(document: TextDocument, position: Position, count: number): Position {
    return document.validatePosition(position.with(undefined, count - 1))
  }
  //#endregion
  _(document: TextDocument, position: Position, count: number): Position {
    return new Position(
      Math.max(0, position.line - count + 1),
      document.lineAt(position).firstNonWhitespaceCharacterIndex,
    )
  }
  $(document: TextDocument, position: Position, count: number): Position {
    return document.lineAt(
      Math.min(document.lineCount - 1, position.line + count - 1),
    ).range.end
  }
  '*'(
    document: TextDocument,
    position: Position,
    count: number,
    backward = false,
  ): Position {
    const { selection } = window.activeTextEditor!
    const range = selection.isEmpty
      ? document.getWordRangeAtPosition(position)
      : selection
    if (!range) {
      return position
    }
    for (position of (backward ? preLookup : postLookup)(
      document,
      backward ? range.start : range.end,
      document.getText(range),
      false,
      backward,
    )) {
      if (!--count) {
        break
      }
    }
    return position
  }
  '#'(document: TextDocument, position: Position, count: number): Position {
    return this['*'](document, position, count, true)
  }
  '%'(document: TextDocument, position: Position, count: number): Position {
    // please keep regexp char order
    for (const pos of preLookupRegExp(document, position, /[([{<)\]}>]/g)) {
      if (!--count) {
        return pos.isEqual(position) ? bracketPairLookup(document, pos) : pos
      }
    }
    return position
  }
  '/'(
    document: TextDocument,
    position: Position,
    count: number,
    findSequence: string,
    findType: '/' | '?' = '/',
  ): Position {
    if (!findSequence.length) {
      return findMethod.findRegexp(document, position, count, {
        findRegexp: findMethod.findRegexpContext.findRegexp,
        findType,
      })
    }
    try {
      return findMethod.findRegexp(document, position, count, {
        findRegexp: new RegExp(findSequence, 'g'),
        findType,
      })
    } catch {
      return position
    }
  }
  '?'(
    document: TextDocument,
    position: Position,
    count: number,
    findSequence: string,
  ): Position {
    return this['/'](document, position, count, findSequence, '?')
  }
  n(document: TextDocument, position: Position, count: number): Position {
    return findMethod.findRegexp(document, position, count, {
      ...findMethod.findRegexpContext,
      reverse: false,
    })
  }
  N(document: TextDocument, position: Position, count: number): Position {
    return findMethod.findRegexp(document, position, count, {
      ...findMethod.findRegexpContext,
      reverse: true,
    })
  }
  '('(document: TextDocument, position: Position, count: number): Position {
    return this[')'](document, position, count, true)
  }
  ')'(
    document: TextDocument,
    position: Position,
    count: number,
    backward = false,
  ): Position {
    // regex index at multi start
    if (
      !backward &&
      '!?=,.:;'.includes(document.lineAt(position).text[position.character])
    ) {
      count++
    }
    for (position of (backward ? preLookupRegExp : postLookupRegExp)(
      document,
      position,
      /[!?=,.:;]+/g,
      backward,
    )) {
      if (!--count) {
        break
      }
    }
    return position
  }
  '{'(document: TextDocument, position: Position, count: number): Position {
    return this['}'](document, position, count, true)
  }
  '}'(
    document: TextDocument,
    position: Position,
    count: number,
    backward = false,
  ): Position {
    for (position of (backward ? preLookupRegExp : postLookupRegExp)(
      document,
      backward
        ? document.lineAt(Math.max(0, position.line - 1)).range.end
        : document.lineAt(Math.min(document.lineCount, position.line + 1)).range
            .start,
      /^\s*$/g,
    )) {
      if (!--count) {
        break
      }
    }
    return position
  }
  '[['(document: TextDocument, position: Position, count: number): Position {
    throw new Error('Function not implemented.')
  }
  ']]'(document: TextDocument, position: Position, count: number): Position {
    throw new Error('Function not implemented.')
  }
  w(
    document: TextDocument,
    position: Position,
    count: number,
    backward = false,
  ): Position {
    for (position of (backward ? preLookupRegExp : postLookupRegExp)(
      document,
      position,
      /(?<=\W)\w/g,
      backward,
    )) {
      if (!--count) {
        break
      }
    }
    return position
  }
  W(
    document: TextDocument,
    position: Position,
    count: number,
    backward = false,
  ): Position {
    for (position of (backward ? preLookupRegExp : postLookupRegExp)(
      document,
      position,
      /(?<=\s)\S/g,
      backward,
    )) {
      if (!--count) {
        break
      }
    }
    return position
  }
  e(
    document: TextDocument,
    position: Position,
    count: number,
    backward = false,
  ): Position {
    // hack solves string slice debuff
    if (backward) {
      count++
    }
    for (position of (backward ? preLookupRegExp : postLookupRegExp)(
      document,
      position,
      /(?<=\w)\b/g,
      backward,
    )) {
      if (!--count) {
        break
      }
    }
    return position
  }
  E(
    document: TextDocument,
    position: Position,
    count: number,
    backward = false,
  ): Position {
    // hack solves string slice debuff
    if (backward) {
      count++
    }
    for (position of (backward ? preLookupRegExp : postLookupRegExp)(
      document,
      position,
      /(?<=\S)(?:\s|$)/g,
      backward,
    )) {
      if (!--count) {
        break
      }
    }
    return position
  }
  ge(document: TextDocument, position: Position, count: number): Position {
    return this.e(document, position, count, true)
  }
  gE(document: TextDocument, position: Position, count: number): Position {
    return this.E(document, position, count, true)
  }
  b(document: TextDocument, position: Position, count: number): Position {
    return this.w(document, position, count, true)
  }
  B(document: TextDocument, position: Position, count: number): Position {
    return this.W(document, position, count, true)
  }
  G(
    document: TextDocument,
    position: Position,
    count = document.lineCount,
  ): Position {
    return document.validatePosition(new Position(count - 1, 0))
  }
  gg(document: TextDocument, position: Position, count = 1): Position {
    return document.validatePosition(new Position(count - 1, 0))
  }
  f(
    document: TextDocument,
    position: Position,
    count: number,
    findSequence: string,
  ): Position {
    return findMethod.findWord(document, position, count, {
      findType: 'f',
      findSequence,
    })
  }
  F(
    document: TextDocument,
    position: Position,
    count: number,
    findSequence: string,
  ): Position {
    return findMethod.findWord(document, position, count, {
      findType: 'F',
      findSequence,
    })
  }
  t(
    document: TextDocument,
    position: Position,
    count: number,
    findSequence: string,
  ): Position {
    const pos = findMethod.findWord(document, position, count, {
      findType: 't',
      findSequence,
    })
    return pos.isEqual(position)
      ? position
      : position.with(0, pos.character - 1) // assert pos.character > 0
  }
  T(
    document: TextDocument,
    position: Position,
    count: number,
    findSequence: string,
  ): Position {
    const pos = findMethod.findWord(document, position, count, {
      findType: 'T',
      findSequence,
    })
    // assert pos.character + 1 in line
    return pos.isEqual(position) ? position : pos.with(0, pos.character + 1)
  }
  ';'(document: TextDocument, position: Position, count: number): Position {
    return findMethod.findWord(
      document,
      position,
      count,
      findMethod.findWordContext,
    )
  }
  ','(document: TextDocument, position: Position, count: number): Position {
    return findMethod.findWord(document, position, count, {
      ...findMethod.findWordContext,
      reverse: true,
    })
  }
  h(document: TextDocument, position: Position, count: number): Position {
    return position.with(undefined, Math.max(0, position.character - count))
  }
  j(document: TextDocument, position: Position, count: number): Position {
    return document.validatePosition(position.with(position.line + count))
  }
  k(document: TextDocument, position: Position, count: number): Position {
    return document.validatePosition(
      position.with(Math.max(0, position.line - count)),
    )
  }
  l(document: TextDocument, position: Position, count: number): Position {
    return position.with(
      undefined,
      Math.min(
        document.lineAt(position).range.end.character,
        position.character + count,
      ),
    )
  }
  H(document: TextDocument, position: Position, count: number): Position {
    return new Position(
      window.activeTextEditor!.visibleRanges[0].start.line +
        workspace
          .getConfiguration('editor')
          .get<number>('cursorSurroundingLines')!,
      0,
    )
  }
  M(document: TextDocument, position: Position, count: number): Position {
    const range = window.activeTextEditor!.visibleRanges[0]
    return new Position((range.start.line + range.end.line) >> 1, 0)
  }
  L(document: TextDocument, position: Position, count: number): Position {
    return new Position(
      window.activeTextEditor!.visibleRanges[0].end.line -
        workspace
          .getConfiguration('editor')
          .get<number>('cursorSurroundingLines')!,
      0,
    )
  }
  getSeletion(context: ActionHandlerContext) {
    const editor = window.activeTextEditor!
    const command =
      this[context.command as '?'] ?? this[context.command.slice(1) as '?']
    const position = command.call(
      this,
      editor.document,
      editor.selection.active,
      command.length === 2 ? context.count! : (context.count ?? 1),
      context.argStr!,
    )
    return new Selection(
      modeController.mode === 'visual' ? editor.selection.anchor : position,
      position,
    )
  }
  cursorMove(context: ActionHandlerContext) {
    const editor = window.activeTextEditor!
    editor.revealRange((editor.selection = this.getSeletion(context)))
  }
}

export function* produceMeta(): Generator<[string, ActionMeta]> {
  let meta: ActionMeta
  for (const key of Object.getOwnPropertyNames(Motion.prototype) as 'n'[]) {
    switch (Motion.prototype[key].length) {
      case 2:
      case 3:
        meta = { kind: ActionHandlerKind.Immediate, handler: noop }
        break
      case 4:
        meta = '/?'.includes(key)
          ? {
              kind: ActionHandlerKind.Terminator,
              terminator: '\n',
              handler: noop,
            }
          : {
              kind: ActionHandlerKind.Count,
              count: 1,
              handler: noop,
            }
        break
      default:
        console.log('skipped motion key ' + key)
        continue
    }
    yield [key, meta]
  }
}
