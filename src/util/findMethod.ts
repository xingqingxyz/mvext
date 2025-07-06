import type { Position, TextDocument } from 'vscode'
import { consumeSequence } from '../consumer'
import { editorContext } from '../editorContext'
import { postLookup, preLookup } from './bracketLookup'

export function findChar(
  document: TextDocument,
  position: Position,
  count: number,
  forward: boolean,
  keepLine: boolean,
): Promise<Position> {
  return consumeSequence(1, async ([char]) => {
    editorContext.findSequence = char
    for (position of (forward ? postLookup : preLookup)(
      document,
      position,
      char,
      keepLine,
      true,
    )) {
      if (!--count) {
        return position
      }
    }
    return position
  })
}
