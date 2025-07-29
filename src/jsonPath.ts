import { getLocation, type JSONPath } from 'jsonc-parser'
import { env, window } from 'vscode'

export function concatJsonPath(path: JSONPath) {
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
  const reIdentifier = /^[a-z_]\w*$/i
  path = path.map((key) =>
    typeof key === 'string'
      ? '.' + (reIdentifier.test(key) ? key : JSON.stringify(key))
      : `[${key}]`,
  )
  // @ts-expect-error stupid
  path[0] = '.' + (path[0] ??= '').slice(path[0].indexOf('.') + 1)
  return path.join('')
}

export async function copyJsonPath() {
  const editor = window.activeTextEditor
  if (!editor || !editor.document.languageId.startsWith('json')) {
    return
  }
  const { path } = getLocation(
    editor.document.getText(),
    editor.document.offsetAt(editor.selection.active),
  )
  await env.clipboard.writeText(concatJsonPath(path))
}
