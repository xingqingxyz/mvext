import * as vscode from 'vscode'
import { getExtConfig } from './utils/getExtConfig'
import fs = vscode.workspace.fs

export function registerPathComplete(ctx: vscode.ExtensionContext) {
  ctx.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      { pattern: '**' },
      { provideCompletionItems },
      '\\',
      '/',
    ),
  )
}

export async function provideCompletionItems(
  document: vscode.TextDocument,
  position: vscode.Position,
  token: vscode.CancellationToken,
  context: vscode.CompletionContext,
) {
  if (context.triggerKind !== vscode.CompletionTriggerKind.TriggerCharacter) {
    return
  }

  const getWords = /(java|type)script(react)?/.test(document.languageId)
    ? getWordsJs
    : /ignore|properties|dotenv/.test(document.languageId)
    ? getWordsIgnore
    : getWordsDefault

  const words = getWords(document, position)
  if (!words) {
    return
  }

  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { joinPath } = vscode.Uri
  let baseDir: vscode.Uri
  const first = words[0]
  if (!first.includes(':') || first === 'untitled:') {
    // relative wsp
    words[0] = expandPath(first)
    if (words[0] === first) {
      // no expanded
      baseDir = joinPath(document.uri, '..', ...words)
    } else {
      baseDir = joinPath(vscode.Uri.file(''), ...words)
    }
  } else if (first.length === 2 && /[a-z]/i.test(first[0])) {
    // windows disk descriptor
    baseDir = joinPath(vscode.Uri.file(''), ...words)
  } else if (first === 'file:') {
    // file urls
    baseDir = joinPath(vscode.Uri.file(''), ...words.slice(2))
  } else {
    return
  }

  const entries = await fs.readDirectory(baseDir)
  const { File, Folder } = vscode.CompletionItemKind
  const commitChars = /html|javascriptreact|typescriptreact|markdown|mdx/.test(
    document.languageId,
  )
    ? ['\\']
    : ['\\', '/']
  const compItems = entries.map(([filename, kind]) => {
    const uri = joinPath(baseDir, filename)
    const item = new vscode.CompletionItem(
      filename,
      kind === vscode.FileType.Directory ? Folder : File,
    )
    item.commitCharacters = commitChars
    item.documentation = uri.fsPath
    return item
  })
  // quick complete . and .., reduce esc keys
  compItems.push(
    new vscode.CompletionItem('.', Folder),
    new vscode.CompletionItem('..', Folder),
  )

  return compItems
}

function getWordsDefault(
  document: vscode.TextDocument,
  position: vscode.Position,
) {
  let lineText = document.lineAt(position).text
  lineText = lineText.slice(0, position.character)
  if (!/['"`]/.test(lineText)) {
    return
  }
  lineText = lineText.slice(/[^'"`\s]*$/.exec(lineText)!.index)
  return lineText.split(/[\\/]/)
}

function getWordsJs(document: vscode.TextDocument, position: vscode.Position) {
  const lineText = document.lineAt(position).text
  if (/import|require/.test(lineText)) {
    return
  }
  return getWordsDefault(document, position)
}

function getWordsIgnore(
  document: vscode.TextDocument,
  position: vscode.Position,
) {
  let lineText = document.lineAt(position).text
  lineText = lineText.slice(0, position.character)
  lineText = lineText.slice(/[^='"`\s]*$/.exec(lineText)!.index)
  return lineText.split(/[\\/]/)
}

//#region util
function expandPath(somePath: string) {
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
//#endregion
