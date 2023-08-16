const strict = require('assert/strict')

function foo() {
  throw new Error('Hello World')
}

async function asyncFoo() {
  await new Promise((resolve, reject) => {
    setTimeout(() => {
      throw new Error('Hello World')
    }, 1000)
  })
}

strict.throws(foo)
strict.throws(foo, { message: /Hello World/ })

console.log(strict)
strict.rejects(asyncFoo)
strict.rejects(asyncFoo, { message: /Hello World/ })
