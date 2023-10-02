import * as vscode from 'vscode'

export const isDesktop = vscode.env.uiKind === vscode.UIKind.Desktop

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
