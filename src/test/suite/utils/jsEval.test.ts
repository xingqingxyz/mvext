import strict from 'assert/strict'
import { describe, it } from 'mocha'
import { cjsEval, mjsEval } from '../../../utils/jsEval'
import { homedir } from 'os'

export const homedirJson = JSON.stringify(homedir())

describe('when handle esm exports', function () {
  describe(`#${mjsEval.name}()`, function () {
    const mjsCode = `
import { homedir } from 'os'
function main() {
  if (homedir() !== ${homedirJson}) {
    throw Error('Unexpected homedir')
  }
  return {
    hello: 'world',
    num: 42
  }
}`

    it('should not rejects', async function () {
      await strict.doesNotReject(mjsEval(mjsCode))
    })

    it('should returns object', async function () {
      strict.deepEqual(await mjsEval(mjsCode), { hello: 'world', num: 42 })
    })
  })
})

describe('when handle `main` entry', function () {
  const jsCode = `
const { homedir } = await import('os')
if (homedir() !== ${homedirJson}) {
  throw Error('Unexpected homedir')
}
const hello = 'main'
function main() {
  return {
    hello,
    num: 1024,
  }
}`

  describe(`#${mjsEval.name}()`, function () {
    it('should not rejects', async function () {
      await strict.doesNotReject(mjsEval(jsCode))
    })

    it('should returns object', async function () {
      strict.deepEqual(await mjsEval(jsCode), {
        hello: 'main',
        num: 1024,
      })
    })
  })

  describe(`#${cjsEval.name}()`, function () {
    it('should not rejects', async function () {
      await strict.doesNotReject(cjsEval(jsCode))
    })

    it('should returns object', async function () {
      strict.deepEqual(await cjsEval(jsCode), { hello: 'main', num: 1024 })
    })
  })
})

describe('when commonjs require', function () {
  describe(`#${cjsEval.name}()`, function () {
    const cjsCode = `
const { homedir } = require('os')
if (homedir() !== ${homedirJson}) {
  throw Error('Unexpected homedir')
}
;({ hello: 'world', num: 42 })`

    it('should not rejects', async function () {
      await strict.doesNotReject(cjsEval(cjsCode))
    })

    it('should returns object', async function () {
      strict.deepEqual(await cjsEval(cjsCode), { hello: 'world', num: 42 })
    })
  })
})
