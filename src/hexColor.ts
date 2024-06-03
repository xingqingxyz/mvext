import {
  Color,
  ColorInformation,
  ColorPresentation,
  Range,
  languages,
  type CancellationToken,
  type Disposable,
  type DocumentColorProvider,
  type ProviderResult,
  type TextDocument,
  type TextEditor,
} from 'vscode'

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
  private provider: Disposable
  constructor(private languageId: string) {
    this.provider = languages.registerColorProvider([languageId], this)
  }
  dispose() {
    HexColorProvider.providers.delete(this.languageId)
    this.provider.dispose()
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
  static toggleHexColor(editor: TextEditor) {
    const { languageId } = editor.document
    if (this.providers.has(languageId)) {
      this.providers.get(languageId)!.dispose()
      this.providers.delete(languageId)
    } else {
      this.providers.set(languageId, new this(languageId))
    }
  }
  static dispose() {
    for (const provider of this.providers.values()) {
      provider.dispose()
    }
  }
}
