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
  static readonly reValidSuffix = /(\b[a-z]:)?[^'"`?*:<>|]*$/i
  static cfgPathMappings: Record<string, string>

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

    const baseDir = PathCompleteProvider.getBaseDirFromPaths(words, document)
    try {
      const entries = await workspace.fs.readDirectory(baseDir)
      return PathCompleteProvider.createCompItems(entries)
    } catch {
      /* no need handle ENOENT */
    }
  }

  //#region util
  static createCompItems(entries: [string, FileType][]) {
    const { File, Folder } = CompletionItemKind
    const { Directory } = FileType
    const commitChars = ['\\', '/']
    const compItems = entries.map(([filename, kind]) => {
      const item = new CompletionItem(
        filename,
        kind === Directory ? Folder : File,
      )
      item.commitCharacters = commitChars
      return item
    })
    // quick complete . and .., reduce esc keys
    compItems.push(
      new CompletionItem('.', Folder),
      new CompletionItem('..', Folder),
    )

    return compItems
  }

  static getSubPaths(document: TextDocument, position: Position) {
    let prefix = document.lineAt(position).text.slice(0, position.character)
    if (!prefix) {
      return ['']
    }

    if (LangIds.langIdRawFile.includes(document.languageId)) {
      prefix = prefix.split('=').at(-1)!
    } else {
      if (
        LangIds.langIdJsOrJsx.includes(document.languageId) &&
        /import|require/.test(prefix)
      ) {
        return
      }
      if (!/['"`]/.test(prefix)) {
        return
      }
    }
    // get sub paths like 'abc/cde'
    prefix = prefix.slice(
      PathCompleteProvider.reValidSuffix.exec(prefix)!.index,
    )

    return prefix.split(/[\\/]/)
  }

  static getBaseDirFromPaths(words: string[], document: TextDocument) {
    const first = words[0]
    if (
      !first.includes(':') &&
      PathCompleteProvider.expandPath(first) === first
    ) {
      // relative wsp or untitled:
      return Uri.joinPath(document.uri, '..', ...words)
    }
    // windows disk descriptor
    return Uri.joinPath(Uri.file(''), ...words)
  }

  static expandPath(somePath: string) {
    const { cfgPathMappings } = PathCompleteProvider
    if (!somePath) {
      return cfgPathMappings['${workspaceFolder}']
    }
    // prevent multi replace, no meaning and lets errors
    for (const key of Object.keys(cfgPathMappings)) {
      if (somePath.startsWith(key)) {
        return somePath.replace(key, cfgPathMappings[key])
      }
    }
    return somePath
  }

  static register(ctx: ExtensionContext) {
    PathCompleteProvider.cfgPathMappings = getPathMappings()
    ctx.subscriptions.push(
      languages.registerCompletionItemProvider(
        { pattern: '**' },
        new PathCompleteProvider(),
        '\\',
        '/',
      ),
      workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('mvext.pathComplete.expandPaths')) {
          PathCompleteProvider.cfgPathMappings = getPathMappings()
        }
      }),
    )
  }
  //#endregion
}

function getPathMappings() {
  // path mappings
  const wspFolder = workspace.workspaceFolders?.[0].uri.fsPath ?? '/'
  const expandPaths: Record<string, string> = {
    '~': homedir(),
    '@': wspFolder + '/src',
    '${workspaceFolder}': wspFolder,
  }
  const cfgExpandPaths: Record<string, string> = workspace.getConfiguration(
    'mvext.pathComplete.expandPaths',
  )

  for (const key of Reflect.ownKeys(cfgExpandPaths) as string[]) {
    let val = cfgExpandPaths[key]
    if (typeof val !== 'string') {
      continue
    }
    if (val[0] === '~') {
      val = val.replace('~', homedir())
    } else {
      val = val.replace('${workspaceFolder}', wspFolder)
    }
    expandPaths[key] = val
  }

  return expandPaths
}
