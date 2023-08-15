const cfgExtends = [
  'eslint:recommend',
  '@typescript-eslint/strict-type-checked',
]
if (process.env.NODE_ENV === 'stage') {
  cfgExtends.push('@typescript-eslint/stylistic-type-checked')
}

/** @type {import('eslint').ESLint.ConfigData} */
module.exports = {
  root: true,
  ignorePatterns: ['/*', '!/src'],
  env: {
    es2021: true,
    node: true,
    commonjs: true,
  },
  plugins: ['@typescript-eslint'],
  extends: cfgExtends,
  parserOptions: {
    project: true,
  },
  rules: {
    '@typescript-eslint/non-null-assertion': 'off',
  },
}
