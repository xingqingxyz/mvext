import {
  Range,
  Selection,
  type ExtensionContext,
  type Position,
  type TextDocument,
} from 'vscode'
import {
  Language,
  Parser,
  type Node,
  type ParseCallback,
  type Point,
} from 'web-tree-sitter'

export type TSLanguageId =
  | 'css'
  | 'javascript'
  | 'typescript'
  | 'typescriptreact'
  | 'html'

export class TSParser {
  private constructor() {}
  private static context: ExtensionContext
  static readonly parsers = {} as Record<TSLanguageId, Parser>
  static async init(context: ExtensionContext) {
    this.context = context
    await Parser.init()
  }
  static async createParser(languageId: TSLanguageId) {
    if (Object.hasOwn(this.parsers, languageId)) {
      return this.parsers[languageId]
    }
    const parser = new Parser()
    this.context.subscriptions.push({
      dispose() {
        parser.delete()
      },
    })
    parser.setLanguage(
      await Language.load(
        this.context.asAbsolutePath(
          `resources/wasm/tree-sitter-${languageId}.wasm`,
        ),
      ),
    )
    this.parsers[languageId] = parser
    return parser
  }
}

export function getParseCallback(document: TextDocument): ParseCallback {
  return (index: number | Range, position: Point) =>
    position.row < document.lineCount
      ? document
          .getText(document.lineAt(position.row).rangeIncludingLineBreak)
          .slice(position.column)
      : undefined
}

export function positionToPoint(position: Position): Point {
  return {
    row: position.line,
    column: position.character,
  }
}

export function nodeToRange<const T>(
  node: Node,
  selection?: T,
): T extends true ? Selection : Range {
  return new (selection ? Selection : Range)(
    node.startPosition.row,
    node.startPosition.column,
    node.endPosition.row,
    node.endPosition.column,
  ) as Selection
}

export function nodeRangeToString(node: Node) {
  return `[${node.startPosition.row}, ${node.startPosition.column}] - [${node.endPosition.row}, ${node.endPosition.column}]`
}
