import type { TextEditor } from 'vscode'

export class EditorContext {
  findType: '' | 'f' | 'F' | 't' | 'T' = ''
  findSequence: string = ''
  sequence: string[] = []
  constructor(public editor: TextEditor) {}
  enqueueSequence(...sequence: string[]) {
    this.sequence.unshift(...sequence)
  }
}

export let editorContext: EditorContext
export function setEditorContext(context: EditorContext) {
  editorContext = context
}
