import * as vscode from 'vscode'
import { getExtConfig } from './utils/getExtConfig'
import { LangIds } from './utils/constants'
import { CompletionItem, Uri } from 'vscode'

export class PathCompleteProvider {
  static readonly reValidSuffix = /[^'"`?*:<>|\s]*$/

  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext,
  ) {
    if (context.triggerKind !== vscode.CompletionTriggerKind.TriggerCharacter) {
      return
    }

    const words = PathCompleteProvider.getSubPaths(document, position)
    if (!words) {
      return
    }

    const baseDir = PathCompleteProvider.getBaseDirFromPaths(words, document)
    if (!baseDir) {
      return
    }

    try {
      const entries = await vscode.workspace.fs.readDirectory(baseDir)
      return PathCompleteProvider.createCompItems(entries, document)
    } catch {
      /* no need handle ENOENT */
    }
  }

  //#region util
  static createCompItems(
    entries: [string, vscode.FileType][],
    document: vscode.TextDocument,
  ) {
    const { File, Folder } = vscode.CompletionItemKind
    const { Directory } = vscode.FileType
    const commitChars = LangIds.langIdMarkup.includes(document.languageId)
      ? ['\\']
      : ['\\', '/']
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

  static getSubPaths(document: vscode.TextDocument, position: vscode.Position) {
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

  static getBaseDirFromPaths(words: string[], document: vscode.TextDocument) {
    const first = words[0]
    if (!first.includes(':') || first === 'untitled:') {
      // relative wsp
      words[0] = PathCompleteProvider.expandPath(first)
      if (words[0] === first) {
        // no expanded
        return Uri.joinPath(document.uri, '..', ...words)
      } else {
        return Uri.joinPath(Uri.file(''), ...words)
      }
    } else if (first.length === 2 && /[a-z]/i.test(first[0])) {
      // windows disk descriptor
      return Uri.joinPath(Uri.file(''), ...words)
    } else if (first === 'file:') {
      // file urls
      return Uri.joinPath(Uri.file(''), ...words.slice(2))
    }
  }

  static expandPath(somePath: string) {
    const expandPaths = getExtConfig('pathComplete.expandPaths')
    // prohibit empty ''
    if (!somePath) {
      return expandPaths['${workspaceFolder}']
    }
    // prevent multi replace, no meaning and lets errors
    for (const key of Object.keys(expandPaths)) {
      if (somePath.includes(key)) {
        return somePath.replace(key, expandPaths[key])
      }
    }
    return somePath
  }

  static register(ctx: vscode.ExtensionContext) {
    ctx.subscriptions.push(
      vscode.languages.registerCompletionItemProvider(
        { pattern: '**' },
        new PathCompleteProvider(),
        '\\',
        '/',
      ),
    )
  }
  //#endregion
}
