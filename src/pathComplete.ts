import { Dirent } from 'fs'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import {
  CancellationToken,
  CompletionContext,
  CompletionItem,
  CompletionItemKind,
  CompletionTriggerKind,
  Disposable,
  Position,
  ProviderResult,
  Range,
  TextDocument,
  languages,
  workspace,
  type CompletionItemProvider,
} from 'vscode'
import { getConfig } from './config'
import { extContext } from './context'
import { isWin32 } from './util'

export class PathCompleteProvider
  implements CompletionItemProvider, Disposable
{
  static readonly reFilePath = isWin32
    ? /(?:[-\w\\/.+,#$%{}[\]@!~=]|[^\x00-\xff])*$/
    : /(?:[-\w/.+,#$%~=]|[^\x00-\xff])*$/
  static readonly triggerCharacters = isWin32 ? ['\\', '/'] : ['/']
  static readonly defaultPrefixMap: Map<string, string> = new Map().set(
    '~',
    os.homedir(),
  )
  dispose: () => void
  private base = ''
  private prefixMap!: typeof PathCompleteProvider.defaultPrefixMap

  private constructor() {
    this.readPrefixMapSettings()
    const disposable = workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('mvext.pathComplete.prefixMap')) {
        this.readPrefixMapSettings()
      }
    })
    this.dispose = () => disposable.dispose()
  }

  async provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    context: CompletionContext,
  ) {
    if (context.triggerKind !== CompletionTriggerKind.TriggerCharacter) {
      return
    } else {
      const [prefix, path] = PathCompleteProvider.getPrefixPath(
        document,
        position,
      )
      this.base = this.expandPrefixPath(prefix, path, document)
      let dirents: Dirent[]
      try {
        dirents = await fs.readdir(this.base, { withFileTypes: true })
      } catch {
        return
      }

      const commitCharacters = [context.triggerCharacter!]
      const items: CompletionItem[] = dirents.map((dirent) => ({
        label: dirent.name,
        kind: dirent.isDirectory()
          ? CompletionItemKind.Folder
          : dirent.isSymbolicLink()
            ? CompletionItemKind.Reference
            : CompletionItemKind.File,
        commitCharacters,
      }))

      const { trimRelativePrefix } = getConfig(document, 'pathComplete')

      if (trimRelativePrefix && /^\.[\\/]/.test(path)) {
        const range = new Range(
          position.with({ character: position.character - 2 }),
          position.with({ character: position.character + 1 }),
        )
        for (const item of items) {
          item.range = range
          // item.insertText = item.label as string
        }
      }
      return items
    }
  }

  resolveCompletionItem(
    item: CompletionItem,
    token: CancellationToken,
  ): ProviderResult<CompletionItem> {
    item.detail = path.join(this.base, item.label as string)
    return item
  }

  //#region util
  readPrefixMapSettings() {
    const wspFolder = workspace.workspaceFolders?.[0]
    const wspPath = wspFolder?.uri.fsPath ?? '/'
    const replacements = {
      '~': os.homedir(),
      '${workspaceFolder}': wspPath,
    }
    const json = getConfig(wspFolder, 'pathComplete').prefixMap
    this.prefixMap = new Map(PathCompleteProvider.defaultPrefixMap)
    for (let [key, val] of Object.entries(json)) {
      for (const [lhs, rhs] of Object.entries(replacements)) {
        if (val.startsWith(lhs)) {
          val = rhs + val.slice(lhs.length)
          break
        }
      }
      this.prefixMap.set(key, val)
    }
  }

  expandPrefixPath(prefix: string, basePath: string, document: TextDocument) {
    for (const [lhs, rhs] of this.prefixMap) {
      if (basePath.startsWith(lhs)) {
        basePath = rhs + basePath.slice(lhs.length)
        break
      }
      if (prefix.endsWith(lhs)) {
        basePath = rhs + basePath
        break
      }
    }
    if (!PathCompleteProvider.triggerCharacters.includes(basePath[0])) {
      basePath = path.join(document.fileName, '..', basePath)
    }
    return basePath
  }

  static getPrefixPath(
    document: TextDocument,
    position: Position,
  ): [prefix: string, path: string] {
    const text = document.lineAt(position).text.slice(0, position.character)
    const path = text.match(PathCompleteProvider.reFilePath)![0]
    return [text.slice(0, -path.length), path]
  }
  //#endregion

  static register?() {
    const provider = new PathCompleteProvider()
    extContext.subscriptions.push(
      provider,
      languages.registerCompletionItemProvider(
        { pattern: '**' },
        provider,
        ...PathCompleteProvider.triggerCharacters,
      ),
    )
    delete PathCompleteProvider.register
  }
}
