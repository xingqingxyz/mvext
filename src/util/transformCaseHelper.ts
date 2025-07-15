export type WordCase =
  | 'camel'
  | 'constant'
  | 'dot'
  | 'header'
  | 'kebab'
  | 'lower'
  | 'normal'
  | 'pascal'
  | 'path'
  | 'sentence'
  | 'snake'
  | 'title'
  | 'upper'

type ComplexWordCase = Exclude<WordCase, 'lower' | 'upper'>

export const casesList = Object.freeze([
  'camel',
  'constant',
  'dot',
  'header',
  'kebab',
  'normal',
  'pascal',
  'path',
  'sentence',
  'snake',
  'title',
  'lower',
  'upper',
] as const)

export const caseShortMap = Object.freeze({
  camel: 'c',
  constant: 'cc',
  dot: '.',
  header: 'h',
  kebab: '-',
  normal: ' ',
  pascal: 'p',
  path: '/',
  sentence: 's',
  snake: '_',
  title: 't',
  lower: 'l',
  upper: 'u',
} as Record<WordCase, string>)

function capitalize(word: string) {
  const index = word.match(/[a-z]/)?.index
  return index !== undefined
    ? word.slice(0, index) + word[index].toUpperCase() + word.slice(index + 1)
    : word
}

function joinWords(words: string[], wc: ComplexWordCase) {
  switch (wc) {
    case 'camel':
      return words
        .map((w, i) => (i !== 0 ? w[0].toUpperCase() + w.slice(1) : w))
        .join('')
    case 'constant':
      return words.join('_').toUpperCase()
    case 'dot':
      return words.join('.')
    case 'header':
      return words.map((w) => w[0].toUpperCase() + w.slice(1)).join('-')
    case 'kebab':
      return words.join('-')
    case 'normal':
      return words.join(' ')
    case 'pascal':
      return words.map((w) => w[0].toUpperCase() + w.slice(1)).join('')
    case 'path':
      return words.join('/')
    case 'sentence':
      return capitalize(words.join(' '))
    case 'snake':
      return words.join('_')
    case 'title':
      return words.map(capitalize).join(' ')
  }
}

const reGetWords = /([A-Z]+)([A-Z][a-z]+)|[A-Z][a-z]+|[a-z]+|[A-Z]+/g
function getWord(text: string, wc: ComplexWordCase) {
  switch (wc) {
    case 'normal':
    case 'sentence':
    case 'title':
      return joinWords(text.split(/\s+/), wc)
    case 'path':
      return joinWords(text.split(/[\\/]+/), wc)
    case 'dot':
      return joinWords(text.split(/\.+/), wc)
  }
  let newText = ''
  let lastIdx = 0
  for (const { index, 0: spiltChar } of text.matchAll(/[-\\/_.\s]+|$/g)) {
    const words: string[] = []
    for (const matches of text.slice(lastIdx, index).matchAll(reGetWords)) {
      if (matches[1]) {
        words.push(matches[1].toLowerCase(), matches[2].toLowerCase())
      } else {
        words.push(matches[0].toLowerCase())
      }
    }
    newText += joinWords(words, wc) + spiltChar
    lastIdx = index + spiltChar.length
  }
  return newText
}

/**
 * Only transform a word match any {@link WordCase}.
 * @param word word to be transform
 * @param wc target case
 * @returns transformed word
 */
export function transformCaseHelper(word: string, wc: WordCase) {
  switch (wc) {
    case 'lower':
      return word.toLowerCase()
    case 'upper':
      return word.toUpperCase()
    default: {
      const words: string[] = []
      let lastIdx = 0
      for (const { index, 0: spiltChar } of word.matchAll(
        /[^a-zA-Z-\\/_.\s]+|$/g,
      )) {
        words.push(getWord(word.slice(lastIdx, index), wc), spiltChar)
        lastIdx = index + spiltChar.length
      }
      return words.join('')
    }
  }
}
