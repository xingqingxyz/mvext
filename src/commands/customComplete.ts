import {
  commands,
  CompletionItem,
  CompletionTriggerKind,
  languages,
  type CancellationToken,
  type CompletionContext,
  type CompletionItemProvider,
  type CompletionList,
  type ExtensionContext,
  type Position,
  type ProviderResult,
  type TextDocument,
} from 'vscode'

type CompletionType = 'line' | 'dict' | 'css' | 'none'

let completionType: CompletionType

async function customComplete(type: CompletionType) {
  completionType = type
  await commands.executeCommand('editor.action.triggerSuggest')
  completionType = 'none'
}

class CssCompleteProvider implements CompletionItemProvider {
  provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    context: CompletionContext,
  ): ProviderResult<CompletionItem[] | CompletionList<CompletionItem>> {
    if (
      context.triggerKind !== CompletionTriggerKind.Invoke ||
      completionType !== 'line'
    ) {
      return
    }
    return [
      'aria2c',
      'bat',
      'cat',
      'cd',
      'chafa',
      'code',
      'curl',
      'fd',
      'git',
      'ls',
      'npm',
      'pandoc',
      'pnpm',
      'py',
      'regex',
      'rm',
      'sleep',
      'System',
      'vi',
      'winget',
      'z',
    ].map((word) => ({ label: word, sortText: '' }) satisfies CompletionItem)
  }
}

export function registerCustomComplete(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand('vincode.customComplete', customComplete),
    languages.registerCompletionItemProvider(
      { pattern: '**' },
      new CssCompleteProvider(),
    ),
  )
}
