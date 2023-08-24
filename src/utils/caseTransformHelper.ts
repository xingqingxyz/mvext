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
  dotCase: (words: string[]) => words.join('.'),
  pathCase: (words: string[]) => words.join('/'),
  snakeCase: (words: string[]) => words.join('_'),
  kebabCase: (words: string[]) => words.join('-'),
  noCase: (words: string[]) => words.join(' '),
  sentenceCase: (words: string[]) =>
    words.reduce(
      (pv, cv, ci) =>
        pv + (ci ? ' ' + cv : cv[0].toUpperCase() + cv.substring(1)),
      '',
    ),
  constantCase: (words: string[]) =>
    words.reduce((pv, cv, ci) => pv + (ci ? '_' : '') + cv.toUpperCase(), ''),
  pascalCase: (words: string[]) =>
    words.reduce((pv, cv) => pv + cv[0].toUpperCase() + cv.substring(1), ''),
  camelCase: (words: string[]) =>
    words.reduce(
      (pv, cv, ci) => pv + (ci ? cv[0].toUpperCase() + cv.substring(1) : cv),
      '',
    ),
  titleCase: (words: string[]) =>
    words.reduce(
      (pv, cv, ci) =>
        pv + (ci ? ' ' : '') + cv[0].toUpperCase() + cv.substring(1),
      '',
    ),
  headerCase: (words: string[]) =>
    words.reduce(
      (pv, cv, ci) =>
        pv + (ci ? '-' : '') + cv[0].toUpperCase() + cv.substring(1),
      '',
    ),
}

/**
 * Only transform a sequence string belongs {@link WordCase}.
 * @param sequence sequence to be transform
 * @param targetWc transform target case
 * @returns transformed sequence
 */
export function caseTransform(sequence: string, targetWc: WordCase) {
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

export function getWords(text: string) {
  const words = text.split(/[-/_.\s]+/)
  const res: string[] = []
  for (const word of words) {
    for (const matches of word.matchAll(getWords.reGetWords)) {
      if (matches[1]) {
        res.push(matches[1].toLowerCase(), matches[2].toLowerCase())
      } else {
        res.push(matches[0].toLowerCase())
      }
    }
  }
  return res.length ? res : null
}
getWords.reGetWords = /([A-Z]+)([A-Z][a-z]+)|[A-Z][a-z]+|[a-z]+|[A-Z]+/g
