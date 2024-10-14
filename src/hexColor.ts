import {
  Color,
  ColorInformation,
  ColorPresentation,
  commands,
  languages,
  Range,
  type CancellationToken,
  type Disposable,
  type DocumentColorProvider,
  type ProviderResult,
  type TextDocument,
} from 'vscode'
import { getExtContext, WspStatKey } from './context'

function hexToColor(hex: string): Color {
  const step = hex.length > 5 ? 2 : 1
  const data: number[] = []
  for (let i = 1; i < hex.length; i += step) {
    data.push(parseInt(hex.slice(i, i + step).padEnd(2, hex[i]), 16) / 0xff)
  }
  if (data.length === 3) {
    data.push(1)
  }
  return new Color(...(data as ConstructorParameters<typeof Color>))
}

function colorToHex(color: Color): string {
  const f = (v: number) =>
    Math.round(v * 0xff)
      .toString(16)
      .padStart(2, '0')
  let hex = '#' + f(color.red) + f(color.green) + f(color.blue)
  if (color.alpha < 1) {
    hex += f(color.alpha)
  }
  return hex
}

export class HexColorProvider implements DocumentColorProvider, Disposable {
  static readonly reColor = /#(?:[\da-f]{8}|[\da-f]{6}|[\da-f]{3,4})/gi
  static readonly providers = new Map<string, HexColorProvider>()
  static _disposables: Disposable[] = [
    commands.registerTextEditorCommand('mvext.hexColor.toggleLanguage', (e) =>
      HexColorProvider.toggleHexColorLanguage(e.document.languageId),
    ),
    this,
  ]
  static dispose() {
    getExtContext().workspaceState.update(
      WspStatKey[WspStatKey.hexColorEnabled],
      this.providers.keys,
    )
    for (const provider of this.providers.values()) {
      provider.dispose()
    }
  }
  static getOnce?() {
    getExtContext()
      .workspaceState.get<string[]>(WspStatKey[WspStatKey.hexColorEnabled])
      ?.forEach((languageId) => this.toggleHexColorLanguage(languageId))
    delete this.getOnce
    return this
  }
  private _disposables: Disposable[]
  constructor(private languageId: string) {
    this._disposables = [languages.registerColorProvider([languageId], this)]
  }
  dispose() {
    for (const d of this._disposables) {
      d.dispose()
    }
  }
  provideDocumentColors(
    document: TextDocument,
    token: CancellationToken,
  ): ProviderResult<ColorInformation[]> {
    const text = document.getText()
    const colors: ColorInformation[] = []
    for (const matches of text.matchAll(HexColorProvider.reColor)) {
      const s = matches.index
      const e = s + matches[0].length
      const range = new Range(document.positionAt(s), document.positionAt(e))
      colors.push(new ColorInformation(range, hexToColor(matches[0])))
    }
    return colors
  }
  provideColorPresentations(
    color: Color,
    context: { readonly document: TextDocument; readonly range: Range },
    token: CancellationToken,
  ): ProviderResult<ColorPresentation[]> {
    return [new ColorPresentation(colorToHex(color))]
  }
  static toggleHexColorLanguage(languageId: string) {
    if (this.providers.has(languageId)) {
      this.providers.get(languageId)!.dispose()
      this.providers.delete(languageId)
    } else {
      this.providers.set(languageId, new this(languageId))
    }
  }
}
