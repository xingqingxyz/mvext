import {
  type CancellationToken,
  commands,
  type CompletionContext,
  type CompletionItem,
  type CompletionItemProvider,
  CompletionTriggerKind,
  type ExtensionContext,
  languages,
  type Position,
  type TextDocument,
} from 'vscode'
import { CSSCompletionItemProvider } from './css'
import { DictCompletionItemProvider } from './dict'
import { LineCompletionItemProvider } from './line'
import { UserCompletionItemProvider } from './user'

export class InvokeCompletionItemProvider implements CompletionItemProvider {
  private active = false
  private providers: CompletionItemProvider[]
  constructor(context: ExtensionContext) {
    this.providers = [
      new DictCompletionItemProvider(context),
      new CSSCompletionItemProvider(),
      new LineCompletionItemProvider(),
      new UserCompletionItemProvider(),
    ]
    context.subscriptions.push(
      commands.registerCommand('mvext.invokeComplete', async () => {
        this.active = true
        await commands.executeCommand('editor.action.triggerSuggest')
        this.active = false
      }),
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
  async provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    context: CompletionContext,
  ) {
    if (!this.active || context.triggerKind !== CompletionTriggerKind.Invoke) {
      return
    }
    const items: CompletionItem[] = []
    for (const provider of this.providers) {
      const it = (await provider.provideCompletionItems(
        document,
        position,
        token,
        context,
      )) as CompletionItem[]
      if (it) {
        items.push(...it)
      }
    }
    return items
  }
}
