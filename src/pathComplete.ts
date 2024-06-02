import { homedir } from 'os'
import { join as pathJoin } from 'path'
import {
  CompletionItemKind,
  CompletionTriggerKind,
  FileType,
  Uri,
  languages,
  workspace,
  type CancellationToken,
  type CompletionContext,
  type CompletionItemProvider,
  type Disposable,
  type Position,
  type TextDocument,
} from 'vscode'
import { getExtConfig } from './config'
import { isWin32 } from './util'

export class PathCompleteProvider
  implements CompletionItemProvider, Disposable
{
  // reference to the Vim editor's regex '\f'
  static readonly reFilePath = isWin32
    ? /(?:[-\w\\/.+,#$%{}[\]@!~=:]|[^\x00-\xff])*$/
    : /(?:[-\w/.+,#$%~=:]|[^\x00-\xff])*$/
  // resolve powershell env var and bash like env var
  static readonly reEnvVar = isWin32 ? /\${Env:(\w+)}/gi : /\$(\w+)/g
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
    path: string,
    document: TextDocument,
  ) {
    const prefixMap = getExtConfig('pathComplete.prefixMap', document)
    for (const [lhs, rhs] of Object.entries(prefixMap)) {
      if (path.startsWith(lhs)) {
        path = rhs + path.slice(lhs.length)
        break
      }
      if (prefix.endsWith(lhs)) {
        path = rhs + path
        break
      }
    }
    if (path.startsWith('${workspaceFolder}')) {
      path = pathJoin(
        workspace.getWorkspaceFolder(document.uri)?.uri.fsPath ?? homedir(),
        path.slice(19),
      )
    }
    path = path.replace(
      PathCompleteProvider.reEnvVar,
      (keep, name) => process.env[name] ?? keep,
    )
    for (const sep of PathCompleteProvider.triggerCharacters) {
      path = path.replace('~' + sep, homedir() + sep)
    }
    if (!PathCompleteProvider.triggerCharacters.includes(path[0])) {
      path = pathJoin(document.fileName, '..', path)
    }
    return path
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
      case /[\\/]{2,}/.test(half):
        return
    }
    // path_ always endswith `triggerCharacters`
    const path = half.match(PathCompleteProvider.reFilePath)![0]
    const baseDir = this._expandPrefixPath(
      half.slice(0, -path.length),
      path,
      document,
    )
    const commitCharacters = [context.triggerCharacter!]
    return (await workspace.fs.readDirectory(Uri.file(baseDir))).map(
      ([name, type]) => ({
        label: name,
        kind: PathCompleteProvider.kindMap[type],
        detail: baseDir + name,
        commitCharacters,
      }),
    )
  }
}
