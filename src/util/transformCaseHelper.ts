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

/**
 * Functions join the `words` (raw`[a-zA-Z_-$][\w$]*`) array and transform to target case.
 */
export const joinCaseActions: Record<
  ComplexWordCase,
  (words: string[]) => string
> = {
  camel: (words) =>
    words.reduce((pv, cv) => pv + cv[0].toUpperCase() + cv.slice(1)),
  constant: (words) => words.join('_').toUpperCase(),
  dot: (words) => words.join('.'),
  header: (words) =>
    words.map((w) => w[0].toUpperCase() + w.slice(1)).join('-'),
  kebab: (words) => words.join('-'),
  normal: (words) => words.join(' '),
  pascal: (words) => words.map((w) => w[0].toUpperCase() + w.slice(1)).join(''),
  path: (words) => words.join('/'),
  sentence: (words) => (
    (words[0] = words[0][0].toUpperCase() + words[0].slice(1)), words.join(' ')
  ),
  snake: (words) => words.join('_'),
  title: (words) => words.map((w) => w[0].toUpperCase() + w.slice(1)).join(' '),
}

export const casesList = Object.keys(joinCaseActions).concat(
  'lower',
  'upper',
) as WordCase[]

/**
 * Only transform a word match any {@link WordCase}.
 * @param word word to be transform
 * @param targetWc target case
 * @returns transformed word
 */
export function transformCaseHelper(word: string, targetWc: WordCase) {
  switch (targetWc) {
    case 'lower':
      return word.toLowerCase()
    case 'upper':
      return word.toUpperCase()
    default: {
      const reSpiltChar = /[^a-zA-Z-/_.\s]+|$/g
      const targetSegments: string[] = []

      let lastIdx = 0
      for (const { index, 0: spiltChar } of word.matchAll(reSpiltChar)) {
        const piece = word.slice(lastIdx, index)
        const words = getWords(piece)
        if (words) {
          targetSegments.push(joinCaseActions[targetWc](words))
        }
        lastIdx = index! + spiltChar.length
        targetSegments.push(spiltChar)
      }

      return targetSegments.join('')
    }
  }
}

const reGetWords = /([A-Z]+)([A-Z][a-z]+)|[A-Z][a-z]+|[a-z]+|[A-Z]+/g
export function getWords(text: string) {
  const words: string[] = []
  for (const word of text.split(/[-/_.\s]+/)) {
    for (const matches of word.matchAll(reGetWords)) {
      if (matches[1]) {
        words.push(matches[1].toLowerCase(), matches[2].toLowerCase())
      } else {
        words.push(matches[0].toLowerCase())
      }
    }
  }
  return words.length ? words : null
}
