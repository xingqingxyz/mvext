import type { Position, TextDocument } from 'vscode'
import {
  postLookup,
  postLookupRegExp,
  preLookup,
  preLookupRegExp,
} from './bracketLookup'

interface FindWordContext {
  findType: 'f' | 'F' | 't' | 'T'
  findSequence: string
  keepLine?: boolean
  reverse?: boolean
}

interface FindRegexpContext {
  findType: '/' | '?'
  findRegexp: RegExp
  reverse?: boolean
}

class FindMethod {
  findWordContext: FindWordContext = {
    findType: 'f',
    findSequence: '',
  }
  findRegexpContext: FindRegexpContext = {
    findType: '/',
    findRegexp: /\0/,
  }
  findWord(
    document: TextDocument,
    position: Position,
    count: number,
    context: FindWordContext,
  ): Position {
    if (!context.findSequence.length) {
      console.log('find sequence empty')
      return position
    }
    this.findWordContext = context
    for (position of (+(context.findType.charCodeAt(0) >= 97) ^
      +!context.reverse
      ? preLookup
      : postLookup)(
      document,
      position,
      context.findSequence,
      context.keepLine,
      true,
    )) {
      if (!--count) {
        break
      }
    }
    return position
  }
  findRegexp(
    document: TextDocument,
    position: Position,
    count: number,
    context: FindRegexpContext,
  ) {
    this.findRegexpContext = context
    for (position of (+(context.findType === '/') ^ +!context.reverse
      ? preLookupRegExp
      : postLookupRegExp)(document, position, context.findRegexp, true)) {
      if (!--count) {
        break
      }
    }
    return position
  }
}

export const findMethod = new FindMethod()
