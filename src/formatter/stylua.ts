import stylua from '@johnnymorganz/stylua'
import {
  languages,
  Position,
  Range,
  TextEdit,
  workspace,
  type CancellationToken,
  type Disposable,
  type DocumentFormattingEditProvider,
  type DocumentRangeFormattingEditProvider,
  type FormattingOptions,
  type TextDocument,
} from 'vscode'

export class StyluaFormatter2
  implements
    DocumentRangeFormattingEditProvider,
    DocumentFormattingEditProvider,
    Disposable
{
  static makeConfig(options: FormattingOptions) {
    const config = stylua.Config.new()
    config.indent_type =
      stylua.IndentType[options.insertSpaces ? 'Spaces' : 'Tabs']
    config.indent_width = options.tabSize
    config.column_width =
      workspace.getConfiguration('editor.rulers').get<number[]>('')?.[0] ?? 80
    config.call_parentheses = stylua.CallParenType.None
    config.collapse_simple_statement = stylua.CollapseSimpleStatement.Never
    config.line_endings = stylua.LineEndings.Unix
    config.quote_style = stylua.QuoteStyle.AutoPreferSingle
    return config
  }

  private _disposables = [
    languages.registerDocumentFormattingEditProvider(['lua'], this),
    languages.registerDocumentRangeFormattingEditProvider(['lua'], this),
  ]

  dispose() {
    for (const d of this._disposables) {
      d.dispose()
    }
  }

  provideDocumentFormattingEdits(
    document: TextDocument,
    options: FormattingOptions,
    token: CancellationToken,
  ) {
    return [
      new TextEdit(
        new Range(
          new Position(0, 0),
          document.lineAt(document.lineCount - 1).range.end,
        ),
        stylua.formatCode(
          document.getText(),
          StyluaFormatter2.makeConfig(options),
          undefined,
          stylua.OutputVerification.Full,
        ),
      ),
    ]
  }

  provideDocumentRangeFormattingEdits(
    document: TextDocument,
    range: Range,
    options: FormattingOptions,
    token: CancellationToken,
  ) {
    return [
      new TextEdit(
        range,
        stylua.formatCode(
          document.getText(),
          StyluaFormatter2.makeConfig(options),
          stylua.Range.from_values(
            document.offsetAt(range.start),
            document.offsetAt(range.end),
          ),
          stylua.OutputVerification.Full,
        ),
      ),
    ]
  }
}
