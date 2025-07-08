/* eslint-disable @typescript-eslint/no-unused-vars */
import { type Position, type TextDocument, type TextEditor } from 'vscode'

export interface ActionsType
  extends Record<
    | 'r'
    | 'R'
    | 'y'
    | 'Y'
    | 'u'
    | 'U'
    | 'i'
    | 'I'
    | 'o'
    | 'O'
    | 'p'
    | 'P'
    | 'a'
    | 'A'
    | 'd'
    | 'D'
    | 'x'
    | 'X'
    | 'c'
    | 'C'
    | 'v'
    | 'V'
    | 'm'
    | '~'
    | '/'
    | '?'
    | '\\'
    | ' '
    | '=='
    | 'dd'
    | 'cc'
    | 'gu'
    | 'gU'
    | 'gc'
    | 'gC'
    | 'gr'
    | 'gR'
    | 'gd'
    | 'gD'
    | 'gf'
    | 'gF'
    | 'gs'
    | 'gS'
    | 'gn'
    | 'gN'
    | 'yy'
    | '<<'
    | '>>',
    (
      document: TextDocument,
      position: Position,
      count: number,
      editor: TextEditor,
    ) => void | Promise<void>
  > {}

class Actions implements ActionsType {
  r(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  R(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  y(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  Y(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  u(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  U(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  i(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  I(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  o(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  O(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  p(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  P(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  a(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  A(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  d(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  D(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  x(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  X(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  c(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  C(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  v(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  V(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  dd(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  cc(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  gr(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  gR(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  yy(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  m(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  '/'(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  '?'(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  '~'(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  ' '(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  '\\'(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  '=='(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  gu(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  gU(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  gc(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  gC(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  gd(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  gD(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  gf(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  gF(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  gs(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  gS(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  gn(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  gN(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  '<<'(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
  '>>'(
    document: TextDocument,
    position: Position,
    count: number,
    editor: TextEditor,
  ) {}
}
