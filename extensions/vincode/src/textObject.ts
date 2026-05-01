/* eslint-disable @typescript-eslint/no-unused-vars */
import { Position, Range, window, type TextDocument } from 'vscode'
import { type ActionHandlerContext } from './actionTire'
import {
  pairLookup,
  postLookupRegExp,
  preLookupRegExp,
} from './util/bracketLookup'

export class TextObject {
  static ae(document: TextDocument, position: Position): Range {
    return new Range(0, 0, document.lineCount, 0)
  }
  static aw(
    document: TextDocument,
    position: Position,
    reWord?: RegExp,
  ): Range {
    const range = document.getWordRangeAtPosition(position, reWord)
    if (!range) {
      return new Range(position, position)
    }
    let { character } = range.end
    character += document
      .lineAt(position)
      .text.slice(character)
      .match(/^\s*/)![0].length
    return range.with(undefined, position.with(undefined, character))
  }
  static iw(
    document: TextDocument,
    position: Position,
    reWord?: RegExp,
  ): Range {
    return (
      document.getWordRangeAtPosition(position, reWord) ??
      new Range(position, position)
    )
  }
  static aW(document: TextDocument, position: Position): Range {
    return this.aw(document, position, /\S+/)
  }
  static iW(document: TextDocument, position: Position): Range {
    return this.iw(document, position, /\S+/)
  }
  static at(document: TextDocument, position: Position): Range {
    throw new Error('Function not implemented.')
  }
  static it(document: TextDocument, position: Position): Range {
    throw new Error('Function not implemented.')
  }
  static as(document: TextDocument, position: Position): Range {
    return this.is(document, position, true)
  }
  static is(document: TextDocument, position: Position, outer = false): Range {
    const reSep = /[!?=,.:;]+/g
    let pre = position,
      post = position
    for (pre of preLookupRegExp(document, position, reSep)) {
      break
    }
    for (post of postLookupRegExp(document, position, reSep, true)) {
      break
    }
    if (outer) {
      post = post.translate(undefined, 1)
    }
    return new Range(pre, post)
  }
  static ap(document: TextDocument, position: Position): Range {
    const range = this.ip(document, position)
    if (range.isEmpty) {
      return range
    }
    let post = range.end.line + 1
    while (
      post < document.lineCount &&
      document.lineAt(post).isEmptyOrWhitespace
    ) {
      post++
    }
    post = Math.min(post, document.lineCount - 1)
    return range.with(undefined, new Position(post, 0))
  }
  static ip(document: TextDocument, position: Position): Range {
    if (document.lineAt(position).isEmptyOrWhitespace) {
      return new Range(position, position)
    }
    let pre = position.line - 1,
      post = position.line + 1
    while (pre > 0 && !document.lineAt(pre).isEmptyOrWhitespace) {
      pre--
    }
    pre = Math.max(pre, 0)
    while (
      post < document.lineCount &&
      !document.lineAt(post).isEmptyOrWhitespace
    ) {
      post++
    }
    post = Math.min(post, document.lineCount - 1)
    return new Range(pre, 0, post, 0)
  }
  static if(document: TextDocument, position: Position): Range {
    throw new Error('Function not implemented.')
  }
  static af(document: TextDocument, position: Position): Range {
    throw new Error('Function not implemented.')
  }
  static 'i('(document: TextDocument, position: Position): Range {
    return pairLookup(document, position, ['(', ')'])
  }
  static 'i['(document: TextDocument, position: Position): Range {
    return pairLookup(document, position, ['[', ']'])
  }
  static 'i{'(document: TextDocument, position: Position): Range {
    return pairLookup(document, position, ['{', '}'])
  }
  static 'i<'(document: TextDocument, position: Position): Range {
    return pairLookup(document, position, ['<', '>'])
  }
  static 'a('(document: TextDocument, position: Position): Range {
    return pairLookup(document, position, ['(', ')'], true)
  }
  static 'a['(document: TextDocument, position: Position): Range {
    return pairLookup(document, position, ['[', ']'], true)
  }
  static 'a{'(document: TextDocument, position: Position): Range {
    return pairLookup(document, position, ['{', '}'], true)
  }
  static 'a<'(document: TextDocument, position: Position): Range {
    return pairLookup(document, position, ['<', '>'], true)
  }
  static getRanges(context: ActionHandlerContext) {
    const editor = window.activeTextEditor!
    return editor.selections.map((selection) =>
      this[context.command.slice(-2) as 'iw'](
        editor.document,
        selection.active,
      ),
    )
  }
  static *[Symbol.iterator](): Generator<string> {
    for (const key of Object.getOwnPropertyNames(this) as 'iw'[]) {
      if (this[key].length >= 2) {
        yield key
      } else {
        console.log(`${this.name}: skipped key ${key}`)
      }
    }
  }
}
