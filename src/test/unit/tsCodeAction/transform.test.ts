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
} from '@/tsCodeAction/transform'
import assert from 'assert/strict'
import { fileURLToPath } from 'url'
import { Language, Parser } from 'web-tree-sitter'

before(async function () {
  await Parser.init()
  this.parser = new Parser().setLanguage(
    await Language.load(
      fileURLToPath(
        import.meta.resolve(
          '@vscode/tree-sitter-wasm/wasm/tree-sitter-javascript.wasm',
        ),
      ),
    ),
  )
})

describe(templateToConcat.name, function () {
  const beforeCode = {
    expr: '`abc${a + 3}cde`',
  }
  const afterCode = {
    expr: `'abc' + (a + 3) + 'cde'`,
  }
  for (const [key, value] of Object.entries(beforeCode)) {
    it('should handle ' + key, function () {
      const tree = (this.parser as Parser).parse(value)!
      const node = tree.rootNode.firstNamedChild!.firstNamedChild!
      assert.equal(templateToConcat(node), afterCode[key as 'expr'])
    })
  }
})

describe(concatToTemplate.name, function () {
  const beforeCode = {
    expr: "'abc' + (a + 3) + 'c' + `${a}de`",
  }
  const afterCode = {
    expr: '`abc${(a + 3)}c${a}de`',
  }
  for (const [key, value] of Object.entries(beforeCode)) {
    it('should handle ' + key, function () {
      const tree = (this.parser as Parser).parse(value)!
      const node = tree.rootNode.firstNamedChild!.firstNamedChild!
      assert.equal(concatToTemplate(node), afterCode[key as 'expr'])
    })
  }
})

describe(binaryToIf.name, function () {
  const beforeCode = {
    and: `(expr) && ((a++), (a = 1))`,
    or: `expr || (a = 3)`,
  }
  const afterCode = {
    and: `if ((expr)) {
a++;a = 1
}`,
    or: `if (!(expr)) {
a = 3
}`,
  }
  for (const [key, value] of Object.entries(beforeCode)) {
    it('should handle ' + key, function () {
      const tree = (this.parser as Parser).parse(value)!
      const node = tree.rootNode.firstNamedChild!.firstNamedChild!
      assert.equal(binaryToIf(node), afterCode[key as 'and'])
    })
  }
})

describe(ifToBinary.name, function () {
  const beforeCode = {
    and: `if (expr) {
    a++
    a = 1
  }`,
    or: `if (!expr) a = 3`,
  }
  const afterCode = {
    and: `(expr) && ((a++), (a = 1))`,
    or: `expr || (a = 3)`,
  }
  for (const [key, value] of Object.entries(beforeCode)) {
    it('should handle ' + key, function () {
      const tree = (this.parser as Parser).parse(value)!
      const node = tree.rootNode.firstNamedChild!
      assert.equal(ifToBinary(node), afterCode[key as 'and'])
    })
  }
})

describe(ifToTernary.name, function () {
  const beforeCode = {
    expr: `if (expr1) {
  expr11
  3
} else if (a > 3) {
  console.log('hello')
} else {
  4
}`,
  }
  const afterCode = {
    expr: `(expr1) ? (expr11, 3) : (a > 3) ? (console.log('hello')) : (4)`,
  }
  for (const [key, value] of Object.entries(beforeCode)) {
    it('should handle ' + key, function () {
      const tree = (this.parser as Parser).parse(value)!
      const node = tree.rootNode.firstNamedChild!
      assert.equal(ifToTernary(node), afterCode[key as 'expr'])
    })
  }
})

describe(ifToSwitch.name, function () {
  const beforeCode = {
    expr: `if (a && b) {
  a++
} else if (3 > 5) {
  b = 3
} else {
  console.log('abc')
}`,
    dec: `if (a) {
  const a = 3
} else {
  function abc() {}
}`,
  }
  const afterCode = {
    expr: `switch (true) {
case (a && b): a++;break
case (3 > 5): b = 3;break
default: console.log('abc');break
}`,
    dec: `switch (true) {
case (a): {const a = 3;break}
default: {function abc() {};break}
}`,
  }
  for (const [key, value] of Object.entries(beforeCode)) {
    it('should handle ' + key, function () {
      const tree = (this.parser as Parser).parse(value)!
      const node = tree.rootNode.firstNamedChild!
      assert.equal(ifToSwitch(node), afterCode[key as 'expr'])
    })
  }
})

