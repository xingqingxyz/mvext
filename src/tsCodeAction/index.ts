import { CodeActionKind } from 'vscode'

export const kindFunction = CodeActionKind.RefactorRewrite.append('function')
export const kindTransform = CodeActionKind.Refactor.append('transform')
