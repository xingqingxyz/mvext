import { getExtConfig } from '@/config'
import { PathCompleteProvider } from '@/pathComplete'
import { isWin32 } from '@/util'
import {
  type CancellationToken,
  commands,
  type CompletionContext,
  type CompletionItem,
  type CompletionItemProvider,
  type CompletionList,
  CompletionTriggerKind,
  type ExtensionContext,
  languages,
  type Position,
  type ProviderResult,
  type TextDocument,
} from 'vscode'
import { CssCompleteProvider } from './css'
import { DictionaryCompleteProvider } from './dictionary'
import { LineCompleteProvider } from './line'
import { UserCompleteProvider } from './user'

type InvokeCompleteKind =
  | 'css'
  | 'dictionary'
  | 'line'
  | 'path'
  | 'user'
  | 'none'

export class InvokeCompleteProvider implements CompletionItemProvider {
  private kind: InvokeCompleteKind = 'none'
  private css: CompletionItemProvider
  private dictionary = new DictionaryCompleteProvider()
  private line = new LineCompleteProvider()
  private path = new PathCompleteProvider()
  private user = new UserCompleteProvider()
  private enabled = getExtConfig('invokeComplete.enabled')
  constructor(context: ExtensionContext) {
    this.css = new CssCompleteProvider(context)
    context.subscriptions.push(
      commands.registerCommand(
        'mvext.invokeComplete',
        async (kind: InvokeCompleteKind) => {
          this.kind = kind
          await commands.executeCommand('hideSuggestWidget')
          await commands.executeCommand('editor.action.triggerSuggest')
          this.kind = 'none'
        },
      ),
      languages.registerCompletionItemProvider({ pattern: '**' }, this),
    )
  }
  provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    context: CompletionContext,
  ): ProviderResult<CompletionItem[] | CompletionList> {
    if (
      context.triggerKind !== CompletionTriggerKind.Invoke ||
      this.kind === 'none'
    ) {
      return
    }
    if (this.kind === 'path') {
      context = {
        triggerKind: CompletionTriggerKind.TriggerCharacter,
        triggerCharacter: isWin32 ? '\\' : '/',
      }
    }
    return this[this.kind].provideCompletionItems(
      document,
      position,
      token,
      context,
    )
  }
}
