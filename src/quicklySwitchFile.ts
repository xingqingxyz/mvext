import path from 'path'
import { window } from 'vscode'

export async function quicklySwitchFile() {
  const uri = window.activeTextEditor?.document.uri
  if (uri) {
    const uriPath = uri.path
    const ext = path.extname(uriPath)
    const map = {
      html: 'css',
      css: 'html',
      js: 'html',
      ts: 'js',
    }
    if (ext in map) {
      try {
        await window.showTextDocument(
          uri.with({ path: uriPath.slice(0, -ext.length) + (map as any)[ext] }),
        )
      } catch {}
    }
  }
}
