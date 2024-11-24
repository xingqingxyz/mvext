import path from 'path'
import { window } from 'vscode'

export async function quicklySwitchFile() {
  const uri = window.activeTextEditor?.document.uri
  if (!uri) {
    return
  }
  let uriPath = uri.path
  const ext = path.extname(uriPath)
  uriPath = uriPath.slice(0, -ext.length)
  switch (ext) {
    case '.html':
      uriPath += '.css'
      break
    case '.css':
      uriPath += '.html'
      break
    case '.js':
      uriPath += '.html'
      break
    case '.ts':
      uriPath += '.js'
      break
    default:
      return
  }
  try {
    await window.showTextDocument(uri.with({ path: uriPath }))
  } catch {}
}
