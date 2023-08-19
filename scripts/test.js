const path = require('path')

const { format } = require('util')

// const { Blob } = require('buffer')
const { Worker } = require('worker_threads')

// const jsCode = `const { parentPort } = require('worker_threads')
// const { readdirSync } = require('fs')

// function main() {
//   const files = readdirSync(process.cwd())
//   if (
//     !(
//       files.find((v) => v === 'package.json') &&
//       files.find((v) => v === 'tsconfig.json')
//     )
//   ) {
//     throw Error('Not found')
//   }
//   return {
//     hello: 'world',
//     num: 42,
//   }
// }
// main()`

// parentPort.postMessage(main())
// main().then(data=>parentPort.postMessage(data))`

// const objUrl = URL.createObjectURL(new Blob([jsCode]))
const worker = new Worker(path.resolve(__dirname, './eval.mjs'))

// void(async function () {
//   const result = await new Promise((resolve, reject) => {
//     worker.on('message', (result) => {
//       console.log(result)
//       resolve(result)
//       // URL.revokeObjectURL(objUrl)
//       void worker.terminate()
//     })
//     worker.on('error', reject)
//   })

//   console.log(format('fm: %o',result))
// })()

worker.on('message', (res) => {
  console.log(res)
  console.log(format('%o', res))
  void worker.terminate()
})
