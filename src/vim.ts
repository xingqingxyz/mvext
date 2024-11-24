import { commands, type TextEditor } from 'vscode'
const { executeCommand } = commands

interface NormalKeyActionParams {
  number: number
}

type NormalKeyAction = (
  event: NormalKeyActionParams,
  editor: TextEditor,
) => void

export function cursorMoveHelper(
  to:
    | 'left'
    | 'right'
    | 'up'
    | 'down'
    | 'prevBlankLine'
    | 'nextBlankLine'
    | 'wrappedLineStart'
    | 'wrappedLineEnd'
    | 'wrappedLineColumnCenter'
    | 'wrappedLineFirstNonWhitespaceCharacter'
    | 'wrappedLineLastNonWhitespaceCharacter'
    | 'viewPortTop'
    | 'viewPortCenter'
    | 'viewPortBottom'
    | 'viewPortIfOutside',
  by: 'line' | 'wrappedLine' | 'character' | 'halfLine',
  value = 1,
  select = false,
) {
  return commands.executeCommand('cursorMove', {
    to,
    by,
    value,
    select,
  })
}

export const VimNormalKeysPartial: Record<string, NormalKeyAction> = {
  a: (e, editor) => {},
  b: (e, editor) => {},
  c: (e, editor) => {},
  d: (e, editor) => {},
  e: (e, editor) => {},
  f: (e, editor) => {},
  g: (e, editor) => {},
  h: (e, editor) => cursorMoveHelper('left', 'character', e.number),
  i: (e, editor) => {},
  j: (e, editor) => cursorMoveHelper('down', 'line', e.number),
  k: (e, editor) => cursorMoveHelper('up', 'line', e.number),
  l: (e, editor) => cursorMoveHelper('right', 'character', e.number),
  '<C-u>': (e, { visibleRanges }) =>
    cursorMoveHelper('up', 'line', (e.number * visibleRanges[0].end.line) >> 1),
  '<C-d>': (e, { document: { lineCount } }) =>
    cursorMoveHelper('down', 'line', (e.number * lineCount) >> 1),
  '<C-b>': (e, { document: { lineCount } }) =>
    cursorMoveHelper('up', 'line', e.number * lineCount),
  '<C-f>': (e, { document: { lineCount } }) =>
    cursorMoveHelper('down', 'line', e.number * lineCount),
  '<C-e>': (e, { document: { lineCount } }) => executeCommand('cursorPageDown'),
  m: (e, editor) => {},
  n: (e, editor) => {},
  o: (e, editor) => {},
  p: (e, editor) => {},
  q: (e, editor) => {},
  r: (e, editor) => {},
  s: (e, editor) => {},
  t: (e, editor) => {},
  u: (e, editor) => {},
  v: (e, editor) => {},
  w: (e, editor) => {},
  x: (e, editor) => {},
  y: (e, editor) => {},
  z: (e, editor) => {},
  A: (e, editor) => {},
  B: (e, editor) => {},
  C: (e, editor) => {},
  D: (e, editor) => {},
  E: (e, editor) => {},
  F: (e, editor) => {},
  G: (e, editor) => {},
  H: (e, editor) => cursorMoveHelper('viewPortTop', 'line'),
  I: (e, editor) => {},
  J: (e, editor) => {},
  K: (e, editor) => {},
  L: (e, editor) => cursorMoveHelper('viewPortBottom', 'line'),
  M: (e, editor) => cursorMoveHelper('viewPortCenter', 'line'),
  N: (e, editor) => {},
  O: (e, editor) => {},
  P: (e, editor) => {},
  Q: (e, editor) => {},
  R: (e, editor) => {},
  S: (e, editor) => {},
  T: (e, editor) => {},
  U: (e, editor) => {},
  V: (e, editor) => {},
  W: (e, editor) => {},
  X: (e, editor) => {},
  Y: (e, editor) => {},
  Z: (e, editor) => {},
  gg: (e, editor) => {},
  ge: (e, editor) => {},
  gE: (e, editor) => {},
  '~': (e, editor) => {},
  '`': (e, editor) => {},
  '!': (e, editor) => {},
  '!!': (e, editor) => {},
  '@': (e, editor) => {},
  '@@': (e, editor) => {},
  '@:': (e, editor) => {},
  '@q': (e, editor) => {},
  '#': (e, editor) => {},
  $: (e, editor) => {},
  '%': (e, editor) => {},
  '^': (e, editor) => {},
  '&': (e, editor) => {},
  '*': (e, editor) => {},
  '(': (e, editor) => {},
  ')': (e, editor) => {},
  '-': (e, editor) => {},
  '+': (e, editor) => {},
  '=': (e, editor) => {},
  '==': (e, editor) => {},
  '[': (e, editor) => {},
  ']': (e, editor) => {},
  '{': (e, editor) => {},
  '}': (e, editor) => {},
  "'": (e, editor) => {},
  '"': (e, editor) => {},
  '|': (e, editor) => {},
  '<': (e, editor) => {},
  '>': (e, editor) => {},
  ',': (e, editor) => {},
  '.': (e, editor) => {},
  '?': (e, editor) => {},
  '/': (e, editor) => {},
  ':': (e, editor) => {},
  ';': (e, editor) => {},
}
export default VimNormalKeysPartial
