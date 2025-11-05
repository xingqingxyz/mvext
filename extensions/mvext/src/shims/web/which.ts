import type { Options } from 'which'

export default function which(name: string, options: Options = {}) {
  return options.all ? [name] : name
}
