import type { ExtensionContext, Position } from 'vscode'
import { Language, Parser, type Point } from 'web-tree-sitter'

export let tsParser: Parser
export const tsLanguages = {} as Record<'css', Language>

export async function initTreeSitter(context: ExtensionContext) {
  await Parser.init()
  tsParser = new Parser()
  tsParser.setLanguage(
    (tsLanguages.css = await Language.load(
      context.asAbsolutePath('resources/wasm/tree-sitter-css.wasm'),
    )),
  )
}

export function positionToPoint(position: Position): Point {
  return {
    row: position.line,
    column: position.character,
  }
}
