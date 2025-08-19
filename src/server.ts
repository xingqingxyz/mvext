import { type RpcMessage, TaploLsp } from '@taplo/lsp'
import fs, { globSync } from 'fs'
import { readFile, writeFile } from 'fs/promises'
import path from 'path'

let taplo: TaploLsp

process.on('message', async (d: RpcMessage) => {
  if (d.method === 'exit') {
    process.exit()
  }
  if (typeof taplo === 'undefined') {
    taplo = await TaploLsp.initialize(
      {
        cwd: process.cwd,
        envVar: (name) => process.env[name],
        envVars: () => Object.entries(process.env) as [string, string][],
        findConfigFile: (from) => {
          const fileNames = ['.taplo.toml', 'taplo.toml']
          for (const name of fileNames) {
            try {
              const fullPath = path.join(from, name)
              fs.accessSync(fullPath)
              return fullPath
            } catch {}
          }
        },
        glob: globSync,
        isAbsolute: path.isAbsolute,
        now: () => new Date(),
        readFile,
        writeFile,
        stderr: process.stderr,
        stdErrAtty: () => process.stderr.isTTY,
        stdin: process.stdin,
        stdout: process.stdout,
        urlToFilePath: (url: string) => {
          const c = decodeURIComponent(url).slice('file://'.length)
          return process.platform === 'win32' && c.startsWith('/')
            ? c.slice(1)
            : c
        },
        fetch: {
          fetch,
          Headers,
          Request,
          Response,
        },
      },
      {
        onMessage(message) {
          process.send!(message)
        },
      }
    )
  }
  taplo.send(d)
})

// These are panics from Rust.
process.on('unhandledRejection', Promise.reject)
