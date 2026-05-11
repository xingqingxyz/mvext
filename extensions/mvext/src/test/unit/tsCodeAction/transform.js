//#region templateToConcat
// before
;`abc${a + 3}c${a}de`
// after
;('abc' + (a + 3) + 'c' + a + 'de')
// before
`abc
fsd
fs${(a - b, console.log('hello'))}a'fs`
// after
'abc\nfsd\nfs' + (a - b, console.log('hello')) + "a'fc"
//#endregion

//#region concatToTemplate
// before
'abc' + (a + 3) + 'c' + `${a}de`
// after
;`abc${a + 3}c${a}de`
//#endregion

//#region binaryToIf
// before
expr && (a++, (a = 1))
// after
if (expr) {
  a++
  a = 1
}

// before
expr || (a = 3)
// after
if (!expr) a = 3
//#endregion

//#region ifToBinary
let a
// before
if (expr) {
  a++
  a = 1
}
// after
expr && (a++, (a = 1))

// before
if (!expr) a = 3
// after
expr || (a = 3)
//#endregion

//#region ifToTernary
// before
if (expr1) {
  expr11
  3
} else if (a > 3) {
  console.log('hello')
} else {
  4
}
// after
expr1 ? (expr11, 3) : a > 3 ? console.log('hello') : 4
//#endregion

//#region ifToSwitch
// before
if (a && b) {
  a++
} else if (3 > 5) {
  b = 3
} else {
  console.log('abc')
}
// after
switch (true) {
  case a && b:
    a++
    break
  case 3 > 5:
    b = 3
    break
  default:
    console.log('abc')
    break
}
// before
if (a) {
  const a = 3
} else {
  function abc() {}
}
// after
switch (true) {
  case a: {
    const a = 3
    break
  }
  default: {
    function abc() {}
    break
  }
}
//#endregion

//#region ifToSwitchLeft
// before
if (a == 3) {
  a++
} else if (a === 4) {
  b = 3
} else {
  console.log('abc')
}
// after
switch (a) {
  case 3:
    a++
    break
  case 4:
    b = 3
    break
  default:
    console.log('abc')
    break
}
//#endregion

//#region ternaryToIf
// before
expr1 ? (v1 = 2) : expr2 ? (console.log('hello'), v2) : v3

// after
if (expr1) {
  v1 = 2
} else if (expr2) {
  console.log('hello')
  v2
} else {
  v3
}
//#endregion

//#region ternaryToSwitch
// before
a ? a++ : 2 > 3 ? (b = 3) : console.log('hello')
// after
switch (true) {
  case a:
    a++
    break
  case 2 > 3:
    b = 3
    break
  default:
    console.log('hello')
    break
}
//#endregion

//#region ternaryToSwitchLeft
// before
a == 3 ? a++ : a === 4 ? (b = 3) : console.log('hello')
// after
switch (a) {
  case 3:
    a++
    break
  case 4:
    b = 3
    break
  default:
    console.log('hello')
    break
}
//#endregion

//#region whileToDoWhile
// before
while (a + 3 > 3) {
  console.log('hello')
}
// after
do {
  console.log('hello')
} while (a + 3 > 3)
//#endregion

//#region doWhileToWhile
// before
do {
  console.log('hello')
} while (a + 3 > 3)
// after
while (a + 3 > 3) {
  console.log('hello')
}
//#endregion

//#region arrowToFunction
// before
const hello = (a, b = 3) => {
  const msg = 'hello ' + b
  return msg + a
}
// after
function hello(a, b = 3) {
  const msg = 'hello ' + b
  return msg + a
}

// before
const hello = async ({ a }, [b]) => a.b + c.d
// after
async function hello({ a }, [b]) {
  return a.b + c.d
}
//#endregion

//#region functionToArrow
// before
function hello(a, b = 3) {
  const msg = 'hello ' + b
  return msg + a
}
// after
const hello = (a, b = 3) => {
  const msg = 'hello ' + b
  return msg + a
}

// before
async function hello({ a }, [b]) {
  console.log('hello')
  a.b += 3
  return a.b + c.d
}
// after
const hello = async ({ a }, [b]) => (
  console.log('hello'),
  (a.b += 3),
  a.b + c.d
)
//#endregion

//#region swapTernary
// before
a + 3 ? 3 + 3 : a + b
// after
a + 3 ? a + b : 3 + 3
//#endregion

//#region splitDeclaration
// before
var ac,
  b = 3
// after
var ac
var b = 3
//#endregion
