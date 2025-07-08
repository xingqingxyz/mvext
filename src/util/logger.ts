import { window } from 'vscode'
import { formatDate } from '.'

class Logger {
  private panel = window.createOutputChannel('Vincode', 'log')
  private write(msg: string, level: 'debug' | 'info' | 'warn' | 'error') {
    if (__DEV__) {
      console[level](msg)
    }
    this.panel.appendLine(`${formatDate(new Date())} [${level}] ${msg}`)
  }
  debug(msg: string) {
    this.write(msg, 'debug')
  }
  info(msg: string) {
    this.write(msg, 'info')
  }
  warn(msg: string) {
    this.write(msg, 'warn')
  }
  error(msg: string) {
    this.write(msg, 'error')
  }
}

export const logger = new Logger()
