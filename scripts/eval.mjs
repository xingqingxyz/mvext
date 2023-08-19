import { parentPort } from 'worker_threads'
import { readdirSync } from 'fs'

function main() {
  const files = readdirSync(process.cwd())
  if (
    !(
      files.find((v) => v === 'package.json') &&
      files.find((v) => v === 'tsconfig.json')
    )
  ) {
    throw Error('Not found')
  }
  return {
    hello: 'world',
    num: 42,
  }
}

parentPort.postMessage(await main())
