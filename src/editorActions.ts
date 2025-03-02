import { Position, TextDocument } from 'vscode'

const reReplacePairs = /[([{<]/g

/**
 * @param char left pair of pairs
 */
function getPairsForChar(char: string): [string, string] {
  return [char, char.replace(reReplacePairs, (c) => ')]}>'['([{<'.indexOf(c)])]
}

function lookupCharOfCurrentLine(
  document: TextDocument,
  position: Position,
  pairs: [string, string],
): [Position, Position] {
  const { text } = document.lineAt(position)
  const left = text.lastIndexOf(pairs[0], position.character)
  const right = text.indexOf(pairs[1], position.character)
  if (!(left === -1 || right === -1)) {
    return [position.with(undefined, left), position.with(undefined, right)]
  }
  return [position, position]
}

function lookupCharOfAllLines(
  document: TextDocument,
  position: Position,
  pairs: [string, string],
): [Position, Position] {
  const positions = lookupCharOfCurrentLine(document, position, pairs)
  if (positions[0] !== position) {
    return positions
  }
  for (let i = position.line - 1; i >= 0; i--) {
    const left = document.lineAt(i).text.lastIndexOf(pairs[0])
    if (left !== -1) {
      positions[0] = new Position(i, left)
      break
    }
  }
  for (let i = position.line + 1; i < document.lineCount; i++) {
    const right = document.lineAt(i).text.indexOf(pairs[0])
    if (right !== -1) {
      positions[1] = new Position(i, right)
      break
    }
  }
  return positions
}

export function changeSurround(from: [string, string], to: [string, string]) {}
