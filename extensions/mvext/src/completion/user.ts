import { noop } from '@/util'
import { homedir } from 'os'
import {
  CompletionItemKind,
  CompletionTriggerKind,
  languages,
  Range,
  Uri,
  workspace,
  type CancellationToken,
  type CompletionContext,
  type CompletionItem,
  type CompletionItemProvider,
  type CompletionList,
  type ExtensionContext,
  type Position,
  type TextDocument,
} from 'vscode'

export class UserCompletionItemProvider implements CompletionItemProvider {
  constructor(context: ExtensionContext) {
    context.subscriptions.push(
      languages.registerCompletionItemProvider(
        [
          {
            pattern: '**',
            scheme: 'file',
          },
          {
            pattern: '**',
            scheme: 'untitled',
          },
          {
            pattern: '**',
            scheme: 'vscode-vfs',
          },
        ],
        this,
      ),
    )
  }
  async provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    context: CompletionContext,
  ) {
    if (
      context.triggerKind !==
      CompletionTriggerKind.TriggerForIncompleteCompletions
    ) {
      return { isIncomplete: true } as CompletionList
    }
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
