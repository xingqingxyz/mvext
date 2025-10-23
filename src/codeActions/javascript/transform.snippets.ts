import { SnippetString } from 'vscode'
import type { Node } from 'web-tree-sitter'

export function cast(root: Node) {
  return new SnippetString()
    .appendText(`(${root.text} as `)
    .appendPlaceholder('unknown', 0)
    .appendText(')')
}

export function callWrap(root: Node) {
  return new SnippetString().appendTabstop(0).appendText(`(${root.text})`)
}
