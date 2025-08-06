import { getExtConfig } from '@/config'
import { tokenToSignal } from '@/util'
import {
  CallParenType,
  CollapseSimpleStatement,
  Config,
  formatCode,
  IndentType,
  initSync,
  LineEndings,
  LuaVersion,
  OutputVerification,
  QuoteStyle,
  SortRequiresConfig,
  SpaceAfterFunctionNames,
  Range as StyluaRange,
} from '@johnnymorganz/stylua/web'
import { execFile } from 'child_process'
import {
  languages,
  Range,
  TextEdit,
  Uri,
  workspace,
  type CancellationToken,
  type DocumentFormattingEditProvider,
  type DocumentRangeFormattingEditProvider,
  type ExtensionContext,
  type FormattingOptions,
  type TextDocument,
} from 'vscode'

export class StyluaFormatter
  implements DocumentRangeFormattingEditProvider, DocumentFormattingEditProvider
{
  constructor(context: ExtensionContext) {
    context.subscriptions.push(
      languages.registerDocumentFormattingEditProvider(
        [
          { scheme: 'file', language: 'lua' },
          { scheme: 'vscode-vfs', language: 'lua' },
        ],
        this,
      ),
      languages.registerDocumentRangeFormattingEditProvider(
        [
          { scheme: 'file', language: 'lua' },
          { scheme: 'vscode-vfs', language: 'lua' },
        ],
        this,
      ),
    )
  }
  async provideDocumentFormattingEdits(
    document: TextDocument,
    options: FormattingOptions,
    token: CancellationToken,
  ): Promise<TextEdit[]> {
    const output = await new Promise<string>((resolve, reject) => {
      const p = execFile(
        'stylua',
        [
          ...getExtConfig('stylua.extraArgs'),
          '--stdin-filepath',
          document.fileName,
          '--indent-type',
          options.insertSpaces ? 'Spaces' : 'Tabs',
          '--indent-width',
          options.tabSize.toString(),
          '-',
        ],
        {
          encoding: 'utf-8',
          signal: tokenToSignal(token),
        },
        (err, stdout) => {
          if (err) reject(err)
          else resolve(stdout)
        },
      )
      p.stdin!.write(document.getText())
      p.stdin!.end()
    })
    return [new TextEdit(new Range(0, 0, document.lineCount, 0), output)]
  }
  async provideDocumentRangeFormattingEdits(
    document: TextDocument,
    range: Range,
    options: FormattingOptions,
    token: CancellationToken,
  ): Promise<TextEdit[] | null | undefined> {
    const output = await new Promise<string>((resolve, reject) => {
      const p = execFile(
        'stylua',
        [
          ...getExtConfig('stylua.extraArgs'),
          '--stdin-filepath',
          document.fileName,
          '--range-start',
          document.offsetAt(range.start).toString(),
          '--range-end',
          document.offsetAt(range.end).toString(),
          '--indent-type',
          options.insertSpaces ? 'Spaces' : 'Tabs',
          '--indent-width',
          options.tabSize.toString(),
          '-',
        ],
        {
          encoding: 'utf-8',
          signal: tokenToSignal(token),
        },
        (err, stdout) => {
          if (err) reject(err)
          else resolve(stdout)
        },
      )
      p.stdin!.write(document.getText())
      p.stdin!.end()
    })
    return [new TextEdit(range, output)]
  }
}

export class StyluaFormatterWasm
  implements DocumentRangeFormattingEditProvider, DocumentFormattingEditProvider
{
  private static makeConfig(options: FormattingOptions) {
    const config = Config.new()
    config.call_parentheses = CallParenType.None
    config.collapse_simple_statement = CollapseSimpleStatement.Always
    config.column_width = 80
    config.indent_type = options.insertSpaces
      ? IndentType.Spaces
      : IndentType.Tabs
    config.indent_width = options.tabSize
    config.line_endings = LineEndings.Unix
    config.quote_style = QuoteStyle.AutoPreferSingle
    config.sort_requires = SortRequiresConfig.new()
    config.sort_requires.enabled = true
    config.space_after_function_names = SpaceAfterFunctionNames.Never
    config.syntax = LuaVersion.All
    return config
  }
  constructor(context: ExtensionContext) {
    void workspace.fs
      .readFile(Uri.joinPath(context.extensionUri, 'dist/stylua.wasm'))
      .then(initSync)
    context.subscriptions.push(
      languages.registerDocumentFormattingEditProvider(
        [
          { scheme: 'file', language: 'lua' },
          { scheme: 'vscode-vfs', language: 'lua' },
        ],
        this,
      ),
      languages.registerDocumentRangeFormattingEditProvider(
        [
          { scheme: 'file', language: 'lua' },
          { scheme: 'vscode-vfs', language: 'lua' },
        ],
        this,
      ),
    )
  }
  async provideDocumentFormattingEdits(
    document: TextDocument,
    options: FormattingOptions,
  ): Promise<TextEdit[]> {
    return [
      new TextEdit(
        new Range(0, 0, document.lineCount, 0),
        formatCode(
          document.getText(),
          StyluaFormatterWasm.makeConfig(options),
          undefined,
          OutputVerification.None,
        ),
      ),
    ]
  }
  async provideDocumentRangeFormattingEdits(
    document: TextDocument,
    range: Range,
    options: FormattingOptions,
  ): Promise<TextEdit[] | null | undefined> {
    return [
      new TextEdit(
        new Range(0, 0, document.lineCount, 0),
        formatCode(
          document.getText(),
          StyluaFormatterWasm.makeConfig(options),
          StyluaRange.from_values(
            document.offsetAt(range.start),
            document.offsetAt(range.end) - 1, // inclusive
          ),
          OutputVerification.None,
        ),
      ),
    ]
  }
}
