import { noop } from '@/util'
import { homedir } from 'os'
import {
  CompletionItemKind,
  Range,
  Uri,
  workspace,
  type CompletionItem,
  type CompletionItemProvider,
  type Position,
  type TextDocument,
} from 'vscode'

export class UserCompleteProvider implements CompletionItemProvider {
  async provideCompletionItems(document: TextDocument, position: Position) {
    const needle = document.getText(
      document.getWordRangeAtPosition(position) ??
        new Range(position, position),
    )
    const uri = Uri.joinPath(
      workspace.getWorkspaceFolder(document.uri)?.uri ?? Uri.file(homedir()),
      '.vscode/words.txt',
    )
    const commitCharacters = ['.', ',', ';']
    return await workspace.fs
      .readFile(uri)
      .then(workspace.decode)
      .then(
        (text) =>
          text
            .split(/\r?\n/g)
            .filter((word) => word.includes(needle))
            .map(
              (word) =>
                ({
                  label: word,
                  sortText: '10',
                  kind: CompletionItemKind.Keyword,
                  commitCharacters,
                }) as CompletionItem,
            ),
        noop,
      )
  }
}
