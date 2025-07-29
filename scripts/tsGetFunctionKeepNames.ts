import { readFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import { Language, Parser } from 'web-tree-sitter'

const file = process.argv[2]
await Parser.init()
const parser = new Parser().setLanguage(
  await Language.load(
    fileURLToPath(
      import.meta.resolve(
        '@vscode/tree-sitter-wasm/wasm/tree-sitter-typescript.wasm',
      ),
    ),
  ),
)
const content = await readFile(file, 'utf-8')
const tree = parser.parse(content)!
console.log(
  tree.rootNode.namedChildren
    .map(
      (n) =>
        n!.type === 'export_statement' &&
        n!.firstNamedChild!.type === 'function_declaration' &&
        n!.firstNamedChild!.childForFieldName('name')!.text,
    )
    .filter(Boolean)
    .join('|'),
)
