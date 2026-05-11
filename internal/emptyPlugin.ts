import type { Plugin } from 'rolldown'

export default function empty(
  includes: string[] | ((id: string) => boolean),
): Plugin {
  if (Array.isArray(includes)) {
    const tmp = includes
    includes = (id) => tmp.includes(id)
  }
  return {
    name: 'empty',
    resolveId(id) {
      if (includes(id)) {
        return { id: '\0empty:' + id }
      }
    },
    load(id) {
      if (id.startsWith('\0empty:')) {
        return { code: 'export default {}' }
      }
    },
  }
}
