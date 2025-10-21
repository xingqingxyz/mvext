import { getLocation, type JSONPath } from 'jsonc-parser'
import { env, window } from 'vscode'

export function concatJsonPathJs(path: JSONPath) {
  const reIdentifier = /^[a-z_$][\w$]*$/i
  return path
    .map((key) =>
      typeof key === 'string'
        ? reIdentifier.test(key)
          ? '.' + key
          : `[${JSON.stringify(key)}]`
        : `[${key}]`,
    )
    .join('')
}

export function concatJsonPathJq(path: JSONPath) {
  if (!path.length) {
    return '.'
  }
  const reIdentifier = /^[a-z_]\w*$/i
  const s = path
    .map((key) =>
      typeof key === 'string'
        ? '.' + (reIdentifier.test(key) ? key : JSON.stringify(key))
        : `[${key}]`,
    )
    .join('')
  return s.startsWith('[') ? '.' + s : s
}

export async function copyJsonPath() {
  const editor = window.activeTextEditor
  if (!editor?.document.languageId.startsWith('json')) {
    return
  }
  const { path } = getLocation(
    editor.document.getText(),
    editor.document.offsetAt(editor.selection.active),
  )
  await env.clipboard.writeText(concatJsonPathJq(path))
}
