import { fileURLToPath } from 'url'
import { Language, Parser } from 'web-tree-sitter'

const languageId = process.argv[2]
await Parser.init()
const language = await Language.load(
  fileURLToPath(
    import.meta.resolve(
      `@vscode/tree-sitter-wasm/wasm/tree-sitter-${languageId}.wasm`,
    ),
  ),
)
console.log(
  `export const enum ${languageId} {\n${Array.from(
    new Set(language.types),
    (type) =>
      type &&
      `  ${JSON.stringify(type)} = ${language.idForNodeType(type, false)},`,
  ).join(
    '\n',
  )}\n}\n\nexport const enum ${languageId}Super {\n${language.supertypes
    .map((id) => `  ${JSON.stringify(language.nodeTypeForId(id))} = ${id},`)
    .join('\n')}\n}${language.supertypes.map((id) => {
    const superTypeName = JSON.stringify(language.nodeTypeForId(id))
    return `\n\nexport const enum ${superTypeName} {\n${language
      .subtypes(id)
      .map((id) => `  ${JSON.stringify(language.nodeTypeForId(id))} = ${id},`)
      .join('\n')}\n}`
  })}`,
)
