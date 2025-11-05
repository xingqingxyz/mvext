import type { Position, TextDocument } from 'vscode'
import {
  postLookup,
  postLookupRegExp,
  preLookup,
  preLookupRegExp,
} from './bracketLookup'
import { logger } from './logger'

export function findWord(
  document: TextDocument,
  position: Position,
  count: number,
  context: findWord.Context,
): Position {
  if (!context.findSequence.length) {
    logger.debug('find sequence empty')
    return position
  }
  const savePosition = position
  findWord.context = context
  for (position of (+(context.findType > 'a') ^ +!context.reverse
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
  if (
    context.findType.toUpperCase() === 'T' &&
    !position.isEqual(savePosition)
  ) {
    return position.translate(undefined, context.findType === 'T' ? 1 : -1)
  }
  return position
}

export namespace findWord {
  export interface Context {
    findType: 'f' | 'F' | 't' | 'T'
    findSequence: string
    keepLine?: boolean
    reverse?: boolean
  }
  // eslint-disable-next-line prefer-const
  export let context: Context = {
    findType: 'f',
    findSequence: '',
  }
}

export function findRegexp(
  document: TextDocument,
  position: Position,
  count: number,
  context: findRegexp.Context,
) {
  findRegexp.context = context
  for (position of (+(context.findType === '/') ^ +!context.reverse
    ? preLookupRegExp
    : postLookupRegExp)(document, position, context.findRegexp, true)) {
    if (!--count) {
      break
    }
  }
  return position
}

export namespace findRegexp {
  export interface Context {
    findType: '/' | '?'
    findRegexp: RegExp
    reverse?: boolean
  }
  // eslint-disable-next-line prefer-const
  export let context: Context = {
    findType: '/',
    findRegexp: /\0/,
  }
}
