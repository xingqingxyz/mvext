import strict from 'assert/strict'
import { describe, it } from 'mocha'
import { evalByLangId } from '../../evalWithSelection'

describe(`#${evalByLangId.name}()`, function () {
  const cjsCode = `const { readdirSync } = require('fs')
const files = readdirSync(process.cwd())
if (
  !(files.find((v) => v === 'package.json') &&
  files.find((v) => v === 'tsconfig.json'))
) {throw Error('Not found')}
;({ hello: 'world', num: 42 })
`

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

  const pwshCode = '(ConvertFrom-Json "$(gc .\\package.json)").name'
  const cmdCode = 'chcp 65001 && echo 布达拉宫'
  const bashCode = 'abc=esc && echo $abc'

  it('should should not rejects', async function () {
    await strict.doesNotReject(() => evalByLangId(pwshCode, 'pwsh'))
    await strict.doesNotReject(() => evalByLangId(cmdCode, 'cmd'))
    await strict.doesNotReject(() => evalByLangId(bashCode, 'bash'))
  })

  it('should returns expected result', async function () {
    strict.equal(
      await evalByLangId(cjsCode, 'cjs'),
      "{ hello: 'world', num: 42 }",
    )
    strict.equal(
      await evalByLangId(mjsCode, 'mjs'),
      "{ hello: 'world', num: 42 }",
    )

    strict.equal(await evalByLangId(pwshCode, 'pwsh'), 'mvext\n')
    strict.equal(
      await evalByLangId(cmdCode, 'cmd'),
      'Active code page: 65001\n布达拉宫\n',
    )
    strict.equal(await evalByLangId(bashCode, 'bash'), 'esc\n')
  })
})
