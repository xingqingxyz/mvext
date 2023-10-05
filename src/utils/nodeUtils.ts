import { execFile } from 'child_process'
import * as util from 'util'
import * as vscode from 'vscode'

export const execFilePm = util.promisify(execFile)

export function tokenToSignal(token: vscode.CancellationToken): AbortSignal {
  const controller = new AbortController()
  token.onCancellationRequested(() => controller.abort())
  return controller.signal
}

export function mergeIterables<T>(iterables: Iterable<T>[]) {
  return (function* () {
    for (const iterable of iterables) {
      yield* iterable
    }
  })()
}
