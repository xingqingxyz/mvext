import { _javascript as $ } from '@/ts/language/javascript'
import {
  getDescendantPath,
  getParsedTree,
  nodeToRange,
  positionToPoint,
} from '@/ts/parser'
import {
  CodeActionKind,
  CodeActionTriggerKind,
  CompletionItemKind,
  languages,
  SnippetString,
  SnippetTextEdit,
  TextEdit,
  WorkspaceEdit,
  type CodeAction,
  type CodeActionContext,
  type CodeActionProvider,
  type Command,
  type ExtensionContext,
  type ProviderResult,
  type Range,
  type Selection,
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

interface CodeActionWithData extends CodeAction {
  data: {
    kind: CompletionItemKind
    uri: Uri
    node: Node
    callback: (root: Node) => string | SnippetString | undefined
  }
}

function getOrderedTypePath(nodePath: Node[]) {
  const typeIds = new Set<number>()
  const newPath = []
  for (let i = nodePath.length - 1; i >= 0; i--) {
    if (!typeIds.has(nodePath[i].typeId)) {
      typeIds.add(nodePath[i].typeId)
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
  //#region api
  provideCodeActions(
    document: TextDocument,
    range: Range | Selection,
    context: CodeActionContext,
  ): ProviderResult<(CodeAction | Command)[]> {
    if (
      context.triggerKind !== CodeActionTriggerKind.Invoke ||
      !context.only?.contains(CodeActionKind.RefactorRewrite)
    ) {
      return
    }
    const tree = getParsedTree(document)
    if (!tree) {
      return
    }
    return this.getActions(
      getOrderedTypePathFromRange(tree, range),
      document.uri,
    )
  }
  resolveCodeAction(codeAction: CodeAction): ProviderResult<CodeAction> {
    const { data } = codeAction as CodeActionWithData
    const newText = data.callback(data.node)
    if (!newText) {
      return
    }
    codeAction.edit = new WorkspaceEdit()
    codeAction.edit.set(data.uri, [
      typeof newText === 'string'
        ? new TextEdit(nodeToRange(data.node), newText)
        : new SnippetTextEdit(nodeToRange(data.node), newText),
    ])
    return codeAction
  }
  //#endregion
  constructor(context: ExtensionContext) {
    context.subscriptions.push(
      languages.registerCodeActionsProvider(
        [
          'javascript',
          'typescript',
          'javascriptreact',
          'typescriptreact',
        ].flatMap((language) => [
          { language, scheme: 'file' },
          { language, scheme: 'vscode-vfs' },
          { language, scheme: 'vscode-remote' },
        ]),
        this,
      ),
    )
  }
  private getActions(orderedTypePath: Node[], uri: Uri) {
    const actions: [typeof ifToBinary | typeof cast, Node][] = []
    for (const node of orderedTypePath) {
      switch (node.type) {
        case $.arrow_function:
          actions.push([arrowToFunctionExpression, node])
          break
        case $.if_statement:
          actions.push(
            [ifToSwitchLeft, node],
            [ifToSwitch, node],
            [ifToTernary, node],
            [ifToBinary, node],
            [swapIf, node],
          )
          break
        case $.binary_expression:
          actions.push([binaryToIf, node], [concatToTemplate, node])
          break
        case $.ternary_expression:
          actions.push(
            [ternaryToSwitchLeft, node],
            [ternaryToSwitch, node],
            [ternaryToIf, node],
            [swapTernary, node],
          )
          break
        case $.template_string:
          actions.push([templateToConcat, node])
          break
        case $.while_statement:
          actions.push([whileToDoWhile, node])
          break
        case $.do_statement:
          actions.push([doWhileToWhile, node])
          break
        case $.lexical_declaration:
        case $.variable_declaration:
          actions.push([arrowToFunction, node], [splitDeclaration, node])
          break
        case $.function_expression:
          actions.push([functionExpressionToArrow, node])
          break
        case $.function_declaration:
          actions.push([functionToArrow, node])
          break
      }
      if (node.type.includes('expression')) {
        actions.push([cast, node], [callWrap, node])
      }
    }
    return actions.map(
      ([callback, node]) =>
        ({
          title: `${callback.name}(${node.type})`,
          kind: CodeActionKind.RefactorRewrite,
          data: { uri, node, callback },
        }) as CodeAction,
    )
  }
}
