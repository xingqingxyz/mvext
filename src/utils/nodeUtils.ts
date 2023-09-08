import { exec, execFile } from 'child_process'
import util from 'util'
import vscode from 'vscode'

export const execFilePm = util.promisify(execFile)

export const execPm = util.promisify(exec)

export function tokenToSignal(token: vscode.CancellationToken): AbortSignal {
  const controller = new AbortController()
  token.onCancellationRequested(() => controller.abort())
  return controller.signal
}
