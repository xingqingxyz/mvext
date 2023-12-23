import { Dirent } from 'fs'
import * as fs from 'fs/promises'
import * as os from 'os'
import path from 'path'
import {
  CancellationToken,
  CompletionContext,
  CompletionItem,
  CompletionItemKind,
  CompletionTriggerKind,
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

class PathCompleteProvider implements CompletionItemProvider {
  static readonly reFilePath = isWin32
    ? /(?:[-\w\\/.+,#$%{}[\]@!~=]|[^\x00-\xff])*$/
    : /(?:[-\w/.+,#$%~=@]|[^\x00-\xff])*$/
  static readonly triggerCharacters = isWin32 ? ['\\', '/'] : ['/']
  static readonly defaultPrefixMap: Record<string, string> = {
    '~': os.homedir(),
  }
  private currentPrefixPath = ''

  async provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    context: CompletionContext,
  ) {
    if (context.triggerKind !== CompletionTriggerKind.TriggerCharacter) {
      return
    } else {
      const commitCharacters = [context.triggerCharacter!]

      let prefixPath = PathCompleteProvider.getPrefixPath(document, position)
      prefixPath = PathCompleteProvider.expandPrefixPath(prefixPath, document)
      this.currentPrefixPath = prefixPath
      let dirents: Dirent[]
      try {
        dirents = await fs.readdir(prefixPath, { withFileTypes: true })
      } catch {
        return
      }
      const items: CompletionItem[] = dirents.map((dirent) => ({
        label: dirent.name,
        kind: dirent.isDirectory()
          ? CompletionItemKind.Folder
          : CompletionItemKind.File,
        commitCharacters,
      }))

      const { trimRelativePrefix } = getConfig(document, 'pathComplete')

      if (trimRelativePrefix && prefixPath.endsWith('.')) {
        const range = new Range(
          position.with({ character: position.character - 2 }),
          position,
        )
        for (const item of items) {
          item.range = range
          item.insertText = item.label as string
        }
      }

      // prevent user from type ['//', './', '../'] trigger commit unexpectedly
      items.push(
        {
          label: '.',
          kind: CompletionItemKind.Folder,
          sortText: String.fromCharCode(0xffff),
        },
        {
          label: '..',
          kind: CompletionItemKind.Folder,
          sortText: String.fromCharCode(0xffff),
        },
      )
      return items
    }
  }

  resolveCompletionItem?(
    item: CompletionItem,
    token: CancellationToken,
  ): ProviderResult<CompletionItem> {
    item.detail = path.join(this.currentPrefixPath, item.label as string)
    return item
  }

  static expandPrefixPath(prefix: string, document: TextDocument) {
    const prefixMap = extContext.workspaceState.get(
      'pathComplete.prefixMap',
      PathCompleteProvider.defaultPrefixMap,
    )
    for (const [lhs, rhs] of Object.entries(prefixMap)) {
      if (prefix.startsWith(lhs)) {
        return rhs + prefix.slice(lhs.length)
      }
    }
    if (!prefix.startsWith('/')) {
      prefix = path.join(document.fileName, '..', prefix)
    }
    return prefix
  }

  //#region util
  static getPrefixPath(document: TextDocument, position: Position) {
    const line = document.lineAt(position)
    const text = line.text.slice(0, position.character)
    return text.match(PathCompleteProvider.reFilePath)![0]
  }
  //#endregion
}

export function register() {
  extContext.subscriptions.push(
    languages.registerCompletionItemProvider(
      { pattern: '**' },
      new PathCompleteProvider(),
      ...PathCompleteProvider.triggerCharacters,
    ),
    workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('mvext.pathComplete.prefixMap')) {
        const wspFolder = workspace.workspaceFolders?.[0]
        const wspPath = wspFolder?.uri.fsPath ?? '/'
        const replacements = {
          '~': os.homedir(),
          '${workspaceFolder}': wspPath,
        }
        const prefixMap = PathCompleteProvider.defaultPrefixMap
        for (let [cfgKey, cfgVal] of Object.entries(
          getConfig(wspFolder, 'pathComplete').prefixMap,
        )) {
          for (const [lhs, rhs] of Object.entries(replacements)) {
            if (cfgVal.startsWith(lhs)) {
              cfgVal = rhs + cfgVal.slice(lhs.length)
            }
            prefixMap[cfgKey] = cfgVal
          }
        }
        extContext.workspaceState.update('pathComplete.prefixMap', prefixMap)
      }
    }),
  )
}
