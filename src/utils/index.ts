import { execFile } from 'child_process'
import * as util from 'util'
import { CancellationToken, UIKind, env } from 'vscode'

//#region constants
export const isDesktop = env.uiKind === UIKind.Desktop

export namespace LangIds {
  export const langIdJsOrJsx = [
    'javascript',
    'typescript',
    'javascriptreact',
    'typescriptreact',
  ]

  export const langIdRawFile = ['ignore', 'properties', 'dotenv']

  export const langIdMarkup = [
    'html',
    'javascriptreact',
    'typescriptreact',
    'markdown',
    'mdx',
    'vue',
    'svelte',
  ]
}
//#endregion

//#region node utils
export const execFilePm = util.promisify(execFile)

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
//#endregion
