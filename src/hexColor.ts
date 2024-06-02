import {
  Color,
  ColorInformation,
  ColorPresentation,
  Range,
  type CancellationToken,
  type DocumentColorProvider,
  type ProviderResult,
  type TextDocument,
} from 'vscode'

function hexToColor(hex: string): Color {
  const step = hex.length > 4 ? 2 : 1
  const data: number[] = []
  for (let i = 0; i < hex.length; i += step) {
    data.push(parseInt(hex.slice(i, i + step), 16) / 0xff)
  }
  if (data.length === 3) {
    data.push(1)
  }
  return new Color(...(data as ConstructorParameters<typeof Color>))
}

export class HexColorProvider implements DocumentColorProvider {
  static readonly reColor = /(?<=#)[\da-f]{8}|[\da-f]{6}|[\da-f]{3,4}/gi
  provideDocumentColors(
    document: TextDocument,
    token: CancellationToken,
  ): ProviderResult<ColorInformation[]> {
    const text = document.getText()
    const colors: ColorInformation[] = []
    for (const matches of text.matchAll(HexColorProvider.reColor)) {
      const s = matches.index - 1 // move cursor to '#'
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
    return [new ColorPresentation('hex')]
  }
}
