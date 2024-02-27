import os from 'os'
import path from 'path'
import {
  CancellationToken,
  CompletionContext,
  CompletionItemKind,
  CompletionItemProvider,
  CompletionTriggerKind,
  Disposable,
  FileType,
  Position,
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
  // reference to the Vim editor's regex '\f'
  static readonly reFilePath = isWin32
    ? /(?:[-\w\\/.+,#$%{}[\]@!~=]|[^\x00-\xff])*$/
    : /(?:[-\w/.+,#$%~=]|[^\x00-\xff])*$/
  // resolve powershell env var and bash like env var
  static readonly reEnvVar = isWin32 ? /\${Env:(\w+)}/gi : /\$(\w+)|\${(\w+)}/g
  static readonly triggerCharacters = isWin32 ? ['\\', '/'] : ['/']
  static readonly kindMap = {
    [FileType.Directory]: CompletionItemKind.Folder,
    [FileType.SymbolicLink]: CompletionItemKind.Reference,
    [FileType.File]: CompletionItemKind.File,
    [FileType.Unknown]: CompletionItemKind.Value,
  }
  static readonly prefixMapConfigKey = 'mvext.pathComplete.prefixMap'
  dispose: () => void

  constructor() {
    this.dispose = languages.registerCompletionItemProvider(
      { pattern: '**' },
      this,
      ...PathCompleteProvider.triggerCharacters,
    ).dispose
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

  async provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    context: CompletionContext,
  ) {
    if (context.triggerKind !== CompletionTriggerKind.TriggerCharacter) {
      return
    }
    const line = document.lineAt(position.line)
    const half = line.text.slice(0, position.character)
    switch (true) {
      case position.character <= line.firstNonWhitespaceCharacterIndex + 2:
      case /:\/+/.test(half):
        return
    }
    // path_ always endswith `triggerCharacters`
    const path_ = half.match(PathCompleteProvider.reFilePath)![0]
    const baseDir = this._expandPrefixPath(
      half.slice(0, -path_.length),
      path_,
      document,
    )
    const commitCharacters = [context.triggerCharacter!]
    return (await fs.readDirectory(Uri.file(baseDir))).map(([name, type]) => ({
      label: name,
      kind: PathCompleteProvider.kindMap[type],
      detail: baseDir + name,
      commitCharacters,
    }))
  }
}
