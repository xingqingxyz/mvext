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
    const wordsUri = Uri.joinPath(
      workspace.getWorkspaceFolder(document.uri)?.uri ?? Uri.file(homedir()),
      '.vscode/words.txt',
    )
    await workspace.fs.stat(wordsUri)
    return (await workspace.decode(await workspace.fs.readFile(wordsUri)))
      .split(/\r?\n/g)
      .filter((word) => word.includes(needle))
      .map(
        (word) =>
          ({
            label: word,
            sortText: '10',
            detail: wordsUri.fsPath,
            kind: CompletionItemKind.Keyword,
          }) as CompletionItem,
      )
  }
}
