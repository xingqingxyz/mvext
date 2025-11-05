import { type ExtensionContext, Uri } from 'vscode'

export class SearchDict {
  private readonly dictUrl: string
  constructor(context: ExtensionContext) {
    this.dictUrl = Uri.joinPath(
      context.extensionUri,
      'resources/words-js-sorted.txt.gz',
    ).toString()
  }
  private async getWords() {
    return (
      await new Response(
        (await fetch(this.dictUrl)).body!.pipeThrough(
          new DecompressionStream('gzip'),
        ),
      ).text()
    ).split('\n')
  }
  async search(word: string) {
    const words = await this.getWords()
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
