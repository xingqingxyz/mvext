import {
  CancellationToken,
  Position,
  ProviderResult,
  SignatureHelp,
  SignatureHelpContext,
  SignatureHelpProvider,
  TextDocument,
  languages,
} from 'vscode'
import { getExtContext } from './context'

class TsSignatureHelp implements SignatureHelpProvider {
  provideSignatureHelp(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    context: SignatureHelpContext,
  ): ProviderResult<SignatureHelp> {
    return {
      activeParameter: 0,
      activeSignature: 0,
      signatures: [
        { label: 'test', parameters: [{ label: 'test' }], documentation: '' },
      ],
    }
  }
}

export function register() {
  getExtContext().subscriptions.push(
    languages.registerSignatureHelpProvider(
      { language: 'typescript' },
      new TsSignatureHelp(),
      '(',
      ',',
      '<',
    ),
  )
}
