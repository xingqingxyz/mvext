import { commands, window, type TextEditor } from 'vscode'
const { executeCommand } = commands

interface NormalKeyActionParams {
  number: number
}

type NormalKeyAction = (this: KeysHandler, editor: TextEditor) => void

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
  return executeCommand('cursorMove', {
    to,
    by,
    value,
    select,
  })
}

type VimMode = 'i' | 'n' | 'o' | 'v' | 'V'

let vimMode: VimMode = 'n'

function validateMode(mode: string) {
  if (!mode.includes(vimMode)) {
    window.showWarningMessage(
      'these keys are only available in mode(s) ' + mode,
    )
    throw 'invalid mode'
  }
}

function setVimMode(mode: VimMode) {
  vimMode = mode
  console.log('vimMode', vimMode)
  executeCommand('setContext', 'vim.mode', vimMode)
}

const itnEffects = []

export const VimNormalKeysPartial: Record<string, NormalKeyAction> = {
  a(editor) {
    switch (vimMode) {
      case 'n':
        setVimMode('i')
        return cursorMoveHelper('right', 'character')
    }
  },
  b(editor) {},
  c(editor) {},
  d(editor) {},
  e(editor) {},
  f(editor) {},
  g(editor) {},
  h(editor) {
    cursorMoveHelper('left', 'character', this.number)
  },
  i(editor) {
    {
    }
  },
  j(editor) {
    cursorMoveHelper('down', 'line', this.number)
  },
  k(editor) {
    cursorMoveHelper('up', 'line', this.number)
  },
  l(editor) {
    cursorMoveHelper('right', 'character', this.number)
  },
  '<C-u>'({ visibleRanges }) {
    return cursorMoveHelper(
      'up',
      'line',
      (this.number * visibleRanges[0].end.line) >> 1,
    )
  },
  '<C-d>'({ document: { lineCount } }) {
    return cursorMoveHelper('down', 'line', (this.number * lineCount) >> 1)
  },
  '<C-b>'({ document: { lineCount } }) {
    return cursorMoveHelper('up', 'line', this.number * lineCount)
  },
  '<C-f>'({ document: { lineCount } }) {
    return cursorMoveHelper('down', 'line', this.number * lineCount)
  },
  '<C-e>': ({ document: { lineCount } }) => executeCommand('cursorPageDown'),
  m(editor) {},
  n(editor) {},
  o(editor) {},
  p(editor) {},
  q(editor) {},
  r(editor) {},
  s(editor) {},
  t(editor) {},
  u(editor) {},
  v(editor) {},
  w(editor) {},
  x(editor) {},
  y(editor) {},
  z(editor) {},
  A(editor) {},
  B(editor) {},
  C(editor) {},
  D(editor) {},
  E(editor) {},
  F(editor) {},
  G(editor) {},
  H: (editor) => cursorMoveHelper('viewPortTop', 'line'),
  I(editor) {},
  J(editor) {},
  K(editor) {},
  L: (editor) => cursorMoveHelper('viewPortBottom', 'line'),
  M: (editor) => cursorMoveHelper('viewPortCenter', 'line'),
  N(editor) {},
  O(editor) {},
  P(editor) {},
  Q(editor) {},
  R(editor) {},
  S(editor) {},
  T(editor) {},
  U(editor) {},
  V(editor) {},
  W(editor) {},
  X(editor) {},
  Y(editor) {},
  Z(editor) {},
  gg(editor) {},
  ge(editor) {},
  gE(editor) {},
  '~'(editor) {},
  '`'(editor) {},
  '!'(editor) {},
  '!!'(editor) {},
  '@'(editor) {},
  '@@'(editor) {},
  '@:'(editor) {},
  '@q'(editor) {},
  '#'(editor) {},
  $(editor) {},
  '%'(editor) {},
  '^'(editor) {},
  '&'(editor) {},
  '*'(editor) {},
  '('(editor) {},
  ')'(editor) {},
  '-'(editor) {},
  '+'(editor) {},
  '='(editor) {},
  '=='(editor) {},
  '['(editor) {},
  ']'(editor) {},
  '{'(editor) {},
  '}'(editor) {},
  "'"(editor) {},
  '"'(editor) {},
  '|'(editor) {},
  '<'(editor) {},
  '>'(editor) {},
  ','(editor) {},
  '.'(editor) {},
  '?'(editor) {},
  '/'(editor) {},
  ':'(editor) {},
  ';'(editor) {},
}
export default VimNormalKeysPartial

class KeysHandler {
  private _mode: VimMode = 'n'
  private _isNumberPending = false
  get isNumberPending() {
    return this._isNumberPending
  }
  set isNumberPending(isNumberPending: boolean) {
    this._isNumberPending = isNumberPending
    this._number = 0
  }
  private set mode(mode: VimMode) {
    switch (mode) {
      case 'n':
        break
      case 'i':
        break
      case 'o':
        break
      case 'v':
        break
      case 'V':
        break
      default:
        break
    }
    this._mode = mode
    this._isNumberPending = false
  }
  private get mode() {
    return this._mode
  }
  private _number = 0
  private set number(number: number) {
    this._number = number
    this._isNumberPending = true
  }
  get number() {
    return this._number
  }
  private _isPending = false
  private set isPending(isPending: boolean) {
    this._isPending = isPending
  }
  private get isPending() {
    return this._isPending
  }
  private _isRepeat = false
  private set isRepeat(isRepeat: boolean) {
    this._isRepeat = isRepeat
  }
  private get isRepeat() {
    return this._isRepeat
  }
}

type CmdlineAction = (e: any, editor: TextEditor) => void
const CmdlineActions: Record<string, CmdlineAction> = {
  q(editor) {},
}

const commandsToHandle = [
  'ls',
  '',
  's',
  'g',
  'm',
  'put',
  'q',
  'r',
  'w',
  'wa',
  'wq',
  'wq!',
  'wqa!',
]
