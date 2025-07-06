/* eslint-disable @typescript-eslint/no-unused-vars */
import { Position, Range, type TextDocument } from 'vscode'
import { bracketLookup } from './util/bracketLookup'

export interface TextObjectsType
  extends Record<
    | 'ae'
    | 'aw'
    | 'iw'
    | 'aW'
    | 'iW'
    | 'at'
    | 'it'
    | 'ap'
    | 'ip'
    | 'as'
    | 'is'
    | 'i('
    | 'i['
    | 'i{'
    | 'i<'
    | 'a('
    | 'a['
    | 'a{'
    | 'a<'
    | 'if'
    | 'af',
    (document: TextDocument, position: Position) => Range
  > {}

// TODO: add tree-sitter support
export class TextObjects implements TextObjectsType {
  ae(document: TextDocument, position: Position): Range {
    return new Range(0, 0, document.lineCount, 0)
  }
  aw(document: TextDocument, position: Position, _re?: RegExp): Range {
    const range = document.getWordRangeAtPosition(position, _re)
    if (!range) {
      return new Range(position, position)
    }
    let { character } = range.end
    character += document
      .lineAt(position)
      .text.slice(character)
      .match(/^\s*/)![0].length
    return range.with({ end: position.with({ character }) })
  }
  iw(document: TextDocument, position: Position, _re?: RegExp): Range {
    return (
      document.getWordRangeAtPosition(position, _re) ??
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
    throw new Error('Function not implemented.')
  }
  is(document: TextDocument, position: Position): Range {
    throw new Error('Function not implemented.')
  }
  ap(document: TextDocument, position: Position): Range {
    const range = this.ip(document, position)
    if (range.end.line === document.lineCount) {
      return range
    }
    let post
    for (let i = range.end.line + 1; i < document.lineCount; i++) {
      if (!document.lineAt(i).isEmptyOrWhitespace) {
        post = i
        return range.with(undefined, new Position(post, 0))
      }
    }
    return range
  }
  ip(document: TextDocument, position: Position): Range {
    let pre, post
    for (let i = position.line; i >= 0; i--) {
      if (document.lineAt(i).isEmptyOrWhitespace) {
        pre = Math.min(i + 1, position.line)
      }
    }
    for (let i = position.line; i < document.lineCount; i++) {
      if (document.lineAt(i).isEmptyOrWhitespace) {
        post = Math.max(i - 1, position.line)
      }
    }
    return new Range(pre ?? 0, 0, post ?? document.lineCount, 0)
  }
  if(document: TextDocument, position: Position): Range {
    throw new Error('Function not implemented.')
  }
  af(document: TextDocument, position: Position): Range {
    throw new Error('Function not implemented.')
  }
  'i('(document: TextDocument, position: Position): Range {
    return bracketLookup(document, position, ['(', ')'])
  }
  'i['(document: TextDocument, position: Position): Range {
    return bracketLookup(document, position, ['[', ']'])
  }
  'i{'(document: TextDocument, position: Position): Range {
    return bracketLookup(document, position, ['{', '}'])
  }
  'i<'(document: TextDocument, position: Position): Range {
    return bracketLookup(document, position, ['<', '>'])
  }
  'a('(document: TextDocument, position: Position): Range {
    return bracketLookup(document, position, ['(', ')'], false)
  }
  'a['(document: TextDocument, position: Position): Range {
    return bracketLookup(document, position, ['[', ']'], false)
  }
  'a{'(document: TextDocument, position: Position): Range {
    return bracketLookup(document, position, ['{', '}'], false)
  }
  'a<'(document: TextDocument, position: Position): Range {
    return bracketLookup(document, position, ['<', '>'], false)
  }
}
