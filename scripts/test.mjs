import * as promises from 'timers/promises'
import { Chalk } from 'chalk'

function format(text) {
  return chalk.rgb(
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256),
  )(text)
}

const chalk = new Chalk()
const line = Array(80).fill(' ')
const reset = '\r'.repeat(80)
for (let i = 39; i >= 0; i--) {
  line[i] = format('/')
  line[79 - i] = format('\\')
  for (let j = 78 - i; j > i; j--) {
    line[j] = Math.random() * 100
    line[j] = line[j] < 34 ? ' ' : format(line[j] < 67 ? '*' : '#')
  }
  await promises.setTimeout(150)
  process.stdout.write(reset)
  process.stdout.write(line.join(''))
}
