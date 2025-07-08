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
import {
  bracketPairLookup,
  postLookup,
  postLookupRegExp,
  preLookup,
  preLookupRegExp,
} from './util/bracketLookup'
import { findMethod } from './util/findMethod'

class Motion {
  //#region keepLine
  '0'(document: TextDocument, position: Position, count: number): Position {
    return document.lineAt(position).range.start
  }
  '|'(document: TextDocument, position: Position, count: number): Position {
    return document.validatePosition(position.with(undefined, count - 1))
  }
  //#endregion
  '^'(document: TextDocument, position: Position, count: number): Position {
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
      range.end,
      document.getText(range),
      false,
      true,
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
  '-'(document: TextDocument, position: Position, count: number): Position {
    count = Math.max(0, position.line - count)
    return new Position(
      count,
      document.lineAt(count).firstNonWhitespaceCharacterIndex,
    )
  }
  '+'(document: TextDocument, position: Position, count: number): Position {
    count = Math.min(document.lineCount - 1, position.line + count)
    return new Position(
      count,
      document.lineAt(count).firstNonWhitespaceCharacterIndex,
    )
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
  ')'(
    document: TextDocument,
    position: Position,
    count: number,
    backward = false,
  ): Position {
    throw new Error('Function not implemented.')
  }
  '('(document: TextDocument, position: Position, count: number): Position {
    return this[')'](document, position, count, true)
  }
  '['(document: TextDocument, position: Position, count: number): Position {
    throw new Error('Function not implemented.')
  }
  ']'(document: TextDocument, position: Position, count: number): Position {
    throw new Error('Function not implemented.')
  }
  '{'(document: TextDocument, position: Position, count: number): Position {
    throw new Error('Function not implemented.')
  }
  '}'(document: TextDocument, position: Position, count: number): Position {
    throw new Error('Function not implemented.')
  }
  '`'(document: TextDocument, position: Position, count: number): Position {
    throw new Error('Function not implemented.')
  }
  "'"(document: TextDocument, position: Position, count: number): Position {
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
      /\b\w/g,
      !backward,
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
      /(?=\s)\S/g,
      !backward,
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
    for (position of (backward ? preLookupRegExp : postLookupRegExp)(
      document,
      position,
      /(?=\w)\b/g,
      !backward,
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
    for (position of (backward ? preLookupRegExp : postLookupRegExp)(
      document,
      position,
      /(?=\S)\s/g,
      !backward,
    )) {
      if (!--count) {
        break
      }
    }
    return position
  }
  ge(document: TextDocument, position: Position, count: number): Position {
    return this.e(document, position, count, false)
  }
  gE(document: TextDocument, position: Position, count: number): Position {
    return this.E(document, position, count, false)
  }
  b(document: TextDocument, position: Position, count: number): Position {
    return this.w(document, position, count, false)
  }
  B(document: TextDocument, position: Position, count: number): Position {
    return this.W(document, position, count, false)
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
    return position.with(
      Math.min(document.lineCount - 1, position.line + count),
    )
  }
  k(document: TextDocument, position: Position, count: number): Position {
    return position.with(Math.max(0, position.line - count))
  }
  l(document: TextDocument, position: Position, count: number): Position {
    return document.validatePosition(
      position.with(undefined, position.character + count),
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
  cursorMove(context: ActionHandlerContext) {
    const editor = window.activeTextEditor!
    const position = this[context.command as 'f'](
      editor.document,
      editor.selection.active,
      this[context.command as 'G'].length === 2
        ? context.count!
        : (context.count ?? 1),
      context.argStr!,
    )
    editor.selection = context.select
      ? new Selection(editor.selection.anchor, position)
      : new Selection(position, position)
    editor.revealRange(editor.selection)
  }
}
Motion.prototype['_' as 'n'] = Motion.prototype['^']

export function* produceAction(): Generator<[string, ActionMeta]> {
  const motion = new Motion()
  const handler = motion.cursorMove.bind(motion)
  let meta: ActionMeta
  for (const key of Object.getOwnPropertyNames(Motion.prototype) as 'n'[]) {
    switch (motion[key].length) {
      case 2:
      case 3:
        meta = { kind: ActionHandlerKind.Invoke, handler }
        break
      case 4:
        meta = '/?'.includes(key)
          ? {
              kind: ActionHandlerKind.Terminator,
              terminator: '\n',
              handler,
            }
          : {
              kind: ActionHandlerKind.Count,
              count: 1,
              handler,
            }
        break
      default:
        console.log('skiped motion key ' + key)
        continue
    }
    yield [key, meta]
  }
}
