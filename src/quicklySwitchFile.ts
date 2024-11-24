import path from 'path'
import { window } from 'vscode'

export async function quicklySwitchFile() {
  const uri = window.activeTextEditor?.document.uri
  if (!uri) {
    return
  }
  const uriPath = uri.path
  let ext = path.extname(uriPath)
  switch (ext) {
    case '.html':
      ext = '.css'
      break
    case '.css':
      ext = '.html'
      break
    case '.js':
      ext = '.html'
      break
    case '.ts':
      ext = '.js'
      break
    default:
      return
  }
  try {
    await window.showTextDocument(
      uri.with({ path: uriPath.slice(0, -ext.length) + ext }),
    )
  } catch {}
}
