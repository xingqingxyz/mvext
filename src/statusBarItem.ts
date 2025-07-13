import { StatusBarAlignment, window } from 'vscode'

export const statusBarItem = window.createStatusBarItem(
  'modeLine',
  StatusBarAlignment.Left,
  9,
)
statusBarItem.name = 'Vincode Mode Line'
statusBarItem.tooltip = 'mode | enqueued keys'
