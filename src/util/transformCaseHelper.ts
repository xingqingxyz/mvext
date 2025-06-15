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

export type ComplexWordCase = Exclude<WordCase, 'lower' | 'upper'>

function capitalize(word: string) {
  const index = word.match(/[a-z]/)?.index
  return index !== undefined
    ? word.slice(0, index) + word[index].toUpperCase() + word.slice(index + 1)
    : word
}

/**
 * Functions join the `words` (raw`[a-zA-Z_-$][\w$]*`) array and transform to target case.
 */
export const joinCaseActions: Record<
  ComplexWordCase,
  (words: string[]) => string
> = {
  camel: (words) =>
    words
      .map((w, i) => (i !== 0 ? w[0].toUpperCase() + w.slice(1) : w))
      .join(''),
  constant: (words) => words.join('_').toUpperCase(),
  dot: (words) => words.join('.'),
  header: (words) =>
    words.map((w) => w[0].toUpperCase() + w.slice(1)).join('-'),
  kebab: (words) => words.join('-'),
  normal: (words) => words.join(' '),
  pascal: (words) => words.map((w) => w[0].toUpperCase() + w.slice(1)).join(''),
  path: (words) => words.join('/'),
  sentence: (words) => capitalize(words.join(' ')),
  snake: (words) => words.join('_'),
  title: (words) => words.map(capitalize).join(' '),
}

export const casesList = Object.keys(joinCaseActions).concat(
  'lower',
  'upper',
) as WordCase[]

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

const reGetWords = /([A-Z]+)([A-Z][a-z]+)|[A-Z][a-z]+|[a-z]+|[A-Z]+/g
export function getWord(text: string, wc: ComplexWordCase) {
  switch (wc) {
    case 'normal':
    case 'sentence':
    case 'title':
      return joinCaseActions[wc](text.split(/\s+/))
    case 'path':
      return joinCaseActions[wc](text.split(/[\\/]+/))
    case 'dot':
      return joinCaseActions[wc](text.split(/\.+/))
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
    newText += joinCaseActions[wc](words) + spiltChar
    lastIdx = index + spiltChar.length
  }
  return newText
}
