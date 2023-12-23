import cp from 'child_process'
import os from 'os'
import util from 'util'
import { CancellationToken } from 'vscode'

export const isWin32 = os.platform() === 'win32'

export function noop() {}

export const execFilePm = util.promisify(cp.execFile)

export function tokenToSignal(token: CancellationToken): AbortSignal {
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
