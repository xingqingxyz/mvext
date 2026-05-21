import { _javascript as $ } from '@/components/treeSitter/language/javascript'
import { SnippetString } from 'vscode'
import type { Node } from 'web-tree-sitter'

export class Transform {
  private static unpackParentheses(node: Node) {
    while (node.type === $.parenthesized_expression) {
      node = node.firstNamedChild!
    }
    return node
  }
  static templateToConcat(root: Node) {
    return `'${(root.namedChildren as Node[])
      .map((n) => {
        switch (n.type) {
          case $.template_substitution:
            return `' + (${n.firstNamedChild!.text}) + '`
          case $.string_fragment:
            return n.text.replaceAll("'", "\\'")
          case $.escape_sequence:
            return n.text
        }
      })
      .join('')}'`
  }
  static concatToTemplate(root: Node) {
    const concats = []
    let node
    do {
      if (root.type === $.binary_expression) {
        if (root.child(1)!.type !== '+') {
          return
        }
        node = root.childForFieldName('right')!
      } else {
        node = root
      }
      switch (node.type) {
        case $.string:
        case $.template_string:
          concats.push(node.text.slice(1, -1))
          break
        default:
          concats.push(`\${${node.text}}`)
          break
      }
    } while ((root = root.childForFieldName('left')!))
    return `\`${concats.reverse().join('')}\``
  }
  private static shouldIfToBinary(root: Node) {
    if (root.childForFieldName('alternative')) {
      return
    }
    const consequence = root.childForFieldName('consequence')!
    switch (consequence.type) {
      case $.statement_block:
        return consequence.namedChildren.every(
          (n) => n!.type === $.expression_statement,
        )
          ? (consequence.namedChildren as Node[])
          : undefined
      case $.expression_statement:
        return [consequence]
    }
    return
  }
  static ifToBinary(root: Node) {
    const consequences = this.shouldIfToBinary(root)
    if (!consequences) {
      return
    }
    const consequence = consequences.map((n) => `(${n.text})`).join(', ')
    let condition, operator
    condition = this.unpackParentheses(root.childForFieldName('condition')!)
    if (condition.type === $.unary_expression) {
      condition = condition.firstNamedChild!.text
      operator = '||'
    } else {
      condition = `(${condition.text})`
      operator = '&&'
    }
    return `${condition} ${operator} ${consequences.length > 1 ? `(${consequence})` : consequence}`
  }
  private static getIfStat(node: Node, type = $.if_statement) {
    const condtions = []
    let alternative
    do {
      if (node.type === $.else_clause) {
        // compat with ternary_expression
        node = node.firstNamedChild!
      }
      if (node.type === type) {
        condtions.push({
          node,
          condition: node.childForFieldName('condition')!,
          consequence: node.childForFieldName('consequence')!,
        })
      } else {
        alternative = node
        break
      }
    } while ((node = node.childForFieldName('alternative')!))
    return {
      condtions,
      alternative,
    }
  }
  private static shouldIfToTernary(stats: Node[]) {
    const statsList: Node[][] = []
    return stats.every((consequence) =>
      consequence.type === $.expression_statement
        ? statsList.push([consequence])
        : (consequence.namedChildren as Node[]).every(
            (n) => n.type === $.expression_statement,
          ) && statsList.push(consequence.namedChildren as Node[]),
    )
      ? statsList
      : undefined
  }
  static ifToTernary(root: Node) {
    const stat = this.getIfStat(root)
    const statsList = this.shouldIfToTernary(
      stat.condtions.map((c) => c.consequence).concat(stat.alternative || []),
    )
    return (
      statsList &&
      stat.condtions
        .map(
          (c, i) =>
            `${c.condition.text} ? (${statsList[i].map((n) => n.text).join(', ')}) : `,
        )
        .concat(
          stat.alternative
            ? `(${statsList[stat.condtions.length].map((n) => n.text).join(', ')})`
            : 'undefined',
        )
        .join('')
    )
  }
  private static ifClauseToSwitchClause(root: Node) {
    if (root.type === $.expression_statement) {
      return root.text + ';break'
    }
    let scoped = 0
    const code = (root.namedChildren as Node[])
      .map((n) => ((scoped |= +(n.type !== $.expression_statement)), n.text))
      .concat('break')
      .join(';')
    return scoped ? `{${code}}` : code
  }
  static ifToSwitch(root: Node, type = $.if_statement) {
    const stat = this.getIfStat(root, type)
    const isClause = root.type === $.if_statement
    return [
      'switch (true) {',
      ...stat.condtions.map(
        ({ condition, consequence }) =>
          `case ${condition.text}: ${
            isClause
              ? this.ifClauseToSwitchClause(consequence)
              : `${consequence.text};break`
          }`,
      ),
      `default: ${
        isClause
          ? stat.alternative
            ? this.ifClauseToSwitchClause(stat.alternative)
            : 'break'
          : `${stat.alternative!.text};break`
      }\n}`,
    ].join('\n')
  }
  private static shouldIfToSwitchLeft(stat: ReturnType<typeof this.getIfStat>) {
    let left: string
    return stat.condtions.every(
      ({ condition }, binary: number | Node) => (
        (binary = this.unpackParentheses(condition)),
        binary.type === $.binary_expression &&
          binary.child(1)!.type.startsWith('==') &&
          (left
            ? binary.childForFieldName('left')!.text === left
            : ((left = binary.childForFieldName('left')!.text), true))
      ),
    )
      ? left!
      : undefined
  }
  static ifToSwitchLeft(root: Node, type = $.if_statement) {
    const stat = this.getIfStat(root, type)
    const left = this.shouldIfToSwitchLeft(stat)
    if (left === undefined) {
      return
    }
    const isClause = root.type === $.if_statement
    return [
      `switch (${left}) {`,
      ...stat.condtions.map(
        ({ condition, consequence }) =>
          `case ${this.unpackParentheses(condition).childForFieldName('right')!.text}: ${
            isClause
              ? this.ifClauseToSwitchClause(consequence)
              : `${consequence.text};break`
          }`,
      ),
      `default: ${
        isClause
          ? stat.alternative
            ? this.ifClauseToSwitchClause(stat.alternative)
            : 'break'
          : `${stat.alternative!.text};break`
      }\n}`,
    ].join('\n')
  }
  static binaryToIf(root: Node) {
    const operator = root.child(1)!.type
    switch (operator) {
      case '&&':
      case '||':
        break
      default:
        return
    }
    const condition = root.childForFieldName('left')!.text
    let consequence
    consequence = this.unpackParentheses(root.childForFieldName('right')!)
    consequence = (
      consequence.type === $.sequence_expression
        ? (consequence.namedChildren as Node[])
        : [consequence]
    )
      .map((n) => this.unpackParentheses(n!).text)
      .join(';')
    return `if (${operator === '&&' ? condition : `!(${condition})`}) {\n${consequence}\n}`
  }
  static ternaryToIf(root: Node) {
    const stat = this.getIfStat(root, $.ternary_expression)
    return stat.condtions
      .map(
        ({ condition, consequence }) => (
          (consequence = this.unpackParentheses(consequence)),
          `if (${condition.text}) {\n${(consequence.type ===
          $.sequence_expression
            ? (consequence.namedChildren as Node[])
            : [consequence]
          )
            .map((n) => this.unpackParentheses(n!).text)
            .join(';')}\n} else `
        ),
      )
      .concat(
        `{\n${(stat.alternative!.type === $.sequence_expression
          ? stat.alternative!.namedChildren
          : [stat.alternative!]
        )
          .map((n) => this.unpackParentheses(n!).text)
          .join(';')}\n}`,
      )
      .join('')
  }
  static ternaryToSwitch(root: Node) {
    return this.ifToSwitch(root, $.ternary_expression)
  }
  static ternaryToSwitchLeft(root: Node) {
    return this.ifToSwitchLeft(root, $.ternary_expression)
  }
  static whileToDoWhile(root: Node) {
    return `do ${root.childForFieldName('body')!.text} while ${root.childForFieldName('condition')!.text}`
  }
  static doWhileToWhile(root: Node) {
    return `while ${root.childForFieldName('condition')!.text} ${root.childForFieldName('body')!.text}`
  }
  static swapTernary(root: Node) {
    return `${root.childForFieldName('condition')!.text} ? ${root.childForFieldName('alternative')!.text} : ${root.childForFieldName('consequence')!.text}`
  }
  static swapIf(root: Node) {
    return `if ${root.childForFieldName('condition')!.text} ${root.childForFieldName('alternative')!.text} else ${root.childForFieldName('consequence')!.text}`
  }
  static arrowToFunctionExpression(root: Node, name = '') {
    const asyncPrefix = root.firstChild!.type === $.async ? 'async ' : ''
    let body
    body = root.childForFieldName('body')!
    if (body.type === $.statement_block) {
      body = body.text
    } else {
      body = this.unpackParentheses(body)
      body =
        body.type === $.sequence_expression
          ? `{\n${body.namedChildren
              .map(
                (n, i, a) =>
                  (i + 1 === a.length ? 'return ' : '') +
                  this.unpackParentheses(n!).text,
              )
              .join(';')}\n}`
          : `{\nreturn ${body.text}\n}`
    }
    return [
      asyncPrefix,
      'private static    ',
      name,
      root.childForFieldName('type_parameters')?.text,
      root.childForFieldName('parameters')?.text ??
        `(${root.childForFieldName('parameter')!.text})`,
      root.childForFieldName('return_type')?.text,
      ' ' + body,
    ].join('')
  }
  static arrowToFunction(root: Node) {
    root = root.firstNamedChild!
    const arrowFunction = this.unpackParentheses(
      root.childForFieldName('value')!,
    )
    if (arrowFunction.type !== $.arrow_function) {
      return
    }
    return this.arrowToFunctionExpression(
      arrowFunction,
      root.childForFieldName('name')!.text,
    )
  }
  private static shouldJoinStatementBlock(children: Node[]) {
    let { length } = children
    switch (children[--length].type) {
      case $.expression_statement:
        break
      case $.return_statement:
        children[length] = children[length].firstNamedChild!
        break
      default:
        return
    }
    while (length--) {
      if (children[length].type !== $.expression_statement) {
        return
      }
    }
    return children
  }
  static functionExpressionToArrow(root: Node) {
    const asyncPrefix = root.firstChild!.type === $.async ? 'async ' : ''
    const body = root.childForFieldName('body')!
    const children = this.shouldJoinStatementBlock(body.namedChildren as Node[])
    return `${asyncPrefix}${root.childForFieldName('type_parameters')?.text ?? ''}${root.childForFieldName('parameters')!.text}${root.childForFieldName('return_type')?.text ?? ''} => ${
      children
        ? children.length > 1
          ? `((${children.map((n) => n.text).join('), (')}))`
          : children[0].text
        : body.text
    }`
  }
  static functionToArrow(root: Node) {
    return `const ${root.childForFieldName('name')!.text} = ${this.functionExpressionToArrow(root)}`
  }
  static splitDeclaration(root: Node) {
    const keyword = root.firstChild!.type
    return (root.namedChildren as Node[])
      .map((n) => `${keyword} ${n.text}`)
      .join('\n')
  }
  static cast(root: Node) {
    return new SnippetString()
      .appendText(`(${root.text} as `)
      .appendPlaceholder('unknown', 0)
      .appendText(')')
  }
  static callWrap(root: Node) {
    return new SnippetString().appendTabstop(0).appendText(`(${root.text})`)
  }
}
