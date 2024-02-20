import os from 'os'
import path from 'path'
import {
  CancellationToken,
  CompletionContext,
  CompletionItem,
  CompletionItemKind,
  CompletionItemProvider,
  CompletionTriggerKind,
  Disposable,
  FileType,
  Position,
  ProviderResult,
  TextDocument,
  Uri,
  languages,
  workspace,
} from 'vscode'
import { getExtConfig } from './config'
import { isWin32 } from './util'
import fs = workspace.fs

export class PathCompleteProvider
  implements CompletionItemProvider, Disposable
{
  static readonly reFilePath = isWin32
    ? /(?:[-\w\\/.+,#$%{}[\]@!~=]|[^\x00-\xff])*$/
    : /(?:[-\w/.+,#$%~=]|[^\x00-\xff])*$/
  static readonly reEnvVar = isWin32 ? /\$(\w+)|\${(\w+)}/g : /\${\w+}/g
  static readonly triggerCharacters = isWin32 ? ['\\', '/'] : ['/']
  static readonly prefixMapConfigKey = 'mvext.pathComplete.prefixMap'
  private _base = ''
  dispose: () => void

  constructor() {
    const provider = languages.registerCompletionItemProvider(
      { pattern: '**' },
      this,
      ...PathCompleteProvider.triggerCharacters,
    )
    this.dispose = () => provider.dispose()
  }

  private _expandPrefixPath(
    prefix: string,
    path_: string,
    document: TextDocument,
  ) {
    const prefixMap = getExtConfig('pathComplete.prefixMap', document)
    for (const [lhs, rhs] of Object.entries(prefixMap)) {
      if (path_.startsWith(lhs)) {
        path_ = rhs + path_.slice(lhs.length)
        break
      }
      if (prefix.endsWith(lhs)) {
        path_ = rhs + path_
        break
      }
    }
    if (path_.startsWith('${workspaceFolder}')) {
      path_ = path.join(
        workspace.getWorkspaceFolder(document.uri)?.uri.fsPath ?? os.homedir(),
        path_.slice(19),
      )
    }
    path_ = path_.replace(
      PathCompleteProvider.reEnvVar,
      (keep, name) => process.env[name] ?? keep,
    )
    for (const sep of PathCompleteProvider.triggerCharacters) {
      path_ = path_.replace('~' + sep, os.homedir() + sep)
    }
    if (!PathCompleteProvider.triggerCharacters.includes(path_[0])) {
      path_ = path.join(document.fileName, '..', path_)
    }
    return path_
  }

  private static _getPrefixPath(
    document: TextDocument,
    position: Position,
  ): [prefix: string, path: string] {
    const text = document.lineAt(position).text.slice(0, position.character)
    const path_ = text.match(PathCompleteProvider.reFilePath)![0]
    return [text.slice(0, -path_.length), path_]
  }

  async provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    context: CompletionContext,
  ) {
    if (context.triggerKind !== CompletionTriggerKind.TriggerCharacter) {
      return
    }
    this._base = this._expandPrefixPath(
      ...PathCompleteProvider._getPrefixPath(document, position),
      document,
    )
    const commitCharacters = [context.triggerCharacter!]
    const items: CompletionItem[] = (
      await fs.readDirectory(Uri.file(this._base))
    ).map(([name, type]) => ({
      label: name,
      kind:
        type === FileType.Directory
          ? CompletionItemKind.Folder
          : FileType.SymbolicLink
            ? CompletionItemKind.Reference
            : CompletionItemKind.File,
      commitCharacters,
    }))
    if (context.triggerCharacter === '/') {
      // FIXME: preselect to avoid consequentially type '/'
      items.push({
        label: '..',
        kind: CompletionItemKind.Folder,
        preselect: true,
      })
    }
    return items
  }

  resolveCompletionItem(
    item: CompletionItem,
    token: CancellationToken,
  ): ProviderResult<CompletionItem> {
    item.detail = path.join(this._base, item.label as string)
    return item
  }
}

export type ABC = {
  src: 'hello' | 'world'
}
