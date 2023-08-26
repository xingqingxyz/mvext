import { writeFile } from 'fs/promises'
import path from 'path'
import { Worker } from 'worker_threads'

export async function mjsEval(text: string) {
  const mjsFile = path.join(__dirname, 'eval.mjs')
  const jsCode = `import { parentPort } from 'worker_threads'
;${text}
parentPort.postMessage(await main())`

  await writeFile(mjsFile, jsCode, 'utf8')
  const worker = new Worker(mjsFile)

  return new Promise<unknown>((resolve, reject) => {
    worker.on('message', (result) => {
      resolve(result)
      void worker.terminate()
    })
    worker.on('error', reject)
  })
}

export function cjsEval(text: string) {
  const hasMainEntry = text.includes('function main(')

  const jsCode = `const { parentPort } = require('worker_threads')
void (async function () {
  ${hasMainEntry ? text : ''}
  parentPort.postMessage(${
    hasMainEntry ? 'await main()' : 'eval(' + JSON.stringify(text) + ')'
  })
})()`

  const worker = new Worker(jsCode, { eval: true })

  return new Promise<unknown>((resolve, reject) => {
    worker.on('message', (result) => {
      resolve(result)
      void worker.terminate()
    })
    worker.on('error', reject)
  })
}
