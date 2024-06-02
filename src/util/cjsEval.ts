import path from 'path'
import util from 'util'
import { Worker } from 'worker_threads'

export async function cjsEval(text: string, virtualFile: string) {
  const jsCode = `(async () => {
  const { __dirname, __filename } = require('node:worker_threads').workerData;
  return (${text})
})().then((r) => require('node:worker_threads').parentPort.postMessage(r))`
  const worker = new Worker(jsCode, {
    eval: true,
    workerData: {
      __dirname: path.dirname(virtualFile),
      __filename: virtualFile,
    },
  })
  return await new Promise((c, e) => worker.on('message', c).on('error', e))
    .then(formatObj)
    .finally(() => worker.terminate())
}

function formatObj(obj: unknown) {
  switch (typeof obj) {
    case 'object':
      return util.format('%o', obj)
    case 'function':
      return util.format(
        '// [function %s]:\n%s\n// [function %s entries]:\n%o',
        obj.name,
        obj,
        obj.name,
        Object.assign({}, obj),
      )
    default:
      return String(obj)
  }
}
