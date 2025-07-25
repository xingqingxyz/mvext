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
  | 'csharp'
  | 'cpp'
  | 'css'
  | 'go'
  | 'ini'
  | 'java'
  | 'javascript'
  | 'javascriptreact'
  | 'typescript'
  | 'typescriptreact'
  | 'python'
  | 'ruby'
  | 'rust'

type TSLanguageWasmId =
  | 'c-sharp'
  | 'cpp'
  | 'css'
  | 'go'
  | 'ini'
  | 'java'
  | 'javascript'
  | 'python'
  | 'regex'
  | 'ruby'
  | 'rust'
  | 'tsx'
  | 'typescript'

let extContext: ExtensionContext
const parsers = {} as Record<TSLanguageId, Parser>

export async function initTSParser(context: ExtensionContext) {
  extContext = context
  await Parser.init()
}

function getLanguageWasmId(languageId: TSLanguageId): TSLanguageWasmId {
  switch (languageId) {
    case 'csharp':
      return 'c-sharp'
    case 'cpp':
    case 'css':
    case 'go':
    case 'ini':
    case 'java':
    case 'javascript':
    case 'typescript':
    case 'python':
    case 'ruby':
    case 'rust':
      return languageId
    case 'javascriptreact':
      return 'javascript'
    case 'typescriptreact':
      return 'tsx'
  }
}

export async function getParser(languageId: TSLanguageId) {
  languageId = getLanguageWasmId(languageId) as TSLanguageId
  if (Object.hasOwn(parsers, languageId)) {
    return parsers[languageId]
  }
  const parser = new Parser()
  extContext.subscriptions.push({
    dispose() {
      parser.delete()
    },
  })
  return (parsers[languageId] = parser.setLanguage(
    await Language.load(
      extContext.asAbsolutePath(
        `resources/wasm/tree-sitter-${languageId}.wasm`,
      ),
    ),
  ))
}

export function getParseCallback(document: TextDocument): ParseCallback {
  return (index: number, position: Point) =>
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

export function nodeToRange<const T extends boolean>(
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
