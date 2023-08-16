const fs = require('fs/promises')
const path = require('path')

const jsCode = 'var a=0;console.log(a)'
const pwshCode = '"hello world"'
const cmdCode = 'echo "hello world"'
const bashCode = 'abc=esc && echo $abc'

// const { raw } = String
// const filename = raw`C:\Program Files\Git\cmd\git.exe`
