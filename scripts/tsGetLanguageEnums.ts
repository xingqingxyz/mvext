import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import { Language, Parser } from 'web-tree-sitter'

const languageIds = process.argv.slice(2)
const reWord = /^\w+$/
await Parser.init()
await Promise.all(
  languageIds.map(async (languageId) => {
    const language = await Language.load(
      await readFile(
        path.join(
          import.meta.dirname,
          `../dist/tree-sitter-${languageId}.wasm`,
        ),
      ),
    )
    console.log(language.name, language.abiVersion)
    const typeSet = new Set(language.types)
    // @ts-ignore
    typeSet.delete(undefined)
    const types = Array.from(
      typeSet,
      (type) =>
        [
          language.idForNodeType(type, reWord.test(type)) ??
            language.idForNodeType(type, false)!,
          type,
        ] as const,
    ).sort(([a], [b]) => a - b)
    const content = `export const enum ${languageId} {\n${types
      .map(([id, type]) => `  ${JSON.stringify(type)} = ${id},`)
      .join('\n')}\n}\n\n${language.supertypes
      .map((id) => {
        const superTypeName = language.nodeTypeForId(id) // assert named
        return `export const enum ${superTypeName} {\n${language
          .subtypes(id)
          .sort((a, b) => a - b)
          .map((id) => `  ${language.nodeTypeForId(id)} = ${id},`)
          .join('\n')}\n}\n`
      })
      .join('\n')}`
    await writeFile(
      path.join(import.meta.dirname, `../src/tsLanguage/${languageId}.ts`),
      content,
      'utf-8',
    )
  }),
)
