import { type ExtensionContext, Uri, workspace } from 'vscode'

export class SearchDict {
  private readonly dictUri: Uri
  constructor(context: ExtensionContext) {
    this.dictUri = Uri.joinPath(
      context.extensionUri,
      'resources/words-js-sorted.txt',
    )
  }
  async search(word: string) {
    const words = new TextDecoder('utf-8', { fatal: true })
      .decode(await workspace.fs.readFile(this.dictUri))
      .split('\n')
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