describe(ifToSwitchLeft.name, function () {
  const beforeCode = {
    expr: `if (a == 3) {
  a++
} else if (a === 4) {
  b = 3
} else {
  console.log('abc')
}`,
  }
  const afterCode = {
    expr: `switch (a) {
case 3: a++;break
case 4: b = 3;break
default: console.log('abc');break
}`,
  }
  for (const [key, value] of Object.entries(beforeCode)) {
    it('should handle ' + key, function () {
      const tree = (this.parser as Parser).parse(value)!
      const node = tree.rootNode.firstNamedChild!
      assert.equal(ifToSwitchLeft(node), afterCode[key as 'expr'])
    })
  }
})

describe(ternaryToIf.name, function () {
  const beforeCode = {
    expr: `expr1 ? (v1 = 2) : expr2 ? (console.log('hello'), v2) : v3`,
  }
  const afterCode = {
    expr: `if (expr1) {
v1 = 2
} else if (expr2) {
console.log('hello');v2
} else {
v3
}`,
  }
  for (const [key, value] of Object.entries(beforeCode)) {
    it('should handle ' + key, function () {
      const tree = (this.parser as Parser).parse(value)!
      const node = tree.rootNode.firstNamedChild!.firstNamedChild!
      assert.equal(ternaryToIf(node), afterCode[key as 'expr'])
    })
  }
})

describe(ternaryToSwitch.name, function () {
  const beforeCode = {
    expr: `a ? a++ : 2 > 3 ? (b = 3) : console.log('hello')`,
  }
  const afterCode = {
    expr: `switch (true) {
case a: a++;break
case 2 > 3: (b = 3);break
default: console.log('hello');break
}`,
  }
  for (const [key, value] of Object.entries(beforeCode)) {
    it('should handle ' + key, function () {
      const tree = (this.parser as Parser).parse(value)!
      const node = tree.rootNode.firstNamedChild!.firstNamedChild!
      assert.equal(ternaryToSwitch(node), afterCode[key as 'expr'])
    })
  }
})

describe(ternaryToSwitchLeft.name, function () {
  const beforeCode = {
    expr: `a == 3 ? a++ : a === 4 ? (b = 3) : console.log('hello')`,
  }
  const afterCode = {
    expr: `switch (a) {
case 3: a++;break
case 4: (b = 3);break
default: console.log('hello');break
}`,
  }
  for (const [key, value] of Object.entries(beforeCode)) {
    it('should handle ' + key, function () {
      const tree = (this.parser as Parser).parse(value)!
      const node = tree.rootNode.firstNamedChild!.firstNamedChild!
      assert.equal(ternaryToSwitchLeft(node), afterCode[key as 'expr'])
    })
  }
})

describe(whileToDoWhile.name, function () {
  const beforeCode = {
    expr: `while (a + 3 > 3) {
  console.log('hello')
}`,
  }
  const afterCode = {
    expr: `do {
  console.log('hello')
} while (a + 3 > 3)`,
  }
  for (const [key, value] of Object.entries(beforeCode)) {
    it('should handle ' + key, function () {
      const tree = (this.parser as Parser).parse(value)!
      const node = tree.rootNode.firstNamedChild!
      assert.equal(whileToDoWhile(node), afterCode[key as 'expr'])
    })
  }
})

describe(doWhileToWhile.name, function () {
  const beforeCode = {
    expr: `do {
  console.log('hello')
} while (a + 3 > 3)`,
  }
  const afterCode = {
    expr: `while (a + 3 > 3) {
  console.log('hello')
}`,
  }
  for (const [key, value] of Object.entries(beforeCode)) {
    it('should handle ' + key, function () {
      const tree = (this.parser as Parser).parse(value)!
      const node = tree.rootNode.firstNamedChild!
      assert.equal(doWhileToWhile(node), afterCode[key as 'expr'])
    })
  }
})

