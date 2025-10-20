/* eslint-disable @typescript-eslint/no-unused-vars */
import { Position, Range, window, type TextDocument } from 'vscode'
import { type ActionHandlerContext } from './actionTire'
import {
  pairLookup,
  postLookupRegExp,
  preLookupRegExp,
} from './util/bracketLookup'

export class TextObject {
  ae(document: TextDocument, position: Position): Range {
    return new Range(0, 0, document.lineCount, 0)
  }
  aw(
    document: TextDocument,
    position: Position,
    reWord: RegExp | undefined = undefined,
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
  iw(
    document: TextDocument,
    position: Position,
    reWord: RegExp | undefined = undefined,
  ): Range {
    return (
      document.getWordRangeAtPosition(position, reWord) ??
      new Range(position, position)
    )
  }
  aW(document: TextDocument, position: Position): Range {
    return this.aw(document, position, /\S+/)
  }
  iW(document: TextDocument, position: Position): Range {
    return this.iw(document, position, /\S+/)
  }
  at(document: TextDocument, position: Position): Range {
    throw new Error('Function not implemented.')
  }
  it(document: TextDocument, position: Position): Range {
    throw new Error('Function not implemented.')
  }
  as(document: TextDocument, position: Position): Range {
    return this.is(document, position, true)
  }
  is(document: TextDocument, position: Position, outer = false): Range {
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
  ap(document: TextDocument, position: Position): Range {
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
  ip(document: TextDocument, position: Position): Range {
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
  if(document: TextDocument, position: Position): Range {
    throw new Error('Function not implemented.')
  }
  af(document: TextDocument, position: Position): Range {
    throw new Error('Function not implemented.')
  }
  'i('(document: TextDocument, position: Position): Range {
    return pairLookup(document, position, ['(', ')'])
  }
  'i['(document: TextDocument, position: Position): Range {
    return pairLookup(document, position, ['[', ']'])
  }
  'i{'(document: TextDocument, position: Position): Range {
    return pairLookup(document, position, ['{', '}'])
  }
  'i<'(document: TextDocument, position: Position): Range {
    return pairLookup(document, position, ['<', '>'])
  }
  'a('(document: TextDocument, position: Position): Range {
    return pairLookup(document, position, ['(', ')'], true)
  }
  'a['(document: TextDocument, position: Position): Range {
    return pairLookup(document, position, ['[', ']'], true)
  }
  'a{'(document: TextDocument, position: Position): Range {
    return pairLookup(document, position, ['{', '}'], true)
  }
  'a<'(document: TextDocument, position: Position): Range {
    return pairLookup(document, position, ['<', '>'], true)
  }
  getRange(context: ActionHandlerContext) {
    const editor = window.activeTextEditor!
    return this[context.command.slice(1) as 'iw'](
      editor.document,
      editor.selection.active,
    )
  }
}

export function* produceKey(): Generator<string> {
  for (const key of Object.getOwnPropertyNames(
    TextObject.prototype,
  ) as 'iw'[]) {
    if (TextObject.prototype[key].length === 2) {
      yield key
    } else {
      console.log('skipped textObject key ' + key)
    }
  }
}
