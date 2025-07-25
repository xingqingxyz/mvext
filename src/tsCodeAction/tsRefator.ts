import { nodeToRange, positionToPoint } from '@/util/tsParser'
import { fileURLToPath } from 'url'
import {
  CodeActionKind,
  CodeActionTriggerKind,
  CompletionItemKind,
  SnippetTextEdit,
  WorkspaceEdit,
  type CancellationToken,
  type CodeAction,
  type CodeActionContext,
  type CodeActionProvider,
  type Command,
  type ProviderResult,
  type Range,
  type Selection,
  type SnippetString,
  type TextDocument,
  type Uri,
} from 'vscode'
import { Language, Node, Parser, type Tree } from 'web-tree-sitter'
import {
  arrowToFunction,
  arrowToFunctionExpression,
  binaryToIf,
  concatToTemplate,
  doWhileToWhile,
  functionExpressionToArrow,
  functionToArrow,
  ifToBinary,
  ifToSwitch,
  ifToSwitchLeft,
  ifToTernary,
  splitDeclaration,
  swapTernary,
  templateToConcat,
  ternaryToIf,
  ternaryToSwitch,
  ternaryToSwitchLeft,
  whileToDoWhile,
} from './transform'
import { callWrap, cast } from './transform.snippets'

interface CodeActionData extends CodeAction {
  data: {
    kind: CompletionItemKind
    uri: Uri
    node: Node
    callback: (root: Node) => string | SnippetString | undefined
  }
}

export class TSRefactor implements CodeActionProvider {
  private static parser: Parser
  private tree: Tree
  static async init() {
    await Parser.init()
    this.parser = new Parser()
    const JavaScript = await Language.load(
      fileURLToPath(
        import.meta.resolve(
          '@vscode/tree-sitter-wasm/wasm/tree-sitter-javascript.wasm',
        ),
      ),
    )
    this.parser.setLanguage(JavaScript)
  }
  constructor(content: string) {
    this.tree = TSRefactor.parser.parse(content)!
  }
  getDescendantPath(descendant: Node) {
    const nodePath = []
    let node
    node = this.tree.rootNode
    do {
      nodePath.push(node)
    } while ((node = node.childWithDescendant(descendant)))
    return nodePath
  }
  getOrderedTypePath(nodePath: Node[]) {
    const grammerIds: number[] = []
    const newPath = []
    for (let i = nodePath.length - 1; i >= 0; i--) {
      if (!grammerIds.includes(nodePath[i].grammarId)) {
        grammerIds.push(nodePath[i].grammarId)
        newPath.push(nodePath[i])
      }
    }
    return newPath
  }
  getActions(node: Node, uri: Uri) {
    const descendantPath = this.getDescendantPath(node)
    const orderedTypePath = this.getOrderedTypePath(descendantPath)
    const actions: [typeof ifToBinary, Node][] = []
    const snippetsActions: [typeof cast, Node][] = []
    for (const node of orderedTypePath) {
      switch (node.grammarType) {
        case 'arrow_function':
          actions.push([arrowToFunctionExpression, node])
          break
        case 'if_statement':
          actions.push(
            [ifToSwitchLeft, node],
            [ifToSwitch, node],
            [ifToTernary, node],
            [ifToBinary, node],
          )
          break
        case 'binary_expression':
          actions.push([binaryToIf, node], [concatToTemplate, node])
          break
        case 'ternary_expression':
          actions.push(
            [ternaryToSwitchLeft, node],
            [ternaryToSwitch, node],
            [ternaryToIf, node],
            [swapTernary, node],
          )
          break
        case 'template_string':
          actions.push([templateToConcat, node])
          break
        case 'while_statement':
          actions.push([whileToDoWhile, node])
          break
        case 'do_statement':
          actions.push([doWhileToWhile, node])
          break
        case 'lexical_declaration':
        case 'variable_declaration':
          actions.push([arrowToFunction, node], [splitDeclaration, node])
          break
        case 'function_expression':
          actions.push([functionExpressionToArrow, node])
          break
        case 'function_declaration':
          actions.push([functionToArrow, node])
          break
      }
      if (node.grammarType.includes('expression')) {
        snippetsActions.push([cast, node], [callWrap, node])
      }
    }
    return actions
      .map(
        ([callback, node]) =>
          ({
            title: callback.name,
            kind: CodeActionKind.Refactor,
            data: { kind: CompletionItemKind.Text, uri, node, callback },
          }) as CodeAction,
      )
      .concat(
        snippetsActions.map(
          ([callback, node]) =>
            ({
              title: callback.name,
              kind: CodeActionKind.Refactor,
              data: { kind: CompletionItemKind.Snippet, uri, node, callback },
            }) as CodeAction,
        ),
      )
  }
  provideCodeActions(
    document: TextDocument,
    range: Range | Selection,
    context: CodeActionContext,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    token: CancellationToken,
  ): ProviderResult<(CodeAction | Command)[]> {
    if (
      context.triggerKind !== CodeActionTriggerKind.Invoke ||
      (context.only !== undefined && context.only !== CodeActionKind.Refactor)
    ) {
      return
    }
    return this.getActions(
      this.tree.rootNode.descendantForPosition(
        positionToPoint(range.start),
        positionToPoint(range.end),
      )!,
      document.uri,
    )
  }
  resolveCodeAction(
    codeAction: CodeAction,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    token: CancellationToken,
  ): ProviderResult<CodeAction> {
    const { data } = codeAction as CodeActionData
    const newText = data.callback(data.node)
    if (!newText) {
      return
    }
    codeAction.edit = new WorkspaceEdit()
    if (data.kind === CompletionItemKind.Snippet) {
      codeAction.edit.set(data.uri, [
        new SnippetTextEdit(nodeToRange(data.node), newText as SnippetString),
      ])
    } else {
      codeAction.edit.replace(
        data.uri,
        nodeToRange(data.node),
        newText as string,
      )
    }
    return codeAction
  }
}
