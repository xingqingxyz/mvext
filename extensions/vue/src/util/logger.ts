import { window } from 'vscode'

export const logger = window.createOutputChannel('Vue', { log: true })
