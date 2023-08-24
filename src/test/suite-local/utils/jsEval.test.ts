import { describe, it } from 'mocha'
import { mjsEval } from '../../../utils/jsEval'
import strict from 'assert/strict'

describe(`#${mjsEval.name}()`, function () {
  const mjsCode = `import { readdirSync } from 'fs'
function main() {
  const files = readdirSync(process.cwd())
  if (
    !(files.find((v) => v === 'package.json') &&
    files.find((v) => v === 'tsconfig.json'))
  ) {throw Error('Not found')}
  return {
    hello: 'world',
    num: 42
  }
}`

  it('should not rejects and returns expected', async function () {
    strict.deepEqual(await mjsEval(mjsCode), { hello: 'world', num: 42 })
  })

  it('should returns again', async function () {
    const jsCode = `function main() {
      return {
        hello: 'again',
        num: 1024,
      }
    }`
    strict.deepEqual(await mjsEval(jsCode), {
      hello: 'again',
      num: 1024,
    })
  })
})
