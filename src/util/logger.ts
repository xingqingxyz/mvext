import { window } from 'vscode'

class Logger {
  private panel = window.createOutputChannel('VinCode')
  private write(msg: string, level: 'debug' | 'info' | 'warn' | 'error') {
    this.panel.appendLine(`${new Date().toLocaleString()} [${level}] ${msg}`)
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
