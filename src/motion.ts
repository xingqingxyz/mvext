/* eslint-disable @typescript-eslint/no-unused-vars */
import { Position, Range, window, workspace, type TextDocument } from 'vscode'
import { editorContext } from './editorContext'
import {
  postBracketPairLookup,
  postLookup,
  postLookupRegExp,
  preBracketPairLookup,
  preLookup,
  preLookupRegExp,
} from './util/bracketLookup'
import { findChar } from './util/findMethod'

export interface MotionType
  extends Record<
    | '0'
    | '#'
    | '$'
    | '%'
    | '^'
    | '&'
    | '*'
    | '('
    | ')'
    | '_'
    | '-'
    | '+'
    | '['
    | ']'
    | '{'
    | '}'
    | '|'
    | ','
    | ';'
    | "'"
    | '`'
    | 'w'
    | 'W'
    | 'e'
    | 'E'
    | 'ge'
    | 'gE'
    | 'b'
    | 'B'
    | 'f'
    | 'F'
    | 't'
    | 'T'
    | 'h'
    | 'j'
    | 'k'
    | 'l'
    | 'n'
    | 'N'
    | 'H'
    | 'M'
    | 'L',
    (
      document: TextDocument,
      position: Position,
      count: number,
    ) => Position | Promise<Position>
  > {}

class Motion implements MotionType {
  //#region keepLine
  '0'(document: TextDocument, position: Position, count: number): Position {
    return document.lineAt(position).range.start
  }
  '^'(document: TextDocument, position: Position, count: number): Position {
    return position.with(
      undefined,
      document.lineAt(position).firstNonWhitespaceCharacterIndex,
    )
  }
  //#endregion
  '#'(document: TextDocument, position: Position, count: number): Position {
    const range = document.getWordRangeAtPosition(position)
    if (!range) {
      return position
    }
    for (position of preLookup(document, range.end, document.getText(range))) {
      if (!--count) {
        break
      }
    }
    return position
  }
  $(document: TextDocument, position: Position, count: number): Position {
    return document.lineAt(
      Math.min(document.lineCount - 1, position.line + count - 1),
    ).range.end
  }
  '%'(document: TextDocument, position: Position, count: number): Position {
    const char = document.getText(
      new Range(position, position.with(undefined, position.character + 1)),
    )
    if ('([{<'.includes(char)) {
      // @ts-expect-error unknown
      return postBracketPairLookup(document, position, char)
    } else if (')]}>'.includes(char)) {
      // @ts-expect-error unknown
      return preBracketPairLookup(document, position, char)
    }
    for (position of preLookupRegExp(document, position, /[([{<]/g)) {
      if (!--count) {
        break
      }
    }
    return position
  }
  '&'(document: TextDocument, position: Position, count: number): Position {
    throw new Error('Function not implemented.')
  }
  '*'(document: TextDocument, position: Position, count: number): Position {
    const range = document.getWordRangeAtPosition(position)
    if (!range) {
      return position
    }
    for (position of postLookup(document, range.end, document.getText(range))) {
      if (!--count) {
        break
      }
    }
    return position
  }
  '('(document: TextDocument, position: Position, count: number): Position {
    throw new Error('Function not implemented.')
  }
  ')'(document: TextDocument, position: Position, count: number): Position {
    throw new Error('Function not implemented.')
  }
  _(document: TextDocument, position: Position, count: number): Position {
    throw new Error('Function not implemented.')
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
  '|'(document: TextDocument, position: Position, count: number): Position {
    return document.validatePosition(position.with(undefined, count - 1))
  }
  ','(
    document: TextDocument,
    position: Position,
    count: number,
  ): Position | Promise<Position> {
    return this[';'](document, position, count, false)
  }
  ';'(
    document: TextDocument,
    position: Position,
    count: number,
    _forward = true,
  ): Position {
    let name
    switch (editorContext.findType) {
      case 'f':
      case 'F':
        name = _forward ? 'f' : 'F'
        break
      case 't':
      case 'T':
        name = _forward ? 't' : 'T'
        break
      default:
        return position
    }
    editorContext.enqueueSequence(editorContext.findSequence)
    return this[name as ';'](document, position, count)
  }
  '`'(
    document: TextDocument,
    position: Position,
    count: number,
    _forward = true,
  ): Position {
    throw new Error('Function not implemented.')
  }
  "'"(
    document: TextDocument,
    position: Position,
    count: number,
    _forward = true,
  ): Position {
    throw new Error('Function not implemented.')
  }
  w(
    document: TextDocument,
    position: Position,
    count: number,
    _forward = true,
  ): Position {
    for (position of (_forward ? postLookupRegExp : preLookupRegExp)(
      document,
      position,
      /\b\w/g,
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
    _forward = true,
  ): Position {
    for (position of (_forward ? postLookupRegExp : preLookupRegExp)(
      document,
      position,
      /(?=\s)\S/g,
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
    _forward = true,
  ): Position {
    for (position of (_forward ? postLookupRegExp : preLookupRegExp)(
      document,
      position,
      /(?=\w)\b/g,
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
    _forward = true,
  ): Position {
    for (position of (_forward ? postLookupRegExp : preLookupRegExp)(
      document,
      position,
      /(?=\S)\s/g,
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
  f(
    document: TextDocument,
    position: Position,
    count: number,
  ): Promise<Position> {
    editorContext.findType = 'f'
    return findChar(document, position, count, true, true)
  }
  F(
    document: TextDocument,
    position: Position,
    count: number,
  ): Promise<Position> {
    editorContext.findType = 'F'
    return findChar(document, position, count, false, true)
  }
  t(
    document: TextDocument,
    position: Position,
    count: number,
  ): Promise<Position> {
    editorContext.findType = 't'
    return findChar(document, position, count, true, true).then((p) =>
      p.isEqual(position) ? position : p.with(0, Math.max(0, p.character - 1)),
    )
  }
  T(
    document: TextDocument,
    position: Position,
    count: number,
  ): Promise<Position> {
    editorContext.findType = 'T'
    return findChar(document, position, count, false, true).then((p) =>
      p.isEqual(position)
        ? position
        : document.validatePosition(p.with(0, p.character + 1)),
    )
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
  n(document: TextDocument, position: Position, count: number): Position {
    throw new Error('Function not implemented.')
  }
  N(document: TextDocument, position: Position, count: number): Position {
    throw new Error('Function not implemented.')
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
    return new Position((range.end.line - range.start.line) >> 1, 0)
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
}

export const motion = new Motion()
