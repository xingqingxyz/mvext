import { Position, Range, type TextDocument } from 'vscode'
import { reEscapeRegexp } from './vendor'

export function* preLookup(
  document: TextDocument,
  position: Position,
  str: string,
  keepLine = false,
  skipCursor = false,
) {
  const minLinr = keepLine ? position.line : 0
  for (
    let linr = position.line, chr = position.character - +skipCursor;
    linr >= minLinr;
    linr--
  ) {
    const { text } = document.lineAt(linr)
    if (linr !== position.line) {
      chr = text.length
    }
    while (true) {
      chr = text.lastIndexOf(str, chr)
      if (chr === -1) {
        break
      } else {
        yield new Position(linr, chr)
      }
    }
  }
}

export function* postLookup(
  document: TextDocument,
  position: Position,
  str: string,
  keepLine = false,
  skipCursor = false,
) {
  const maxEdge = keepLine ? position.line + 1 : document.lineCount
  for (
    let linr = position.line, chr = position.character + +skipCursor;
    linr < maxEdge;
    linr++, chr = 0
  ) {
    const { text } = document.lineAt(linr)
    while (true) {
      chr = text.indexOf(str, chr)
      if (chr === -1) {
        break
      } else {
        yield new Position(linr, chr)
      }
    }
  }
}

export function bracketLookup(
  document: TextDocument,
  position: Position,
  [lb, rb]: [string, string],
  inner = true,
): Range {
  if (lb === rb) {
    throw 'brackets are the same: ' + lb
  } else if ((lb + rb).includes('\n')) {
    throw 'brackets contains eol'
  }
  const { done, value: left } = preLookup(document, position, lb).next()
  if (done) {
    return new Range(position, position)
  }
  const reBrackets = new RegExp(
    `(${lb.replace(reEscapeRegexp, '\\$&')})|(${rb.replace(reEscapeRegexp, '\\$&')})`,
    'g',
  )
  const text = document.getText(
    new Range(left.line, left.character + lb.length, document.lineCount, 0),
  )
  const leftOffset = document.offsetAt(left)
  const posOffset = document.offsetAt(position)
  let diff = 0
  for (const matches of text.matchAll(reBrackets)) {
    if (matches[1]) {
      diff--
    } else {
      diff++
    }
    if (!diff && matches.index + leftOffset >= posOffset) {
      return inner
        ? new Range(
            left.with(undefined, left.character + lb.length),
            document.positionAt(matches.index + leftOffset),
          )
        : new Range(
            left,
            document.positionAt(matches.index + leftOffset + rb.length),
          )
    }
  }
  return new Range(position, position)
}

export function* preLookupRegExp(
  document: TextDocument,
  position: Position,
  regexp: RegExp,
  skipCursor = false,
) {
  let linr = position.line,
    text = document
      .lineAt(position.line)
      .text.slice(0, position.character + +!skipCursor)
  while (linr >= 0) {
    for (const { index } of Array.from(text.matchAll(regexp)).reverse()) {
      yield new Position(linr, index)
    }
    if (linr--) {
      ;({ text } = document.lineAt(linr))
    }
  }
}

export function* postLookupRegExp(
  document: TextDocument,
  position: Position,
  regexp: RegExp,
  skipCursor = false,
) {
  let linr = position.line,
    text = document
      .lineAt(position.line)
      .text.slice(position.character + +skipCursor)
  while (true) {
    for (const { index } of text.matchAll(regexp)) {
      yield new Position(linr, index)
    }
    if (++linr >= document.lineCount) {
      break
    }
    void ({ text } = document.lineAt(linr))
  }
}

export const bracketsMap = {
  '(': ')',
  '[': ']',
  '{': '}',
  '<': '>',
  ')': '(',
  ']': '[',
  '}': '{',
  '>': '<',
} as const

export function preBracketPairLookup(
  document: TextDocument,
  position: Position,
  rpair: ')' | ']' | '}' | '>',
) {
  const lpair = bracketsMap[rpair]
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

export function postBracketPairLookup(
  document: TextDocument,
  position: Position,
  lpair: '(' | '[' | '{' | '<',
) {
  const rpair = bracketsMap[lpair]
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
