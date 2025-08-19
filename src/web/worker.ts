import { RpcMessage, TaploLsp } from '@taplo/lsp'
import {
  BrowserMessageReader,
  BrowserMessageWriter,
} from 'vscode-languageserver-protocol/browser'

const writer = new BrowserMessageWriter(self)
const reader = new BrowserMessageReader(self)
let taplo: TaploLsp

reader.listen(async (message) => {
  if (!taplo) {
    taplo = await TaploLsp.initialize(
      {
        cwd: () => '/',
        envVar: () => '',
        envVars: () => [],
        findConfigFile: () => undefined,
        glob: () => [],
        isAbsolute: () => true,
        now: () => new Date(),
        readFile: () => Promise.reject('not implemented'),
        writeFile: () => Promise.reject('not implemented'),
        stderr: async (bytes: Uint8Array) => {
          new TextDecoder().decode(bytes)
          return bytes.length
        },
        stdErrAtty: () => false,
        stdin: () => Promise.reject('not implemented'),
        stdout: async (bytes: Uint8Array) => {
          new TextDecoder().decode(bytes)
          return bytes.length
        },
        urlToFilePath: (url: string) => url.slice('file://'.length),
      },
      {
        onMessage(message) {
          writer.write(message)
        },
      }
    )
  }
  taplo.send(message as RpcMessage)
})
