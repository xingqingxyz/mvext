/* eslint-disable @typescript-eslint/no-unused-vars */
import { Position, Selection, window, type TextDocument } from 'vscode'
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
import { findRegexp, findWord } from './util/findMethod'

export class Motion {
  //#region keepLine
  '0'(document: TextDocument, position: Position, count: number): Position {
    return position.with(undefined, 0)
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
    const savePosition = position
    // please keep regexp char order
    for (position of preLookupRegExp(document, position, /[([{<]/g)) {
      if (!--count) {
        break
      }
    }
    return position.isEqual(savePosition)
      ? bracketPairLookup(document, position)
      : position
  }
  '/'(
    document: TextDocument,
    position: Position,
    count: number,
    findSequence: string,
    findType: '/' | '?' = '/',
  ): Position {
    if (!findSequence.length) {
      return findRegexp(document, position, count, {
        findRegexp: findRegexp.context.findRegexp,
        findType,
      })
    }
    try {
      return findRegexp(document, position, count, {
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
    return findRegexp(document, position, count, {
      ...findRegexp.context,
      reverse: false,
    })
  }
  N(document: TextDocument, position: Position, count: number): Position {
    return findRegexp(document, position, count, {
      ...findRegexp.context,
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
    useSpace = false,
  ): Position {
    for (position of (backward ? preLookupRegExp : postLookupRegExp)(
      document,
      position,
      useSpace ? /(?<=\s)\S/g : /(?<=\W)\w/g,
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
    return this.w(document, position, count, false, true)
  }
  b(document: TextDocument, position: Position, count: number): Position {
    return this.w(document, position, count, true, false)
  }
  B(document: TextDocument, position: Position, count: number): Position {
    return this.w(document, position, count, true, true)
  }
  e(
    document: TextDocument,
    position: Position,
    count: number,
    backward = false,
    useSpace = false,
  ): Position {
    // hack solves string slice debuff
    if (backward) {
      count++
    }
    for (position of (backward ? preLookupRegExp : postLookupRegExp)(
      document,
      position,
      useSpace ? /(?<=\S)(?:\s|$)/g : /(?<=\w)\b/g,
      backward,
    )) {
      if (!--count) {
        break
      }
    }
    return position
  }
  E(document: TextDocument, position: Position, count: number): Position {
    return this.e(document, position, count, false, true)
  }
  ge(document: TextDocument, position: Position, count: number): Position {
    return this.e(document, position, count, true, false)
  }
  gE(document: TextDocument, position: Position, count: number): Position {
    return this.e(document, position, count, true, true)
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
    return findWord(document, position, count, {
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
    return findWord(document, position, count, {
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
    return findWord(document, position, count, {
      findType: 't',
      findSequence,
    })
  }
  T(
    document: TextDocument,
    position: Position,
    count: number,
    findSequence: string,
  ): Position {
    return findWord(document, position, count, {
      findType: 'T',
      findSequence,
    })
  }
  ';'(document: TextDocument, position: Position, count: number): Position {
    return findWord(document, position, count, findWord.context)
  }
  ','(document: TextDocument, position: Position, count: number): Position {
    return findWord(document, position, count, {
      ...findWord.context,
      reverse: true,
    })
  }
  h(document: TextDocument, position: Position, count: number): Position {
    return position.with(undefined, Math.max(0, position.character - count))
  }
  j(document: TextDocument, position: Position, count: number): Position {
    return document.validatePosition(position.translate(count))
  }
  k(document: TextDocument, position: Position, count: number): Position {
    return document.validatePosition(position.translate(-count))
  }
  l(document: TextDocument, position: Position, count: number): Position {
    return document.validatePosition(position.translate(undefined, +count))
  }
  H(document: TextDocument, position: Position, count: number): Position {
    return window.activeTextEditor!.visibleRanges[0].start.with(undefined, 0)
  }
  M(document: TextDocument, position: Position, count: number): Position {
    const range = window.activeTextEditor!.visibleRanges[0]
    return new Position((range.start.line + range.end.line) >> 1, 0)
  }
  L(document: TextDocument, position: Position, count: number): Position {
    return window.activeTextEditor!.visibleRanges[0].end.with(undefined, 0)
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
      case 5:
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
