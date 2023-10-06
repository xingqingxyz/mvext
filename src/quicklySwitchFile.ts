import { window } from 'vscode'

export async function quicklySwitchFile() {
  const documentUri = window.activeTextEditor?.document.uri
  if (documentUri) {
    const segs = documentUri.fsPath.split('.')
    if (segs.length > 1) {
      const ext = segs.pop()!
      const map = {
        html: 'css',
        css: 'html',
        js: 'html',
        ts: 'js',
      }
      if (!(ext in map)) {
        return
      }
      try {
        await window.showTextDocument(
          documentUri.with({ path: segs.join('') + '.' + (map as any)[ext] }),
        )
      } catch {
        /* ignore ENOENT */
      }
    }
  }
}
