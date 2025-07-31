import {
  CodeLens,
  languages,
  Position,
  Range,
  type CancellationToken,
  type CodeLensProvider,
  type Event,
  type ExtensionContext,
  type ProviderResult,
  type TextDocument,
} from 'vscode'

export class MarkdownBlockRunProvider implements CodeLensProvider {
  static readonly reCodeBlockRange =
    /(?<=^\s*|\n\s*)```([^\n]*)\n(.*?)\n\s*```\s*(?:\n|$)/gs
  constructor(context: ExtensionContext) {
    context.subscriptions.push(
      languages.registerCodeLensProvider(
        [
          { scheme: 'file', language: 'markdown' },
          { scheme: 'vscode-vfs', language: 'markdown' },
        ],
        this,
      ),
    )
  }
  onDidChangeCodeLenses?: Event<void> | undefined
  provideCodeLenses(
    document: TextDocument,
    token: CancellationToken,
  ): ProviderResult<CodeLens[]> {
    const codelens: CodeLens[] = []
    for (const { index, 1: language, 2: code } of document
      .getText()
      .matchAll(MarkdownBlockRunProvider.reCodeBlockRange)) {
      if (token.isCancellationRequested) {
        return
      }
      let languageId
      switch (language.trim().split(/\s/)[0]) {
        case 'bat':
        case 'cmd':
          languageId = 'bat'
          break
        case 'sh':
        case 'bash':
        case 'shell':
          languageId = 'shellscript'
          break
        case 'pwsh':
        case 'powershell':
          languageId = 'powershell'
          break
        case 'py':
        case 'python':
          languageId = 'python'
          break
        case 'js':
        case 'javascript':
          languageId = 'javascript'
          break
        case 'jsx':
        case 'javascriptreact':
        case 'ts':
        case 'tsx':
        case 'typescript':
        case 'typescriptreact':
          languageId = 'typescript'
          break
      }
      const position = new Position(document.positionAt(index).line, 0)
      const range = new Range(position, position)
      if (languageId) {
        codelens.push(
          new CodeLens(range, {
            command: 'mvext.terminalRunCode',
            title: '$(run)Run Code',
            tooltip: `Run ${languageId} block interactively`,
            arguments: [code, languageId],
          }),
        )
      }
      codelens.push(
        new CodeLens(range, {
          command: 'mvext._copyCodeBlock',
          title: '$(clippy)Copy',
          tooltip: 'Copy Text',
          arguments: [code],
        }),
      )
    }
    return codelens
  }
}
