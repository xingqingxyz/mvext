import {
  getDescendantPath,
  getParsedTree,
  nodeToRange,
  positionToPoint,
} from '@/tsParser'
import {
  CodeActionKind,
  CodeActionTriggerKind,
  CompletionItemKind,
  languages,
  SnippetTextEdit,
  WorkspaceEdit,
  type CodeAction,
  type CodeActionContext,
  type CodeActionProvider,
  type Command,
  type ExtensionContext,
  type ProviderResult,
  type Range,
  type Selection,
  type SnippetString,
  type TextDocument,
  type Uri,
} from 'vscode'
import type { Node, Tree } from 'web-tree-sitter'
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
  swapIf,
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

function getOrderedTypePath(nodePath: Node[]) {
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

function getOrderedTypePathFromRange(tree: Tree, range: Range | Selection) {
  const node = tree.rootNode.descendantForPosition(
    positionToPoint(range.start),
    positionToPoint(range.end),
  )!
  const descendantPath = getDescendantPath(tree.rootNode, node)
  return getOrderedTypePath(descendantPath)
}

export class TransformCodeActionProvider implements CodeActionProvider {
  constructor(context: ExtensionContext) {
    context.subscriptions.push(
      languages.registerCodeActionsProvider(
        ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'].map(
          (language) => ({ language, scheme: 'file' }),
        ),
        this,
      ),
    )
  }
  getActions(orderedTypePath: Node[], uri: Uri) {
    const actions: [typeof ifToBinary, Node][] = []
    const snippetsActions: [typeof cast, Node][] = []
    for (const node of orderedTypePath) {
      switch (node.type) {
        case 'arrow_function':
          actions.push([arrowToFunctionExpression, node])
          break
        case 'if_statement':
          actions.push(
            [ifToSwitchLeft, node],
            [ifToSwitch, node],
            [ifToTernary, node],
            [ifToBinary, node],
            [swapIf, node],
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
      if (node.type.includes('expression')) {
        snippetsActions.push([cast, node], [callWrap, node])
      }
    }
    return actions
      .map(
        ([callback, node]) =>
          ({
            title: `${callback.name}(${node.type})`,
            kind: CodeActionKind.RefactorRewrite,
            data: { kind: CompletionItemKind.Text, uri, node, callback },
          }) as CodeAction,
      )
      .concat(
        snippetsActions.map(
          ([callback, node]) =>
            ({
              title: `${callback.name}(${node.type})`,
              kind: CodeActionKind.RefactorRewrite,
              data: { kind: CompletionItemKind.Snippet, uri, node, callback },
            }) as CodeAction,
        ),
      )
  }
  provideCodeActions(
    document: TextDocument,
    range: Range | Selection,
    context: CodeActionContext,
  ): ProviderResult<(CodeAction | Command)[]> {
    if (
      context.triggerKind !== CodeActionTriggerKind.Invoke ||
      (context.only && !context.only.contains(CodeActionKind.RefactorRewrite))
    ) {
      return
    }
    const tree = getParsedTree(document)
    if (!tree) {
      return
    }
    const orderedTypePath = getOrderedTypePathFromRange(tree, range)
    return orderedTypePath && this.getActions(orderedTypePath, document.uri)
  }
  resolveCodeAction(codeAction: CodeAction): ProviderResult<CodeAction> {
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
