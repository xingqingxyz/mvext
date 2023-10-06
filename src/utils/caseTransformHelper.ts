export type WordCase =
  | 'lowerCase'
  | 'upperCase'
  | 'dotCase'
  | 'pathCase'
  | 'snakeCase'
  | 'kebabCase'
  | 'noCase'
  | 'sentenceCase'
  | 'constantCase'
  | 'pascalCase'
  | 'camelCase'
  | 'titleCase'
  | 'headerCase'

export type ComplexWordCase = Exclude<WordCase, 'lowerCase' | 'upperCase'>

/**
 * Functions join the `words` (raw`[a-zA-Z_-$][\w$]*`) array and transform to target case.
 */
export const joinCaseActions: Record<
  ComplexWordCase,
  (words: string[]) => string
> = {
  dotCase: (words) => words.join('.'),
  pathCase: (words) => words.join('/'),
  snakeCase: (words) => words.join('_'),
  kebabCase: (words) => words.join('-'),
  noCase: (words) => words.join(' '),
  sentenceCase: (words) => {
    const first = words[0]
    words[0] = first[0].toUpperCase() + first.slice(1)
    return words.join(' ')
  },
  constantCase: (words) => words.join('_').toUpperCase(),
  pascalCase: (words) =>
    words.map((w) => w[0].toUpperCase() + w.slice(1)).join(''),
  camelCase: (words) =>
    words.reduce((pv, cv) => pv + cv[0].toUpperCase() + cv.slice(1)),
  titleCase: (words) =>
    words.map((w) => w[0].toUpperCase() + w.slice(1)).join(' '),
  headerCase: (words) =>
    words.map((w) => w[0].toUpperCase() + w.slice(1)).join('-'),
}

/**
 * Only transform a sequence string belongs {@link WordCase}.
 * @param sequence sequence to be transform
 * @param targetWc transform target case
 * @returns transformed sequence
 */
export function caseTransformHelper(sequence: string, targetWc: WordCase) {
  switch (targetWc) {
    case 'lowerCase':
      return sequence.toLowerCase()
    case 'upperCase':
      return sequence.toUpperCase()
    default: {
      const reSpiltChar = /[^a-zA-Z-/_.\s]+|$/g
      const targetSegments: string[] = []

      let lastIdx = 0
      for (const { index, 0: spiltChar } of sequence.matchAll(reSpiltChar)) {
        const piece = sequence.slice(lastIdx, index)
        if (piece.length) {
          const words = getWords(piece)
          if (words) {
            targetSegments.push(joinCaseActions[targetWc](words))
          }
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
  const words = text.split(/[-/_.\s]+/)
  const res: string[] = []
  for (const word of words) {
    for (const matches of word.matchAll(reGetWords)) {
      if (matches[1]) {
        res.push(matches[1].toLowerCase(), matches[2].toLowerCase())
      } else {
        res.push(matches[0].toLowerCase())
      }
    }
  }
  return res.length ? res : null
}
