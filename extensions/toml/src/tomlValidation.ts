import { extensions } from 'vscode'
import { client } from './client'

export function registerExtensionSchemas() {
  for (const ext of extensions.all) {
    const tomlValidation = ext.packageJSON?.contributes?.tomlValidation
    if (!Array.isArray(tomlValidation)) {
      continue
    }
    for (const rule of tomlValidation) {
      if (typeof rule !== 'object') {
        continue
      }
      const url = rule.url
      if (typeof url !== 'string') {
        continue
      }
      let fileMatch = rule.fileMatch
      let regexMatch = rule.regexMatch
      if (!Array.isArray(fileMatch)) {
        fileMatch = [fileMatch]
      }
      for (let m of fileMatch) {
        if (typeof m !== 'string') {
          continue
        }
        if (!m.startsWith('/')) {
          m = `/${m}`
        }
        client.sendNotification('taplo/associateSchema', {
          schemaUri: url,
          priority: 10, // above catalogs, but below any manual config
          rule: {
            glob: `**${m}`,
          },
          meta: {
            source: 'extension',
            extensionId: ext.id,
          },
        })
      }
      if (!Array.isArray(regexMatch)) {
        regexMatch = [regexMatch]
      }
      for (const m of regexMatch) {
        if (typeof m !== 'string') {
          continue
        }
        client.sendNotification('taplo/associateSchema', {
          schemaUri: url,
          priority: 10, // above catalogs, but below any manual config
          rule: {
            regex: m,
          },
          meta: {
            source: 'extension',
            extensionId: ext.id,
          },
        })
      }
    }
  }
}
