import { execFile } from 'child_process'
import { promisify } from 'util'
import type { CancellationToken } from 'vscode'
export { setTimeout as setTimeoutPm } from 'timers/promises'

export const isWin32 = process.platform === 'win32'
export const execFilePm = promisify(execFile)

export function noop(): undefined {}

export function tokenToSignal(token: CancellationToken): AbortSignal {
  const controller = new AbortController()
  token.onCancellationRequested(() => controller.abort())
  return controller.signal
}

export function* mergeIterables<T>(iterables: Iterable<Iterable<T>>) {
  for (const iterable of iterables) {
    yield* iterable
  }
}
