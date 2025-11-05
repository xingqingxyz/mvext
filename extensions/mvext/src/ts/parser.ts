import {
  commands,
  Position,
  Range,
  Selection,
  Uri,
  window,
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
import { getExtConfig } from '../config'
import { ContextKey } from '../context'

const parsers = {} as Record<string, Parser>
const treeMap = new Map<TextDocument, Tree>()
let extensionUri: Uri

export async function getParser(languageId: string) {
  if (!languageId.length) {
    throw 'empty languageId'
  }
  if (languageId === 'javascriptreact') {
    languageId = 'javascript'
  }
  if (languageId in parsers) {
    return parsers[languageId]
  }
  const config = getExtConfig('treeSitter.extraParserMap')
  let uri
  if (languageId in config) {
    uri = Uri.file(config[languageId])
  } else if (languageId === 'javascriptreact') {
    if (!('javascript' in parsers)) {
      parsers.javascript = new Parser().setLanguage(
        await Language.load(
          await workspace.fs.readFile(
            Uri.joinPath(extensionUri, 'dist/tree-sitter-javascript.wasm'),
          ),
        ),
      )
    }
    return (parsers.javascriptreact = new Parser().setLanguage(
      parsers.javascript.language,
    ))
  } else {
    uri = Uri.joinPath(extensionUri, `dist/tree-sitter-${languageId}.wasm`)
  }
  try {
    return (parsers[languageId] = new Parser().setLanguage(
      await Language.load(await workspace.fs.readFile(uri)),
    ))
  } catch {
    await window.showErrorMessage('tree-sitter parser cannot be load at ' + uri)
  }
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
  if (!(document.languageId in parsers)) {
    return
  }
  const tree = treeMap.get(document)
  treeMap.set(
    document,
    parsers[document.languageId].parse(getParseCallback(document), tree)!,
  )
  tree?.delete()
  return treeMap.get(document)!
}

async function setSyncedLanguages(languages: string[]) {
  await commands.executeCommand(
    'setContext',
    ContextKey.tsSyncedLanguages,
    languages,
  )
  for (const languageId of Object.keys(parsers)) {
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
    if (!languages.includes(document.languageId) || treeMap.has(document)) {
      continue
    }
    treeMap.set(
      document,
      (await getParser(document.languageId))!.parse(
        getParseCallback(document),
      )!,
    )
  }
}

export async function initTSParser(context: ExtensionContext) {
  void ({ extensionUri } = context)
  let syncedLanguages: string[]
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
        e.affectsConfiguration('mvext.treeSitter') &&
        setSyncedLanguages(
          (syncedLanguages = getExtConfig('treeSitter.syncedLanguages')),
        ),
    ),
    workspace.onDidOpenTextDocument(
      (document) =>
        syncedLanguages.includes(document.languageId) &&
        getParser(document.languageId).then(() => getParsedTree(document)),
    ),
    workspace.onDidCloseTextDocument((document) => treeMap.delete(document)),
    workspace.onDidChangeTextDocument((e) => {
      if (!(e.document.languageId in parsers)) {
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
