import { readFile } from 'fs/promises'
import {
  type CancellationToken,
  type CompletionContext,
  type CompletionItem,
  CompletionItemKind,
  type CompletionItemProvider,
  type CompletionList,
  type Disposable,
  languages,
  type Position,
  type TextDocument,
  workspace,
} from 'vscode'
import { getExtConfig } from './config'
import { getExtContext } from './context'

export class DictionaryCompleteProvider
  implements CompletionItemProvider, Disposable
{
  static readonly oxfordWordsPath = 'assets/Oxford_5000_words.txt'
  private _enabled = getExtConfig('dictionaryCompleteEnabled')
  words?: string[];

  *lookupWords(word: string, words: string[]) {
    // binary search
    let start = 0,
      end = words.length - 1,
      mid = (start + end) >> 1
    while (start <= end) {
      if (words[mid].startsWith(word)) {
        const findWords = [words[mid]]
        // find words that start with word from mid up
        for (let i = mid - 1; i > 0 && words[i].startsWith(word); i--) {
          yield words[i]
        }
        // find words that start with word from mid down
        for (
          let i = mid + 1;
          i < words.length && words[i].startsWith(word);
          i++
        ) {
          yield words[i]
        }
        return findWords
      } else if (words[mid] < word) {
        start = mid + 1
      } else {
        end = mid - 1
      }
      mid = (start + end) >> 1
    }
    return null
  }

  private _disposables: Disposable[] = [
    languages.registerCompletionItemProvider({ pattern: '**' }, this),
    workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('mvext.dictionaryCompleteEnabled')) {
        this._enabled = getExtConfig('dictionaryCompleteEnabled')
      }
    }),
  ]

  dispose() {
    for (const d of this._disposables) {
      d.dispose()
    }
  }

  async provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    context: CompletionContext,
  ): Promise<
    CompletionItem[] | CompletionList<CompletionItem> | null | undefined
  > {
    if (!this._enabled) {
      return
    }
    const word = document.getText(document.getWordRangeAtPosition(position))
    if (word.length < 3 || !/^[\w-]+$/.test(word)) {
      return
    }
    if (!this.words) {
      this.words = (
        await readFile(
          getExtContext().asAbsolutePath(
            DictionaryCompleteProvider.oxfordWordsPath,
          ),
          'utf-8',
        )
      ).split('\n')
    }
    return Array.from(this.lookupWords(word, this.words), (word) => ({
      label: word,
      detail: word,
      kind: CompletionItemKind.Text,
    }))
  }
}
