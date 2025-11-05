import path from 'path'
import { startServer } from '../../node_modules/@vue/language-server/lib/server'

let tsPath
for (const arg of process.argv) {
  if (arg.startsWith('--tsdk=')) {
    tsPath = path.join(arg.slice(7), './typescript.js').replaceAll('\\', '/')
    break
  }
}
startServer(await import(tsPath ?? 'typescript'))
