import { isWin32 } from '@/util'
import {
  type CancellationToken,
  commands,
  type CompletionContext,
  type CompletionItem,
  CompletionItemKind,
  type CompletionItemProvider,
  type CompletionList,
  CompletionTriggerKind,
  type ExtensionContext,
  languages,
  type Position,
  type TextDocument,
} from 'vscode'

export default class ProxyCompletionItemProvider implements CompletionItemProvider {
  private _noCallingSelf = false
  constructor(context: ExtensionContext) {
    context.subscriptions.push(
      languages.registerCompletionItemProvider({ pattern: '**' }, this),
    )
  }
  async provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    context: CompletionContext,
  ): Promise<CompletionList | undefined> {
    if (
      this._noCallingSelf ||
      context.triggerKind ===
        CompletionTriggerKind.TriggerForIncompleteCompletions
    ) {
      return
    }
    this._noCallingSelf = true
    const completionList = await commands.executeCommand<CompletionList>(
      'vscode.executeCompletionItemProvider',
      document.uri,
      position,
      context.triggerCharacter,
    )
    this._noCallingSelf = false
    if (token.isCancellationRequested) {
      return completionList
    }
    return { items: completionList.items, isIncomplete: true }
  }
  tranformCommitCharacters(item: CompletionItem) {
    const commitCharactersSet = new Set((item.commitCharacters ??= []))
    switch (item.kind) {
      case CompletionItemKind.File:
      case CompletionItemKind.Folder:
      case CompletionItemKind.Reference:
        if (isWin32) {
          commitCharactersSet.add('\\')
        }
        commitCharactersSet.add('/')
        break
      case CompletionItemKind.Constant:
      case CompletionItemKind.Enum:
      case CompletionItemKind.Interface:
      case CompletionItemKind.Module:
      // @ts-expect-error fallthrough
      case CompletionItemKind.Struct:
        commitCharactersSet.add('.')
      case CompletionItemKind.Class:
      case CompletionItemKind.Constructor:
      case CompletionItemKind.Function:
      // @ts-expect-error fallthrough
      case CompletionItemKind.Method:
        commitCharactersSet
          .add('(')
          .add('[')
          .add('{')
          .add('<')
          .add(',')
          .add(':')
          .add(';')
          .add('!')
          .add('?')
          .add('`')
          .add("'")
          .add('"')
      case CompletionItemKind.Field:
      case CompletionItemKind.Property:
      case CompletionItemKind.Value:
      case CompletionItemKind.Variable:
        commitCharactersSet
          .add('=')
          .add('+')
          .add('-')
          .add('*')
          .add('/')
          .add('%')
          .add('^')
          .add('&')
          .add('|')
        break
      // case CompletionItemKind.Color:
      // case CompletionItemKind.EnumMember:
      // case CompletionItemKind.Event:
      // case CompletionItemKind.Issue:
      // case CompletionItemKind.Keyword:
      // case CompletionItemKind.Operator:
      // case CompletionItemKind.Snippet:
      // case CompletionItemKind.Text:
      // case CompletionItemKind.TypeParameter:
      // case CompletionItemKind.Unit:
      // case CompletionItemKind.User:
    }
    item.commitCharacters = Array.from(commitCharactersSet)
    return item
  }
}
