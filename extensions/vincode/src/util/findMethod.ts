import type { Position, TextDocument } from 'vscode'
import {
  postLookup,
  postLookupRegExp,
  preLookup,
  preLookupRegExp,
} from './bracketLookup'
import { logger } from './logger'

export interface FindWordContext {
  findType: 'f' | 'F' | 't' | 'T'
  findSequence: string
  keepLine?: boolean
  reverse?: boolean
}
export let findWordContext: FindWordContext = {
  findType: 'f',
  findSequence: '',
}
export function findWord(
  document: TextDocument,
  position: Position,
  count: number,
  context: FindWordContext,
): Position {
  if (!context.findSequence.length) {
    logger.debug('find sequence empty')
    return position
  }
  const savePosition = position
  findWordContext = context
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

export interface FindRegexpContext {
  findType: '/' | '?'
  findRegexp: RegExp
  reverse?: boolean
}
export let findRegexpContext: FindRegexpContext = {
  findType: '/',
  // oxlint-disable-next-line no-control-regex
  findRegexp: /\0/,
}
export function findRegexp(
  document: TextDocument,
  position: Position,
  count: number,
  context: FindRegexpContext,
) {
  findRegexpContext = context
  for (position of (+(context.findType === '/') ^ +!context.reverse
    ? preLookupRegExp
    : postLookupRegExp)(document, position, context.findRegexp, true)) {
    if (!--count) {
      break
    }
  }
  return position
}