describe(swapTernary.name, function () {
  const beforeCode = {
    expr: `a + 3 ? 3 + 3 : a + b`,
  }
  const afterCode = {
    expr: `a + 3 ? a + b : 3 + 3`,
  }
  for (const [key, value] of Object.entries(beforeCode)) {
    it('should handle ' + key, function () {
      const tree = (this.parser as Parser).parse(value)!
      const node = tree.rootNode.firstNamedChild!.firstNamedChild!
      assert.equal(swapTernary(node), afterCode[key as 'expr'])
    })
  }
})

describe(arrowToFunctionExpression.name, function () {
  const beforeCode = {
    dec: `async (a, b = 3) => {
  const msg = 'hello ' + b
  return msg + a
}`,
    expr: `({ a }, [b]) => ((a.b + c.d), (3 + 4 === 5))`,
  }
  const afterCode = {
    dec: `async function (a, b = 3) {
  const msg = 'hello ' + b
  return msg + a
}`,
    expr: `function ({ a }, [b]) {
a.b + c.d;return 3 + 4 === 5
}`,
  }
  for (const [key, value] of Object.entries(beforeCode)) {
    it('should handle ' + key, function () {
      const tree = (this.parser as Parser).parse(value)!
      const node = tree.rootNode.firstNamedChild!.firstNamedChild!
      assert.equal(arrowToFunctionExpression(node), afterCode[key as 'expr'])
    })
  }
})

describe(arrowToFunction.name, function () {
  const beforeCode = {
    dec: `const hello = async (a, b = 3) => {
  const msg = 'hello ' + b
  return msg + a
}`,
    expr: `const hello = ({ a }, [b]) => ((a.b + c.d), (3 + 4 === 5))`,
  }
  const afterCode = {
    dec: `async function hello(a, b = 3) {
  const msg = 'hello ' + b
  return msg + a
}`,
    expr: `function hello({ a }, [b]) {
a.b + c.d;return 3 + 4 === 5
}`,
  }
  for (const [key, value] of Object.entries(beforeCode)) {
    it('should handle ' + key, function () {
      const tree = (this.parser as Parser).parse(value)!
      const node = tree.rootNode.firstNamedChild!
      assert.equal(arrowToFunction(node), afterCode[key as 'expr'])
    })
  }
})

describe(functionExpressionToArrow.name, function () {
  const items = [
    {
      name: 'dec',
      before: `async function (a, b = 3) {
  const msg = 'hello ' + b
  return msg + a
}`,
      after: `async (a, b = 3) => {
  const msg = 'hello ' + b
  return msg + a
}`,
    },
    {
      name: 'expr',
      before: `async function ({ a }, [b]) {
  console.log('hello')
  a.b += 3
  return a.b + c.d
}`,
      after: `async ({ a }, [b]) => ((console.log('hello')), (a.b += 3), (a.b + c.d))`,
    },
  ]
  for (const { name, before, after } of items) {
    it('should handle ' + name, function () {
      const tree = (this.parser as Parser).parse(before)!
      const node = tree.rootNode.firstNamedChild!.firstNamedChild!
      assert.equal(functionExpressionToArrow(node), after)
    })
  }
})

describe(functionToArrow.name, function () {
  const items = [
    {
      name: 'dec',
      before: `async function hello(a, b = 3) {
  const msg = 'hello ' + b
  return msg + a
}`,
      after: `const hello = async (a, b = 3) => {
  const msg = 'hello ' + b
  return msg + a
}`,
    },
    {
      name: 'expr',
      before: `async function hello({ a }, [b]) {
  console.log('hello')
  a.b += 3
  return a.b + c.d
}`,
      after: `const hello = async ({ a }, [b]) => ((console.log('hello')), (a.b += 3), (a.b + c.d))`,
    },
  ]
  for (const { name, before, after } of items) {
    it('should handle ' + name, function () {
      const tree = (this.parser as Parser).parse(before)!
      const node = tree.rootNode.firstNamedChild!
      assert.equal(functionToArrow(node), after)
    })
  }
})

describe(splitDeclaration.name, function () {
  const items = [
    {
      name: 'dec',
      before: `var ac,
  b = 3`,
      after: `var ac
var b = 3`,
    },
  ]
  for (const { name, before, after } of items) {
    it('should handle ' + name, function () {
      const tree = (this.parser as Parser).parse(before)!
      const node = tree.rootNode.firstNamedChild!
      assert.equal(splitDeclaration(node), after)
    })
  }
})
