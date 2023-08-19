import fs from 'fs/promises'
import path from 'path'
import vscode from 'vscode'
import { execOpen } from './utils/commandManager'

export function registerQuicklySwitchFile(ctx: vscode.ExtensionContext) {
  ctx.subscriptions.push(
    vscode.commands.registerCommand(
      'mvext.quicklySwitchFile',
      quicklySwitchFile,
    ),
    vscode.commands.registerCommand(
      'mvext.quicklySwitchTestFile',
      quicklySwitchTestFile,
    ),
  )
}

export async function quicklySwitchFile() {
  const document = vscode.window.activeTextEditor?.document

  if (!document) {
    return
  }

  if (document.uri.scheme === 'file') {
    let uriPath: string

    try {
      switch (document.languageId) {
        case 'typescript': {
          // js file
          uriPath = document.fileName.replace(/ts$/, 'js')

          await fs
            .access(uriPath)
            .catch(() => {
              // out/ dir
              uriPath = uriPath.replace(/\bsrc\b/, 'out')
              return fs.access(uriPath)
            })
            .catch(() => {
              // dist/ dir
              uriPath = uriPath.replace(/\bout\b/, 'dist')
              return fs.access(uriPath)
            })
          break
        }
        case 'javascript':
        case 'css':
          uriPath = document.fileName.replace(/\.\w+$/, '.html')

          await fs.access(uriPath).catch(() => {
            // ext .htm
            uriPath = uriPath.slice(0, -1)
            return fs.access(uriPath)
          })
          break
        case 'html':
          uriPath = document.fileName.replace(/\.\w+$/, '.css')

          await fs.access(uriPath).catch(() => {
            uriPath = uriPath.replace(/css$/, 'js')
            return fs.access(uriPath)
          })
          break
        default:
          return
      }
      await execOpen(vscode.Uri.file(uriPath))
    } catch {
      return
    }
  } else {
    let uri: vscode.Uri

    switch (document.languageId) {
      case 'typescript':
        uri = document.uri.with({
          path: '/__tests__' + document.uri.path.replace(/ts$/, 'test.ts'),
        })
        break
      case 'javascript':
      case 'css':
        uri = document.uri.with({
          path: document.uri.path.replace(/\.\w+$/, '.html'),
        })
        break
      case 'html':
        uri = document.uri.with({
          path: document.uri.path.replace(/\.\w+$/, '.css'),
        })
        break
      default:
        return
    }

    await execOpen(uri)
  }
}

export async function quicklySwitchTestFile() {
  const documentUri = vscode.window.activeTextEditor?.document.uri

  if (!documentUri) {
    return
  }

  const ext = path.extname(documentUri.path)
  let uriPath: string
  let fileBase: string

  if (documentUri.scheme === 'file') {
    uriPath = documentUri.fsPath

    fileBase = path.basename(uriPath, ext)

    try {
      if (path.dirname(uriPath) === '__tests__') {
        await fs.access(
          path.resolve(
            uriPath,
            '../..',
            fileBase.slice(0, fileBase.length - 5 - ext.length),
          ),
        )
      } else {
        uriPath = path.resolve(
          uriPath,
          '../__tests__',
          fileBase + '.test' + ext,
        )
        await fs.access(uriPath).catch(() => {
          uriPath = uriPath.replace('.test' + ext, '.spec' + ext)
          return fs.access(uriPath)
        })
      }

      await execOpen(vscode.Uri.file(uriPath))
    } catch {
      /* empty */
    }
    return
  }

  uriPath = documentUri.path
  fileBase = path.basename(uriPath, ext)
  try {
    if (path.dirname(uriPath) === '__tests__') {
      await execOpen(
        documentUri.with({
          path: path.resolve(
            uriPath,
            '../..',
            fileBase.slice(0, fileBase.length - 5 - ext.length) + ext,
          ),
        }),
      )
    }

    await execOpen(
      documentUri.with({
        path: path.resolve(
          uriPath,
          '../__tests__',
          path.basename(uriPath, ext) + '.test' + ext,
        ),
      }),
    ).catch(() => {
      return execOpen(
        documentUri.with({
          path: path.resolve(
            uriPath,
            '../__tests__',
            path.basename(uriPath, ext),
            +'.spec' + ext,
          ),
        }),
      )
    })
  } catch {
    /* empty */
  }
}
