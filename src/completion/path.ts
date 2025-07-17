import { homedir } from 'os'
import path from 'path'
import {
  CompletionItemKind,
  CompletionTriggerKind,
  FileType,
  Position,
  Uri,
  languages,
  workspace,
  type CancellationToken,
  type CompletionContext,
  type CompletionItem,
  type CompletionItemProvider,
  type ExtensionContext,
  type TextDocument,
} from 'vscode'
import { getExtConfig } from '../config'
import { isWin32, noop, setTimeoutPm } from '../util'

export class PathCompleteProvider implements CompletionItemProvider {
  static readonly triggerCharacters = isWin32 ? '\\/' : '/'
  static readonly rePath = /(?:[-\w\\/.+,#$%{}[\]@!~=]|[^\x00-\xff])+/
  static readonly reEnvVar = /\$\{(\w+)\}|\$(\w+)/g
  static readonly kindMap = Object.freeze({
    [FileType.Directory]: CompletionItemKind.Folder,
    [FileType.SymbolicLink]: CompletionItemKind.Reference,
    [FileType.File]: CompletionItemKind.File,
    [FileType.Unknown]: CompletionItemKind.Value,
  })
  static expandPath(text: string, baseUri: Uri) {
    const prefixMap = getExtConfig('pathComplete.prefixMap', baseUri)
    for (const [lhs, rhs] of Object.entries(prefixMap)) {
      if (text.startsWith(lhs)) {
        text = rhs + text.slice(lhs.length)
        break
      }
    }
    if (
      text.startsWith('${workspaceFolder}') &&
      this.triggerCharacters.includes(text[18])
    ) {
      text = '.' + text.slice(18)
    }
    text = text.replace(
      this.reEnvVar,
      (_, name1, name2) => process.env[name1 ?? name2] ?? '',
    )
    if (text[0] === '~' && this.triggerCharacters.includes(text[1])) {
      text = homedir() + text.slice(1)
    }
    return path.isAbsolute(text)
      ? text
      : path.join(
          workspace.getWorkspaceFolder(baseUri)?.uri.fsPath ?? process.cwd(),
          text,
        )
  }
  constructor(context: ExtensionContext) {
    context.subscriptions.push(
      languages.registerCompletionItemProvider(
        { scheme: 'file', pattern: '**' },
        this,
        ...PathCompleteProvider.triggerCharacters.split(''),
      ),
    )
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
    const { text } = document.lineAt(position)
    let range = document.getWordRangeAtPosition(
      position,
      PathCompleteProvider.rePath,
    )
    let dirname
    if (range) {
      // note: dirname.length > 0
      dirname = text.slice(range.start.character, position.character)
      // replace possible non directory path to parent
      if (!PathCompleteProvider.triggerCharacters.includes(dirname.at(-1)!)) {
        dirname = path.dirname(dirname)
      }
      // only expand path when not absolute
      if (!PathCompleteProvider.triggerCharacters.includes(dirname[0])) {
        dirname = PathCompleteProvider.expandPath(dirname, document.uri)
      }
      const start = Math.max(
        range.start.character,
        ...[text.lastIndexOf('/', position.character) + 1].concat(
          isWin32 ? text.lastIndexOf('\\', position.character) + 1 : [],
        ),
      )
      // move left replace range
      if (start !== range.start.character) {
        range = range.with(position.with(undefined, start))
      }
    } else {
      dirname =
        workspace.getWorkspaceFolder(document.uri)?.uri.fsPath ?? process.cwd()
    }
    await setTimeoutPm(getExtConfig('pathComplete.debounceTimeMs', document))
    if (token.isCancellationRequested) {
      return
    }
    const commitCharacters = [context.triggerCharacter!]
    return await workspace.fs.readDirectory(Uri.file(dirname)).then(
      (d) =>
        d.map(
          ([name, type]) =>
            ({
              label: name,
              kind: PathCompleteProvider.kindMap[type],
              detail: path.join(dirname, name),
              range,
              commitCharacters,
            }) as CompletionItem,
        ),
      noop,
    )
  }
}
