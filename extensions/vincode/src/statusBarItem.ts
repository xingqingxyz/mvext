import { StatusBarAlignment, window } from 'vscode'

export const statusBarItem = window.createStatusBarItem(
  'modeLine',
  StatusBarAlignment.Left,
  9,
)
statusBarItem.name = 'Vim in VSCode'
statusBarItem.tooltip = 'mode & enqueued keys'
