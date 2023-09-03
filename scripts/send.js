const { setTimeout } = require('timers/promises')
const { promisify } = require('util')
const { execFile } = require('child_process')
const execFilePm = promisify(execFile)

void (async function () {
  for (let i = 0; i < 40; i++) {
    await setTimeout(140)
    await execFilePm('waitfor.exe', ['/si', 'NextTick'])
  }
})()
