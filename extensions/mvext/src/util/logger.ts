import { window } from 'vscode'

export const logger = window.createOutputChannel('Make VSCode Extension', {
  log: true,
})
