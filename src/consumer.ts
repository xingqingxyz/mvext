import { commands, window } from 'vscode'
import { extContext } from './config'

export function consumeSequence<T>(
  count: number,
  cb: (...sequence: string[]) => T,
) {
  return cb('')
}

export class Consumer {
  handler = this.handleSequence()
  char = ''
  sequence = ''
  constructor() {
    window.onDidChangeActiveTextEditor((e) => e)
    void this.handler.next()
    extContext.subscriptions.push(
      commands.registerCommand('type', async ({ text }) => {
        return commands.executeCommand('default:type', { text })
      }),
    )
  }
  async *handleSequence() {
    while (true) {
      const char: string = yield

      switch (char) {
        case '0':
          if (/\d/.test(this.char)) {
            this.sequence += char
          } else {
            return
          }
          break
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          break
      }
      this.sequence += char
      this.char = char
    }
  }
  getChar() {
    return
  }
}
