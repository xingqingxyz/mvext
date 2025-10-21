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
import { DictCompleteProvider } from './dict'
import { LineCompleteProvider } from './line'
import { UserCompleteProvider } from './user'

type InvokeCompleteKind = 'css' | 'dict' | 'line' | 'user' | 'none'

export class InvokeCompleteProvider implements CompletionItemProvider {
  private kind: InvokeCompleteKind = 'none'
  private css = new CssCompleteProvider()
  private dict: CompletionItemProvider
  private line = new LineCompleteProvider()
  private user = new UserCompleteProvider()
  constructor(context: ExtensionContext) {
    this.dict = new DictCompleteProvider(context)
    context.subscriptions.push(
      commands.registerCommand(
        'mvext.invokeComplete',
        async (kind: InvokeCompleteKind) => {
          this.kind = kind
          await commands.executeCommand('editor.action.triggerSuggest')
          this.kind = 'none'
        },
      ),
      languages.registerCompletionItemProvider(
        [
          { scheme: 'file', pattern: '**' },
          { scheme: 'vscode-vfs', pattern: '**' },
          { scheme: 'vscode-remote', pattern: '**' },
        ],
        this,
      ),
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
    return this[this.kind].provideCompletionItems(
      document,
      position,
      token,
      context,
    )
  }
}
