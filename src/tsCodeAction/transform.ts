import { javascript as $ } from '@/tsLanguage/javascript'
import type { Node } from 'web-tree-sitter'

function unpackParentheses(node: Node) {
  while (node.typeId === $.parenthesized_expression) {
    node = node.firstNamedChild!
  }
  return node
}

export function templateToConcat(root: Node) {
  return (root.namedChildren as Node[])
    .map((n) =>
      n.typeId === $.template_substitution
        ? `(${n.firstNamedChild!.text})`
        : JSON.stringify(n.text),
    )
    .join(' + ')
}

export function concatToTemplate(root: Node) {
  const concats = []
  let node
  do {
    if (root.typeId === $.binary_expression) {
      if (root.child(1)!.type !== '+') {
        return
      }
      node = root.childForFieldName('right')!
    } else {
      node = root
    }
    switch (node.typeId) {
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

function shouldIfToBinary(root: Node) {
  if (root.childForFieldName('alternative')) {
    return
  }
  const consequence = root.childForFieldName('consequence')!
  switch (consequence.typeId) {
    case $.statement_block:
      return consequence.namedChildren.every(
        (n) => n!.typeId === $.expression_statement,
      )
        ? (consequence.namedChildren as Node[])
        : undefined
    case $.expression_statement:
      return [consequence]
  }
  return
}

export function ifToBinary(root: Node) {
  const consequences = shouldIfToBinary(root)
  if (!consequences) {
    return
  }
  const consequence = consequences.map((n) => `(${n.text})`).join(', ')
  let condition, operator
  condition = unpackParentheses(root.childForFieldName('condition')!)
  if (condition.typeId === $.unary_expression) {
    condition = condition.firstNamedChild!.text
    operator = '||'
  } else {
    condition = `(${condition.text})`
    operator = '&&'
  }
  return `${condition} ${operator} ${consequences.length > 1 ? `(${consequence})` : consequence}`
}

function getIfStat(node: Node, typeId = $.if_statement) {
  const condtions = []
  let alternative
  do {
    if (node.typeId === $.else_clause) {
      // compat with ternary_expression
      node = node.firstNamedChild!
    }
    if (node.typeId === typeId) {
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

function shouldIfToTernary(stats: Node[]) {
  const statsList: Node[][] = []
  return stats.every((consequence) =>
    consequence.typeId === $.expression_statement
      ? statsList.push([consequence])
      : (consequence.namedChildren as Node[]).every(
          (n) => n.typeId === $.expression_statement,
        ) && statsList.push(consequence.namedChildren as Node[]),
  )
    ? statsList
    : undefined
}

export function ifToTernary(root: Node) {
  const stat = getIfStat(root)
  const statsList = shouldIfToTernary(
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

function ifClauseToSwitchClause(root: Node) {
  if (root.typeId === $.expression_statement) {
    return root.text + ';break'
  }
  let scoped = 0
  const code = (root.namedChildren as Node[])
    .map((n) => ((scoped |= +(n.typeId !== $.expression_statement)), n.text))
    .concat('break')
    .join(';')
  return scoped ? `{${code}}` : code
}

export function ifToSwitch(root: Node, typeId = $.if_statement) {
  const stat = getIfStat(root, typeId)
  const isClause = root.typeId === $.if_statement
  return [
    'switch (true) {',
    ...stat.condtions.map(
      ({ condition, consequence }) =>
        `case ${condition.text}: ${
          isClause
            ? ifClauseToSwitchClause(consequence)
            : `${consequence.text};break`
        }`,
    ),
    `default: ${
      isClause
        ? stat.alternative
          ? ifClauseToSwitchClause(stat.alternative)
          : 'break'
        : `${stat.alternative!.text};break`
    }\n}`,
  ].join('\n')
}

function shouldIfToSwitchLeft(stat: ReturnType<typeof getIfStat>) {
  let left: string
  return stat.condtions.every(
    ({ condition }, binary: number | Node) => (
      (binary = unpackParentheses(condition)),
      binary.typeId === $.binary_expression &&
        binary.child(1)!.type.startsWith('==') &&
        (left
          ? binary.childForFieldName('left')!.text === left
          : ((left = binary.childForFieldName('left')!.text), true))
    ),
  )
    ? left!
    : undefined
}

export function ifToSwitchLeft(root: Node, typeId = $.if_statement) {
  const stat = getIfStat(root, typeId)
  const left = shouldIfToSwitchLeft(stat)
  if (left === undefined) {
    return
  }
  const isClause = root.typeId === $.if_statement
  return [
    `switch (${left}) {`,
    ...stat.condtions.map(
      ({ condition, consequence }) =>
        `case ${unpackParentheses(condition).childForFieldName('right')!.text}: ${
          isClause
            ? ifClauseToSwitchClause(consequence)
            : `${consequence.text};break`
        }`,
    ),
    `default: ${
      isClause
        ? stat.alternative
          ? ifClauseToSwitchClause(stat.alternative)
          : 'break'
        : `${stat.alternative!.text};break`
    }\n}`,
  ].join('\n')
}

export function binaryToIf(root: Node) {
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
  consequence = unpackParentheses(root.childForFieldName('right')!)
  consequence = (
    consequence.typeId === $.sequence_expression
      ? (consequence.namedChildren as Node[])
      : [consequence]
  )
    .map((n) => unpackParentheses(n!).text)
    .join(';')
  return `if (${operator === '&&' ? condition : `!(${condition})`}) {\n${consequence}\n}`
}

export function ternaryToIf(root: Node) {
  const stat = getIfStat(root, $.ternary_expression)
  return stat.condtions
    .map(
      ({ condition, consequence }) => (
        (consequence = unpackParentheses(consequence)),
        `if (${condition.text}) {\n${(consequence.typeId ===
        $.sequence_expression
          ? (consequence.namedChildren as Node[])
          : [consequence]
        )
          .map((n) => unpackParentheses(n!).text)
          .join(';')}\n} else `
      ),
    )
    .concat(
      `{\n${(stat.alternative!.typeId === $.sequence_expression
        ? stat.alternative!.namedChildren
        : [stat.alternative!]
      )
        .map((n) => unpackParentheses(n!).text)
        .join(';')}\n}`,
    )
    .join('')
}

export function ternaryToSwitch(root: Node) {
  return ifToSwitch(root, $.ternary_expression)
}

export function ternaryToSwitchLeft(root: Node) {
  return ifToSwitchLeft(root, $.ternary_expression)
}

export function whileToDoWhile(root: Node) {
  return `do ${root.childForFieldName('body')!.text} while ${root.childForFieldName('condition')!.text}`
}

export function doWhileToWhile(root: Node) {
  return `while ${root.childForFieldName('condition')!.text} ${root.childForFieldName('body')!.text}`
}

export function swapTernary(root: Node) {
  return `${root.childForFieldName('condition')!.text} ? ${root.childForFieldName('alternative')!.text} : ${root.childForFieldName('consequence')!.text}`
}

export function swapIf(root: Node) {
  return `if ${root.childForFieldName('condition')!.text} ${root.childForFieldName('alternative')!.text} else ${root.childForFieldName('consequence')!.text}`
}

export function arrowToFunctionExpression(root: Node, name = '') {
  const asyncPrefix = root.firstChild!.typeId === $.async ? 'async ' : ''
  let body
  body = root.childForFieldName('body')!
  if (body.typeId === $.statement_block) {
    body = body.text
  } else {
    body = unpackParentheses(body)
    body =
      body.typeId === $.sequence_expression
        ? `{\n${body.namedChildren
            .map(
              (n, i, a) =>
                (i + 1 === a.length ? 'return ' : '') +
                unpackParentheses(n!).text,
            )
            .join(';')}\n}`
        : `{\nreturn ${body.text}\n}`
  }
  return `${asyncPrefix}function ${name}${
    root.childForFieldName('parameters')?.text ??
    `(${root.childForFieldName('parameter')!.text})`
  }${root.childForFieldName('return_type')?.text ?? ''} ${body}`
}

export function arrowToFunction(root: Node) {
  root = root.firstNamedChild!
  const arrowFunction = unpackParentheses(root.childForFieldName('value')!)
  if (arrowFunction.typeId !== $.arrow_function) {
    return
  }
  return arrowToFunctionExpression(
    arrowFunction,
    root.childForFieldName('name')!.text,
  )
}

function shouldJoinStatementBlock(children: Node[]) {
  let { length } = children
  switch (children[--length].typeId) {
    case $.expression_statement:
      break
    case $.return_statement:
      children[length] = children[length].firstNamedChild!
      break
    default:
      return
  }
  while (length--) {
    if (children[length].typeId !== $.expression_statement) {
      return
    }
  }
  return children
}

export function functionExpressionToArrow(root: Node) {
  const asyncPrefix = root.firstChild!.typeId === $.async ? 'async ' : ''
  const body = root.childForFieldName('body')!
  const children = shouldJoinStatementBlock(body.namedChildren as Node[])
  return `${asyncPrefix}${root.childForFieldName('parameters')!.text}${
    root.childForFieldName('return_type')?.text ?? ''
  } => ${
    children
      ? children.length > 1
        ? `((${children.map((n) => n.text).join('), (')}))`
        : children[0].text
      : body.text
  }`
}

export function functionToArrow(root: Node) {
  return `const ${root.childForFieldName('name')!.text} = ${functionExpressionToArrow(root)}`
}

export function splitDeclaration(root: Node) {
  const keyword = root.firstChild!.type
  return (root.namedChildren as Node[])
    .map((n) => `${keyword} ${n.text}`)
    .join('\n')
}
