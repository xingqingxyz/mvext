#!/usr/bin/env node
import { spawnSync } from 'child_process'
import fs from 'fs'
import { tmpdir } from 'os'

// clean
Array.from(fs.globSync('dist/*.map'), (f) => fs.unlinkSync(f))
// build
let ret = spawnSync(
  'pnpm exec concurrently "rolldown -c --environment NODE_ENV:production" "rolldown -c --environment NODE_ENV:production,PLATFORM:web"',
  { shell: true, stdio: 'inherit' },
)
if (ret.error) {
  throw ret.error
}
// proxy vsce
const packageJSON = JSON.parse(fs.readFileSync('package.json', 'utf8'))
fs.renameSync('node_modules', '_node_modules')
fs.mkdirSync('node_modules/@vue/typescript-plugin', { recursive: true })
fs.writeFileSync(
  'node_modules/@vue/typescript-plugin/index.js',
  "module.exports = require('../../../dist/vueTypeScriptPlugin.js').default",
)
fs.writeFileSync(
  'node_modules/@vue/typescript-plugin/package.json',
  JSON.stringify({
    name: '@vue/typescript-plugin',
    version: packageJSON.dependencies['@vue/typescript-plugin'].slice(1),
  }),
)
// npm workaround for vsce
if (process.platform === 'win32') {
  fs.writeFileSync(
    `${tmpdir()}\\npm.cmd`,
    `@echo off
if "%1" equ "list" (
  echo %CD%
  echo %CD%\\node_modules\\@vue\\typescript-plugin
  exit /b 0
)
pnpm %*`,
    { encoding: 'utf8' },
  )
  process.env.PATH = `${tmpdir()};${process.env.PATH}`
} else {
  fs.writeFileSync(
    `${tmpdir()}/npm`,
    `#!/bin/sh
if [ "$1" = "list" ]; then
  echo "$PWD"
  echo "$PWD/node_modules/@vue/typescript-plugin"
  exit
fi
pnpm "$@"`,
    { encoding: 'utf8', mode: 0o755 },
  )
  process.env.PATH = `${tmpdir()}:${process.env.PATH}`
}
// vsce
ret = spawnSync('vsce pack -o vue.vsix', {
  shell: true,
  stdio: 'inherit',
})
if (ret.error) {
  console.error(ret.error)
}
// restore
fs.rmSync('node_modules', { recursive: true, force: true })
fs.renameSync('_node_modules', 'node_modules')
if (ret.status) {
  process.exit(ret.status)
}
