import { execFile } from 'child_process'
import { EOL } from 'os'
import util from 'util'
import type { CancellationToken } from 'vscode'

export const isWin32 = process.platform === 'win32'

export function noop() {}

export const execFilePm = util.promisify(execFile)

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

export async function findExeInPath(name: string) {
  return await new Promise<string>((resolve, reject) => {
    const finder = isWin32 ? 'C:/Windows/System32/where.exe' : '/usr/bin/which'
    if (isWin32) {
      name += '.exe'
    }
    execFile(finder, [name], { encoding: 'utf8' }, (err, stdout, stderr) => {
      if (err) reject(err)
      else resolve(stdout.split(EOL)[0])
    })
  })
}
