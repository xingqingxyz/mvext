/**
 * generate VSCode builtin commands dts file
 */

import { loadBuffer } from 'cheerio'
import { readFileSync } from 'fs'

interface CommandArg {
  name: string
  desc: string
  optional: boolean
  type?: string
  default?: string
}

interface Command {
  name: string
  desc: string
  args?: CommandArg[]
  returns?: string
}

const apiUrl = 'https://code.visualstudio.com/api/references/commands'
const builtinCommands = []

const $ = loadBuffer(readFileSync('builtinCommands.html'))

;('')

/**
 * <p>{desc}</p>
 * <ul>
 *  <li><em>{argName}</em>{argDesc}</li>
 * <ul>
 * */
const elements = $('#main-content > div > div > main > #commands ~ *').not(
  '#simple-commands, #simple-commands ~ *',
)

function formatDefalutValue(value?: string) {
  if (value === undefined) {
    return
  }
  if (value === 'true' || value === 'false' || /\d+/.test(value)) {
    return value
  }
  return `'${value}'`
}
