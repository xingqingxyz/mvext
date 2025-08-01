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
  type ExtensionContext,
  type ProviderResult,
  type TextDocument,
} from 'vscode'
import { WStateKey } from './context'

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
  static readonly reColor = /#(?:[\da-f]{3,4}\b|[\da-f]{6}(?:[\da-f]{2})?\b)/gi
  static readonly providersMap = new Map<string, HexColorProvider>()
  private static context: ExtensionContext
  static init(context: ExtensionContext) {
    this.context = context
    context.subscriptions.push(
      commands.registerTextEditorCommand('mvext.hexColor.toggleLanguage', (e) =>
        this.toggleHexColorLanguage(e.document.languageId),
      ),
      this,
    )
    context.workspaceState
      .get<string[]>(WStateKey.hexColorLanguages)
      ?.forEach((languageId) => this.toggleHexColorLanguage(languageId))
  }
  static dispose() {
    this.context.workspaceState.update(
      WStateKey.hexColorLanguages,
      Array.from(this.providersMap.keys()),
    )
    for (const provider of this.providersMap.values()) {
      provider.dispose()
    }
  }
  static toggleHexColorLanguage(languageId: string) {
    if (this.providersMap.has(languageId)) {
      this.providersMap.get(languageId)!.dispose()
      this.providersMap.delete(languageId)
    } else {
      this.providersMap.set(languageId, new this(languageId))
    }
  }

  dispose: () => unknown
  constructor(language: string) {
    const provider = languages.registerColorProvider(
      [
        { scheme: 'file', language },
        { scheme: 'vscode-vfs', language },
      ],
      this,
    )
    this.dispose = provider.dispose.bind(provider)
  }
  provideDocumentColors(
    document: TextDocument,
    token: CancellationToken,
  ): ProviderResult<ColorInformation[]> {
    const colors: ColorInformation[] = []
    for (const matches of document
      .getText()
      .matchAll(HexColorProvider.reColor)) {
      if (token.isCancellationRequested) {
        return
      }
      const start = document.positionAt(matches.index)
      const range = new Range(
        start,
        start.with(undefined, start.character + matches[0].length),
      )
      colors.push(new ColorInformation(range, hexToColor(matches[0])))
    }
    return colors
  }
  provideColorPresentations(color: Color): ProviderResult<ColorPresentation[]> {
    return [new ColorPresentation(colorToHex(color))]
  }
}
