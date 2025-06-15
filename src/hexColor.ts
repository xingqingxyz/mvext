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
import { extContext, WStateKey } from './context'

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
  static readonly providersMap = new Map<string, HexColorProvider>()
  static _disposables: Disposable[] = [
    commands.registerTextEditorCommand('mvext.hexColor.toggleLanguage', (e) =>
      this.toggleHexColorLanguage(e.document.languageId),
    ),
  ]
  static dispose() {
    extContext.workspaceState.update(
      WStateKey.hexColorLanguages,
      this.providersMap.keys,
    )
    for (const provider of this.providersMap.values()) {
      provider.dispose()
    }
    for (const disposable of this._disposables) {
      disposable.dispose()
    }
  }
  static finallyInit?() {
    extContext.workspaceState
      .get<string[]>(WStateKey.hexColorLanguages)
      ?.forEach((languageId) => this.toggleHexColorLanguage(languageId))
    delete this.finallyInit
    return this
  }
  static toggleHexColorLanguage(languageId: string) {
    if (this.providersMap.has(languageId)) {
      this.providersMap.get(languageId)!.dispose()
      this.providersMap.delete(languageId)
    } else {
      this.providersMap.set(languageId, new this(languageId))
    }
  }

  dispose: () => void
  constructor(languageId: string) {
    const provider = languages.registerColorProvider([languageId], this)
    this.dispose = provider.dispose.bind(provider)
  }
  provideDocumentColors(
    document: TextDocument,
    token: CancellationToken,
  ): ProviderResult<ColorInformation[]> {
    const text = document.getText()
    const colors: ColorInformation[] = []
    for (const matches of text.matchAll(HexColorProvider.reColor)) {
      if (token.isCancellationRequested) {
        return
      }
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
}
