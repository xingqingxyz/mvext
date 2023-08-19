const cfgExtends = [
  'eslint:recommended',
  'plugin:@typescript-eslint/strict-type-checked',
]
if (process.env.NODE_ENV === 'stage') {
  cfgExtends.push('plugin:@typescript-eslint/stylistic-type-checked')
}

/** @type {import('eslint').ESLint.ConfigData} */
module.exports = {
  root: true,
  ignorePatterns: ['/out/'],
  env: {
    es2019: true,
    node: true,
    commonjs: true,
  },
  plugins: ['@typescript-eslint'],
  extends: cfgExtends,
  parserOptions: {
    project: true,
  },
  rules: {
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-namespace': 'off',
  },
  overrides: [
    {
      files: ['*.js', '*.mjs'],
      extends: ['plugin:@typescript-eslint/disable-type-checked'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
}
