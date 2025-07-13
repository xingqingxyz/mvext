import { Position, Range, type TextDocument } from 'vscode'
import { reEscapeRegexp } from './vendor'

export function* preLookup(
  document: TextDocument,
  position: Position,
  str: string,
  keepLine?: boolean,
  skipCursor?: boolean,
) {
  const minLinr = keepLine ? position.line : 0
  for (
    let linr = position.line, chr = position.character + +!skipCursor;
    linr >= minLinr;
    linr--
  ) {
    const { text } = document.lineAt(linr)
    if (linr !== position.line) {
      chr = text.length
    }
    while (true) {
      chr = text.lastIndexOf(str, chr - 1)
      if (chr === -1) {
        break
      }
      yield new Position(linr, chr)
    }
  }
}

/**
 * @param keepLine default false
 * @param skipCursor default false
 */
export function* postLookup(
  document: TextDocument,
  position: Position,
  str: string,
  keepLine?: boolean,
  skipCursor?: boolean,
) {
  const maxEdge = keepLine ? position.line + 1 : document.lineCount
  for (
    let linr = position.line, chr = position.character - +!skipCursor;
    linr < maxEdge;
    linr++, chr = -1
  ) {
    const { text } = document.lineAt(linr)
    while (true) {
      chr = text.indexOf(str, chr + 1)
      if (chr === -1) {
        break
      }
      yield new Position(linr, chr)
    }
  }
}

export function* preLookupRegExp(
  document: TextDocument,
  position: Position,
  regexp: RegExp,
  skipCursor?: boolean,
) {
  let linr = position.line,
    text = document
      .lineAt(linr)
      .text.slice(0, position.character + +!skipCursor)
  while (true) {
    for (const { index } of Array.from(text.matchAll(regexp)).reverse()) {
      yield new Position(linr, index)
    }
    if (!linr--) {
      break
    }
    ;({ text } = document.lineAt(linr))
  }
}

export function* postLookupRegExp(
  document: TextDocument,
  position: Position,
  regexp: RegExp,
  skipCursor?: boolean,
) {
  const start = position.character + (skipCursor ? 1 : 0)
  let linr = position.line
  for (const { index } of document
    .lineAt(linr)
    .text.slice(start)
    .matchAll(regexp)) {
    yield new Position(linr, start + index)
  }
  while (true) {
    if (++linr >= document.lineCount) {
      break
    }
    for (const { index } of document.lineAt(linr).text.matchAll(regexp)) {
      yield new Position(linr, index)
    }
  }
}

export function pairLookup(
  document: TextDocument,
  position: Position,
  [lpair, rpair]: [string, string],
  outer?: boolean,
): Range {
  if (lpair === rpair) {
    throw 'brackets are the same: ' + lpair
  } else if ((lpair + rpair).includes('\n')) {
    throw 'brackets contains eol'
  }
  const { done, value: left } = preLookup(document, position, lpair).next()
  if (done) {
    return new Range(position, position)
  }
  const reBrackets = new RegExp(
    `(${lpair.replace(reEscapeRegexp, '\\$&')})|(${rpair.replace(reEscapeRegexp, '\\$&')})`,
    'g',
  )
  let diff = 0
  let linr = left.line
  let text = document.lineAt(left).text.slice(left.character + lpair.length)
  for (const matches of text.matchAll(reBrackets)) {
    if (matches[1]) {
      diff--
    } else {
      diff++
    }
    if (!diff) {
      return outer
        ? new Range(left, new Position(linr, matches.index + rpair.length))
        : new Range(
            left.line,
            left.character + lpair.length,
            linr,
            matches.index,
          )
    }
    if (++linr >= document.lineCount) {
      break
    }
    ;({ text } = document.lineAt(linr))
  }
  return new Range(position, position)
}

type BracketChar = '(' | ')' | '[' | ']' | '{' | '}' | '<' | '>'
const bracketsMap = Object.freeze({
  '(': ')',
  '[': ']',
  '{': '}',
  '<': '>',
  ')': '(',
  ']': '[',
  '}': '{',
  '>': '<',
} as Record<BracketChar, BracketChar>)

function preBracketPairLookup(
  document: TextDocument,
  position: Position,
  [lpair, rpair]: [BracketChar, BracketChar],
) {
  for (
    let linr = position.line, chr = position.character - 1, cnt = 1;
    linr >= 0;
    linr--
  ) {
    const { text } = document.lineAt(linr)
    if (linr !== position.line) {
      chr = text.length - 1
    }
    for (; chr >= 0; chr--) {
      switch (text[chr]) {
        case lpair:
          cnt--
          break
        case rpair:
          cnt++
          break
      }
      if (!cnt) {
        return new Position(linr, chr)
      }
    }
  }
  return position
}

function postBracketPairLookup(
  document: TextDocument,
  position: Position,
  [lpair, rpair]: [BracketChar, BracketChar],
) {
  for (
    let linr = position.line, chr = position.character + 1, cnt = -1;
    linr < document.lineCount;
    linr++, chr = 0
  ) {
    const { text } = document.lineAt(linr)
    for (; chr < text.length; chr++) {
      switch (text[chr]) {
        case lpair:
          cnt--
          break
        case rpair:
          cnt++
          break
      }
      if (!cnt) {
        return new Position(linr, chr)
      }
    }
  }
  return position
}

export function bracketPairLookup(document: TextDocument, position: Position) {
  const char = document.getText(
    new Range(position, position.with(undefined, position.character + 1)),
  ) as BracketChar
  if (!Object.hasOwn(bracketsMap, char)) {
    throw 'bracket char not found'
  }
  if ('([{<'.includes(char)) {
    return postBracketPairLookup(document, position, [char, bracketsMap[char]])
  }
  return preBracketPairLookup(document, position, [bracketsMap[char], char])
}
