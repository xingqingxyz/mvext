import { client } from '@/client'
import {
  commands,
  env,
  window,
  type ExtensionContext,
  type QuickPickItem,
} from 'vscode'
import { showMessage } from './logger'

async function copyAsJson() {
  const { document, selection } = window.activeTextEditor!
  if (!document || selection.isEmpty) {
    return
  }
  const selectedText = document.getText(selection)
  if (!selectedText.trim().length) {
    return
  }
  const res = await client.sendRequest<{ text?: string; error?: string }>(
    'taplo/convertToJson',
    {
      text: selectedText,
    }
  )
  if (res.error?.length ?? 0 !== 0) {
    client.outputChannel.appendLine(
      `Failed to convert TOML to JSON: ${res.error}`
    )
    await showMessage('error', 'Copying has failed!')
    return
  }
  try {
    if (!res.text) {
      client.outputChannel.appendLine(
        `The response shouldn't be empty, but it is.`
      )
      await showMessage('error', 'Copying has failed!')
      return
    }
    await env.clipboard.writeText(res.text)
  } catch (e) {
    client.outputChannel.appendLine(`Couldn't write to clipboard: ${e}`)
    await showMessage('error', 'Copying has failed!')
    return
  }
  await window.showInformationMessage('JSON copied!')
}
async function copyAsToml() {
  const { document, selection } = window.activeTextEditor!
  if (!document || selection.isEmpty) {
    return
  }
  const selectedText = document.getText(selection)
  if (!selectedText.trim().length) {
    return
  }
  const res = await client.sendRequest<{ text?: string; error?: string }>(
    'taplo/convertToToml',
    {
      text: selectedText,
    }
  )
  if (res.error?.length ?? 0 !== 0) {
    client.outputChannel.appendLine(
      `Failed to convert JSON to TOML: ${res.error}`
    )
    const show = await window.showErrorMessage(
      'Copying has failed!',
      'Show Details'
    )
    if (show) {
      client.outputChannel.show()
    }
    return
  }
  try {
    if (!res.text) {
      client.outputChannel.appendLine(
        `The response shouldn't be empty, but it is.`
      )
      const show = await window.showErrorMessage(
        'Copying has failed!',
        'Show Details'
      )
      if (show) {
        client.outputChannel.show()
      }
      return
    }
    await env.clipboard.writeText(res.text)
  } catch (e) {
    client.outputChannel.appendLine(`Couldn't write to clipboard: ${e}`)
    const show = await window.showErrorMessage(
      'Copying has failed!',
      'Show Details'
    )
    if (show) {
      client.outputChannel.show()
    }
    return
  }
  await window.showInformationMessage('TOML copied!')
}
async function pasteAsJson() {
  const editor = window.activeTextEditor!
  let input: string
  try {
    input = await env.clipboard.readText()
  } catch (e) {
    client.outputChannel.appendLine(`Failed to read from clipboard:${e}`)
    const show = await window.showErrorMessage(
      'Paste from clipboard has failed!',
      'Show Details'
    )
    if (show) {
      client.outputChannel.show()
    }
    return
  }
  const res = await client.sendRequest<{ text?: string; error?: string }>(
    'taplo/convertToJson',
    {
      text: input,
    }
  )
  if (res.error?.length ?? 0 !== 0) {
    client.outputChannel.appendLine(`Failed to convert to JSON: ${res.error}`)
    const show = await window.showErrorMessage(
      'Pasting JSON has failed!',
      'Show Details'
    )
    if (show) {
      client.outputChannel.show()
    }
    return
  }
  await editor.edit((e) => {
    e.replace(editor.selection, res.text!)
  })
}
async function pasteAsToml() {
  const editor = window.activeTextEditor!
  let input: string
  try {
    input = await env.clipboard.readText()
  } catch (e) {
    client.outputChannel.appendLine(`Failed to read from clipboard:${e}`)
    const show = await window.showErrorMessage(
      'Paste from clipboard has failed!',
      'Show Details'
    )
    if (show) {
      client.outputChannel.show()
    }
    return
  }
  const res = await client.sendRequest<{ text?: string; error?: string }>(
    'taplo/convertToToml',
    {
      text: input,
    }
  )
  if (res.error?.length ?? 0 !== 0) {
    client.outputChannel.appendLine(`Failed to convert to TOML: ${res.error}`)
    const show = await window.showErrorMessage(
      'Paste from clipboard has failed!',
      'Show Details'
    )
    if (show) {
      client.outputChannel.show()
    }
    return
  }
  await editor.edit((e) => {
    e.replace(editor.selection, res.text!)
  })
}

interface SchemaItem extends QuickPickItem {
  url: string
  meta?: Record<string, any>
}

async function selectSchema() {
  const { document } = window.activeTextEditor!
  const documentUri = document.uri.toString()
  const schemasResp: { schemas: { url: string; meta?: any }[] } =
    await client.sendRequest('taplo/listSchemas', {
      documentUri,
    })
  const selectedSchema: { schema?: { url: string } } = await client.sendRequest(
    'taplo/associatedSchema',
    {
      documentUri,
    }
  )
  const selection = await window.showQuickPick<SchemaItem>(
    schemasResp.schemas.map((s) => ({
      label: s.meta?.name ?? s.url,
      description: schemaDescription(s.meta),
      detail: schemaDetails(s.url, s.meta),
      picked: selectedSchema.schema?.url === s.url,
      url: s.url,
      meta: s.meta,
    }))
  )
  if (!selection) {
    return
  }
  await client.sendNotification('taplo/associateSchema', {
    documentUri,
    schemaUri: selection.url,
    rule: {
      url: documentUri,
    },
    meta: selection.meta,
  })
}

function schemaDescription(meta: any | undefined): string | undefined {
  if (typeof meta?.description === 'string') {
    return meta.description
  } else {
    return undefined
  }
}

function schemaDetails(url: string, _meta: any): string {
  let s = `${url}`
  return s
}

export function registerCommands(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand('toml.copyAsJson', copyAsJson),
    commands.registerCommand('toml.copyAsToml', copyAsToml),
    commands.registerCommand('toml.pasteAsJson', pasteAsJson),
    commands.registerCommand('toml.pasteAsToml', pasteAsToml),
    commands.registerCommand('toml.selectSchema', selectSchema)
  )
}
