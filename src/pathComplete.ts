import { homedir } from 'os'
import {
  CancellationToken,
  CompletionContext,
  CompletionItem,
  CompletionItemKind,
  CompletionTriggerKind,
  ExtensionContext,
  FileType,
  Position,
  TextDocument,
  Uri,
  languages,
  workspace,
} from 'vscode'
import { LangIds } from './utils'

export class PathCompleteProvider {
  static readonly reValidSuffix = /[^ '"`]*[\\/][^'"`?*:<>|]*$/
  static readonly commitChars = ['\\', '/']
  static cfgPathMappings: Record<string, string | string[]>

  async provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    context: CompletionContext,
  ) {
    if (context.triggerKind !== CompletionTriggerKind.TriggerCharacter) {
      return
    }

    const words = PathCompleteProvider.getSubPaths(document, position)
    if (!words) {
      return
    }

    const baseDirs = PathCompleteProvider.getBaseDirsFromPaths(words, document)

    const compItems = []
    for (const baseDir of baseDirs) {
      const baseDirPath = workspace.asRelativePath(baseDir)
      try {
        for (const [name, type] of await workspace.fs.readDirectory(baseDir)) {
          const item = new CompletionItem(
            name,
            type === FileType.Directory
              ? CompletionItemKind.Folder
              : CompletionItemKind.File,
          )
          item.commitCharacters = PathCompleteProvider.commitChars
          item.detail = baseDirPath
          compItems.push(item)
        }
      } catch {
        continue
      }
    }

    return compItems
  }

  //#region util
  static getSubPaths(document: TextDocument, position: Position) {
    let text = document.lineAt(position).text.slice(0, position.character)
    if (!text) {
      return ['']
    }

    if (LangIds.langIdRawFile.includes(document.languageId)) {
      text = text.split('=').at(-1)!
    } else {
      if (
        LangIds.langIdJsOrJsx.includes(document.languageId) &&
        /\b(import|require)\b/.test(text)
      ) {
        return
      }
      if (!/['"`]/.test(text)) {
        return
      }
    }
    // get sub paths like 'abc/cde'
    text = text.slice(PathCompleteProvider.reValidSuffix.exec(text)!.index)

    return text.split(/[\\/]/)
  }

  static getBaseDirsFromPaths(words: string[], document: TextDocument): Uri[] {
    const first = words[0]
    if (first in PathCompleteProvider.cfgPathMappings) {
      // get mappings and replace them
      return Array<string>()
        .concat(PathCompleteProvider.cfgPathMappings[first])
        .map((prefix) => {
          words[0] = PathCompleteProvider.expandPath(prefix, document)
          return Uri.file(words.join('/'))
        })
    } else {
      if (first.includes(':') && first.length === 2) {
        // windows disk descriptor
        return [Uri.file(words.join('/'))]
      }
      // relative wsp or untitled:
      return [Uri.joinPath(document.uri, '..', ...words)]
    }
  }

  static getPathMappings() {
    // path mappings
    const expandPaths: Record<string, string | string[]> = {
      '~': '~',
      '': '${workspaceFolder}',
      '@': '${workspaceFolder}/src',
      '${workspaceFolder}': '${workspaceFolder}',
    }
    const cfgExpandPaths = workspace.getConfiguration(
      'mvext.pathComplete.expandPaths',
    )
    for (const key of Object.keys(cfgExpandPaths)) {
      if (typeof cfgExpandPaths[key] !== 'function') {
        expandPaths[key] = cfgExpandPaths[key]
      }
    }
    return expandPaths
  }

  static expandPath(val: string, document: TextDocument): string {
    if (val.startsWith('~/') || val.startsWith('~\\')) {
      return homedir() + val.slice(1)
    } else if (val.startsWith('${workspaceFolder}')) {
      const wspFolder =
        workspace.getWorkspaceFolder(document.uri)?.uri.fsPath ?? ''
      return wspFolder + val.slice(18)
    }
    return val
  }

  static register(ctx: ExtensionContext) {
    PathCompleteProvider.cfgPathMappings =
      PathCompleteProvider.getPathMappings()
    ctx.subscriptions.push(
      languages.registerCompletionItemProvider(
        { pattern: '**' },
        new PathCompleteProvider(),
        '\\',
        '/',
      ),
      workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('mvext.pathComplete.expandPaths')) {
          PathCompleteProvider.cfgPathMappings =
            PathCompleteProvider.getPathMappings()
        }
      }),
    )
  }
  //#endregion
}
