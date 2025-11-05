import { readFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import { Language, Parser } from 'web-tree-sitter'

const files = process.argv.slice(2)
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
await Promise.all(
  files.flatMap(async (file) =>
    parser
      .parse(await readFile(file, 'utf-8'))!
      .rootNode.namedChildren.map(
        (n) =>
          n!.type === 'export_statement' &&
          n!.firstNamedChild!.type === 'function_declaration' &&
          n!.firstNamedChild!.childForFieldName('name')!.text,
      )
      .filter(Boolean),
  ),
).then((r) => console.log(r.join('|')))
