import { execFile } from 'child_process'
import { format, promisify } from 'util'

export const execFilePm = promisify(execFile)

export function kebabToPascal(word: string) {
  return word
    .split('-')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('')
}

export function noop(): undefined {}

export function formatDate(date: Date) {
  return format(
    '%d-%s-%s %s:%s:%s.%s',
    date.getFullYear(),
    (date.getMonth() + 1).toString().padStart(2, '0'),
    date.getDate().toString().padStart(2, '0'),
    date.getHours().toString().padStart(2, '0'),
    date.getMinutes().toString().padStart(2, '0'),
    date.getSeconds().toString().padStart(2, '0'),
    date.getMilliseconds().toString().padStart(3, '0'),
  )
}
