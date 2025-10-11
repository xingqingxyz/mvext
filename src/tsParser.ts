import {
  commands,
  Position,
  Range,
  Selection,
  Uri,
  workspace,
  type ExtensionContext,
  type TextDocument,
} from 'vscode'
import {
  Language,
  Parser,
  type Node,
  type Point,
  type Tree,
} from 'web-tree-sitter'
import { getExtConfig } from './config'
import { ContextKey } from './context'

export type TSLanguageId =
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
  | 'rust'
  | 'shellscript'

const parsers = {} as Record<TSLanguageId, Parser>
const parserActiveDocumentMap = new Map<Parser, TextDocument>()
const treeMap = new Map<TextDocument, Tree>()
let extensionUri: Uri

export async function getParser(
  languageId: TSLanguageId,
): Promise<Parser | undefined> {
  if (languageId === 'javascriptreact') {
    languageId = 'javascript'
  }
  return (
    parsers[languageId] ??
    (parsers[languageId] = new Parser().setLanguage(
      await Language.load(
        await workspace.fs.readFile(
          Uri.joinPath(extensionUri, `dist/tree-sitter-${languageId}.wasm`),
        ),
      ),
    ))
  )
}

export function getParseCallback(document: TextDocument) {
  // arg point is untrusted
  return (index: number) => {
    const position = document.positionAt(index)
    return document.getText(
      new Range(position, position.with(position.line + 1)),
    )
  }
}

export function positionToPoint(position: Position): Point {
  return {
    row: position.line,
    column: position.character,
  }
}

export function pointToPosition(point: Point) {
  return new Position(point.row, point.column)
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

export function getDescendantPath(root: Node, descendant: Node) {
  const nodePath = []
  do {
    nodePath.push(root)
  } while ((root = root.childWithDescendant(descendant)!))
  return nodePath
}

export function getParsedTree(document: TextDocument) {
  const parser = parsers[document.languageId as TSLanguageId]
  if (!parser) {
    return
  }
  if (parserActiveDocumentMap.get(parser) !== document) {
    parser.reset()
  }
  const tree = treeMap.get(document)
  treeMap.set(document, parser.parse(getParseCallback(document), tree)!)
  tree?.delete()
  return treeMap.get(document)!
}

async function setSyncedLanguages(languages: TSLanguageId[]) {
  await commands.executeCommand(
    'setContext',
    ContextKey.tsSyncedLanguages,
    languages,
  )
  for (const languageId of Object.keys(parsers) as TSLanguageId[]) {
    if (languages.includes(languageId)) {
      continue
    }
    for (const document of Array.from(treeMap.keys())) {
      if (document.languageId === languageId) {
        treeMap.get(document)!.delete()
        treeMap.delete(document)
      }
    }
    // keep parsers alive for getParser API
  }
  for (const document of workspace.textDocuments) {
    if (
      !languages.includes(document.languageId as TSLanguageId) ||
      treeMap.has(document)
    ) {
      continue
    }
    treeMap.set(
      document,
      (await getParser(document.languageId as TSLanguageId))!.parse(
        getParseCallback(document),
      )!,
    )
  }
}

export async function initTSParser(context: ExtensionContext) {
  void ({ extensionUri } = context)
  let syncedLanguages: TSLanguageId[]
  await Parser.init({
    wasmBinary: await workspace.fs.readFile(
      Uri.joinPath(extensionUri, 'dist/tree-sitter.wasm'),
    ),
  } as unknown as EmscriptenModule)
  await setSyncedLanguages(
    (syncedLanguages = getExtConfig('treeSitter.syncedLanguages')),
  )
  context.subscriptions.push(
    workspace.onDidChangeConfiguration(
      (e) =>
        e.affectsConfiguration('mvext.treeSitter.syncedLanguages') &&
        setSyncedLanguages(
          (syncedLanguages = getExtConfig(
            'treeSitter.syncedLanguages',
          ) as TSLanguageId[]),
        ),
    ),
    workspace.onDidOpenTextDocument(
      (document) =>
        syncedLanguages.includes(document.languageId as TSLanguageId) &&
        getParser(document.languageId as TSLanguageId).then(() =>
          getParsedTree(document),
        ),
    ),
    workspace.onDidCloseTextDocument((document) => treeMap.delete(document)),
    workspace.onDidChangeTextDocument((e) => {
      if (!Object.hasOwn(parsers, e.document.languageId)) {
        return
      }
      e.contentChanges.forEach((cc) => {
        const lines = (
          e.document.getText(
            new Range(cc.range.start.with(undefined, 0), cc.range.start),
          ) + cc.text
        ).split('\r\n'.slice(2 - e.document.eol))
        treeMap.get(e.document)!.edit({
          newEndIndex: cc.rangeOffset + cc.text.length,
          newEndPosition: {
            row: cc.range.start.line + lines.length - 1,
            column: lines.at(-1)!.length,
          },
          startIndex: cc.rangeOffset,
          oldEndIndex: cc.rangeOffset + cc.rangeLength,
          oldEndPosition: positionToPoint(cc.range.end),
          startPosition: positionToPoint(cc.range.start),
        })
      })
    }),
    {
      dispose() {
        for (const tree of treeMap.values()) {
          tree.delete()
        }
        Object.values(parsers).forEach((p) => p.delete())
      },
    },
  )
}
