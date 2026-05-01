/* eslint-disable @typescript-eslint/no-unused-vars */
import { Position, Selection, window, type TextDocument } from 'vscode'
import {
  ActionHandlerKind,
  type ActionHandler,
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
import {
  findRegexp,
  findRegexpContext,
  findWord,
  findWordContext,
} from './util/findMethod'

export class Motion {
  //#region keepLine
  static '0'(
    document: TextDocument,
    position: Position,
    count: number,
  ): Position {
    return position.with(undefined, 0)
  }
  static '|'(
    document: TextDocument,
    position: Position,
    count: number,
  ): Position {
    return document.validatePosition(position.with(undefined, count - 1))
  }
  //#endregion
  static _(
    document: TextDocument,
    position: Position,
    count: number,
  ): Position {
    return new Position(
      Math.max(0, position.line - count + 1),
      document.lineAt(position).firstNonWhitespaceCharacterIndex,
    )
  }
  static $(
    document: TextDocument,
    position: Position,
    count: number,
  ): Position {
    return document.lineAt(
      Math.min(document.lineCount - 1, position.line + count - 1),
    ).range.end
  }
  static '*'(
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
  static '#'(
    document: TextDocument,
    position: Position,
    count: number,
  ): Position {
    return this['*'](document, position, count, true)
  }
  static '%'(
    document: TextDocument,
    position: Position,
    count: number,
  ): Position {
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
  static '/'(
    document: TextDocument,
    position: Position,
    count: number,
    findSequence: string,
    findType: '/' | '?' = '/',
  ): Position {
    if (!findSequence.length) {
      return findRegexp(document, position, count, {
        findRegexp: findRegexpContext.findRegexp,
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
  static '?'(
    document: TextDocument,
    position: Position,
    count: number,
    findSequence: string,
  ): Position {
    return this['/'](document, position, count, findSequence, '?')
  }
  static n(
    document: TextDocument,
    position: Position,
    count: number,
  ): Position {
    return findRegexp(document, position, count, {
      ...findRegexpContext,
      reverse: false,
    })
  }
  static N(
    document: TextDocument,
    position: Position,
    count: number,
  ): Position {
    return findRegexp(document, position, count, {
      ...findRegexpContext,
      reverse: true,
    })
  }
  static '('(
    document: TextDocument,
    position: Position,
    count: number,
  ): Position {
    return this[')'](document, position, count, true)
  }
  static ')'(
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
  static '{'(
    document: TextDocument,
    position: Position,
    count: number,
  ): Position {
    return this['}'](document, position, count, true)
  }
  static '}'(
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
  static '[['(
    document: TextDocument,
    position: Position,
    count: number,
  ): Position {
    throw new Error('Function not implemented.')
  }
  static ']]'(
    document: TextDocument,
    position: Position,
    count: number,
  ): Position {
    throw new Error('Function not implemented.')
  }
  static w(
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
  static W(
    document: TextDocument,
    position: Position,
    count: number,
    backward = false,
  ): Position {
    return this.w(document, position, count, false, true)
  }
  static b(
    document: TextDocument,
    position: Position,
    count: number,
  ): Position {
    return this.w(document, position, count, true, false)
  }
  static B(
    document: TextDocument,
    position: Position,
    count: number,
  ): Position {
    return this.w(document, position, count, true, true)
  }
  static e(
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
  static E(
    document: TextDocument,
    position: Position,
    count: number,
  ): Position {
    return this.e(document, position, count, false, true)
  }
  static ge(
    document: TextDocument,
    position: Position,
    count: number,
  ): Position {
    return this.e(document, position, count, true, false)
  }
  static gE(
    document: TextDocument,
    position: Position,
    count: number,
  ): Position {
    return this.e(document, position, count, true, true)
  }
  static G(
    document: TextDocument,
    position: Position,
    count = document.lineCount,
  ): Position {
    return document.validatePosition(new Position(count - 1, 0))
  }
  static gg(document: TextDocument, position: Position, count = 1): Position {
    return document.validatePosition(new Position(count - 1, 0))
  }
  static f(
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
  static F(
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
  static t(
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
  static T(
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
  static ';'(
    document: TextDocument,
    position: Position,
    count: number,
  ): Position {
    return findWord(document, position, count, findWordContext)
  }
  static ','(
    document: TextDocument,
    position: Position,
    count: number,
  ): Position {
    return findWord(document, position, count, {
      ...findWordContext,
      reverse: true,
    })
  }
  static h(
    document: TextDocument,
    position: Position,
    count: number,
  ): Position {
    return position.with(undefined, Math.max(0, position.character - count))
  }
  static j(
    document: TextDocument,
    position: Position,
    count: number,
  ): Position {
    return document.validatePosition(position.translate(count))
  }
  static k(
    document: TextDocument,
    position: Position,
    count: number,
  ): Position {
    return document.validatePosition(position.translate(-count))
  }
  static l(
    document: TextDocument,
    position: Position,
    count: number,
  ): Position {
    return document.validatePosition(position.translate(undefined, +count))
  }
  static H(
    document: TextDocument,
    position: Position,
    count: number,
  ): Position {
    return window.activeTextEditor!.visibleRanges[0].start.with(undefined, 0)
  }
  static M(
    document: TextDocument,
    position: Position,
    count: number,
  ): Position {
    const range = window.activeTextEditor!.visibleRanges[0]
    return new Position((range.start.line + range.end.line) >> 1, 0)
  }
  static L(
    document: TextDocument,
    position: Position,
    count: number,
  ): Position {
    return window.activeTextEditor!.visibleRanges[0].end.with(undefined, 0)
  }
  static getRanges(context: ActionHandlerContext) {
    const editor = window.activeTextEditor!
    return editor.selections.map((selection) => {
      let method = context.command
      switch (method.length) {
        case 1:
          break
        case 2:
          method = method in this ? method : method.slice(1)
          break
        case 3:
        case 4:
          method = method.slice(method.startsWith('g') ? 2 : 1)
          break
        default:
          throw Error(`${this.name}: unknown method ${method}`)
      }
      const position = this[method as '?'](
        editor.document,
        selection.active,
        context.count ?? 1,
        context.argStr!,
      )
      return new Selection(
        selection.isEmpty ? position : selection.anchor,
        position,
      )
    })
  }
  static *[Symbol.iterator](): Generator<[string, ActionMeta]> {
    let meta: ActionMeta
    const handler: ActionHandler = async (context) => {
      window.activeTextEditor!.selections = this.getRanges(context)
    }
    for (const key of Object.getOwnPropertyNames(this) as 'n'[]) {
      switch (this[key].length) {
        case 2:
        case 3:
        case 5:
          meta = { kind: ActionHandlerKind.Immediate, handler }
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
          console.log(`${this.name}: registered handler ${key}: ${meta.kind}`)
          break
        default:
          console.log(`${this.name}: skipped key ${key}`)
          continue
      }
      yield [key, meta]
    }
  }
}
