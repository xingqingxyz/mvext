import { readFile } from 'fs/promises'
import { type CancellationToken, type ExtensionContext } from 'vscode'
import { tokenToSignal } from '.'

export class SearchDict {
  private readonly dictFile: string
  constructor(context: ExtensionContext) {
    this.dictFile = context.asAbsolutePath('resources/words-js-sorted.txt')
  }
  async search(word: string, token: CancellationToken) {
    const words = (
      await readFile(this.dictFile, {
        signal: tokenToSignal(token),
        encoding: 'utf-8',
      })
    ).split('\n')
    let i = 0,
      j = words.length
    while (i < j) {
      const mid = (i + j) >> 1
      if (words[mid] < word) {
        i = mid + 1
        continue
      } else if (!words[mid].startsWith(word)) {
        j = mid
        continue
      }
      i = mid
      while (i > 0 && words[i - 1].startsWith(word)) {
        i--
      }
      j = mid + 1
      while (j < words.length && words[j].startsWith(word)) {
        j++
      }
      break
    }
    return words.slice(i, j)
  }
}
