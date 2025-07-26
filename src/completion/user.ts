import { tokenToSignal } from '@/util'
import { readFile } from 'fs/promises'
import { homedir } from 'os'
import path from 'path'
import {
  CompletionItemKind,
  Range,
  workspace,
  type CancellationToken,
  type CompletionContext,
  type CompletionItem,
  type CompletionItemProvider,
  type Position,
  type TextDocument,
} from 'vscode'

export class UserCompleteProvider implements CompletionItemProvider {
  async provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: CompletionContext,
  ) {
    const needle = document.getText(
      document.getWordRangeAtPosition(position) ??
        new Range(position, position),
    )
    const wordsFile = path.join(
      workspace.getWorkspaceFolder(document.uri)?.uri.fsPath ?? homedir(),
      '.vscode/words.txt',
    )
    return (
      await readFile(wordsFile, {
        signal: tokenToSignal(token),
        encoding: 'utf-8',
      }).catch(() => '')
    )
      .split(/\r?\n/g)
      .filter((word) => word.includes(needle))
      .map(
        (word) =>
          ({
            label: word,
            sortText: '10',
            detail: wordsFile,
            kind: CompletionItemKind.Keyword,
          }) as CompletionItem,
      )
  }
}
