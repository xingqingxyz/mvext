/**
 * Functions join the `words` (raw`[a-zA-Z_-$][\w$]*`) array and transform to target case.
 */
export const joinCaseActions = {
  lowerCase: (words: string[]) => words.join(''),
  upperCase: (words: string[]) => words.join('').toUpperCase(),
  dotCase: (words: string[]) => words.join('.'),
  pathCase: (words: string[]) => words.join('/'),
  snakeCase: (words: string[]) => words.join('_'),
  paramCase: (words: string[]) => words.join('-'),
  noCase: (words: string[]) => words.join(' '),
  sentenceCase: (words: string[]) =>
    words.reduce(
      (pv, cv, ci) =>
        pv + (ci ? ' ' + cv : cv[0].toUpperCase() + cv.substring(1)),
      ''
    ),
  constantCase: (words: string[]) =>
    words.reduce((pv, cv, ci) => pv + (ci ? '_' : '') + cv.toUpperCase(), ''),
  pascalCase: (words: string[]) =>
    words.reduce((pv, cv) => pv + cv[0].toUpperCase() + cv.substring(1), ''),
  camelCase: (words: string[]) =>
    words.reduce(
      (pv, cv, ci) => pv + (ci ? cv[0].toUpperCase() + cv.substring(1) : cv),
      ''
    ),
  capitalCase: (words: string[]) =>
    words.reduce(
      (pv, cv, ci) =>
        pv + (ci ? ' ' : '') + cv[0].toUpperCase() + cv.substring(1),
      ''
    ),
  headerCase: (words: string[]) =>
    words.reduce(
      (pv, cv, ci) =>
        pv + (ci ? '-' : '') + cv[0].toUpperCase() + cv.substring(1),
      ''
    ),
}

export type WordCase = keyof typeof joinCaseActions
export const casesList = Object.keys(joinCaseActions) as WordCase[]

/**
 * Switch the sequence case from raw`[a-zA-Z_$][\w$]*`
 * @param sequence a sequence making sequence case
 * @returns {WordCase} case
 */
export function switchWordCase(sequence: string): WordCase {
  const reLowerLetter = /[a-z]/
  const reUpperLetter = /[A-Z]/

  if (reLowerLetter.test(sequence[0])) {
    const reCaseSplitter = /( )|(_)|(-)|(\.)|(\/)/
    const matches = sequence.match(reCaseSplitter)

    if (!matches) {
      const reCamelCase = /^([a-z]+)(?:[A-Z][a-z]*)*$/
      if (reCamelCase.test(sequence)) {
        return 'camelCase'
      }
      return 'noCase'
    }

    const idx = matches.findIndex((v, i) => v && i)
    switch (idx) {
      case 1:
        return 'noCase'
      case 2:
        return 'snakeCase'
      case 3:
        return 'paramCase'
      case 4:
        return 'dotCase'
      case 5:
        return 'pathCase'
    }
  } else if (reUpperLetter.test(sequence[0])) {
    const reCaseSplitter = /( )|(_)|(-)/
    const matches = sequence.match(reCaseSplitter)

    if (!matches) {
      const reConstantCase = /^(?:(?<!^)_[A-Z]+|[A-Z]+)+$/
      if (reConstantCase.test(sequence)) {
        return 'constantCase'
      }
      return 'pascalCase'
    }

    const idx = matches.findIndex((v, i) => v && i)
    switch (idx) {
      case 1:
        if (reLowerLetter.test(sequence.split(' ', 2)[1][0])) {
          return 'sentenceCase'
        }
        return 'capitalCase'
      case 2:
        return 'constantCase'
      case 3:
        return 'headerCase'
    }
  }

  return 'lowerCase'
}

/**
 * RegExp(s) for getting words from selected case.
 */
const reGetWordsByCase: Record<
  Exclude<WordCase, 'lowerCase' | 'upperCase'>,
  RegExp | RegExp[]
> = (function () {
  const reAllLowerCase = /[a-z]+/g
  const reAllCapitalCase = /[A-Z][a-z]*/g
  return {
    noCase: reAllLowerCase,
    snakeCase: reAllLowerCase,
    paramCase: reAllLowerCase,
    pathCase: reAllLowerCase,
    dotCase: reAllLowerCase,
    constantCase: /[A-Z]+/g,
    capitalCase: reAllCapitalCase,
    headerCase: reAllCapitalCase,
    pascalCase: reAllCapitalCase,
    // 0=1; 1=0
    sentenceCase: [/^([A-Z][a-z]*)(?: [a-z]+)*$/, /(?<= )[a-z]+/g],
    camelCase: [/^([a-z]+)(?:[A-Z][a-z]*)*$/, reAllCapitalCase],
  }
})()

/**
 * Transform one sequence from `wordCase` to `words` array.
 * @param wc word case
 * @returns transformed sequence
 */
export function getWordsByCase(sequence: string, wc: WordCase) {
  switch (wc) {
    case 'lowerCase':
      return [sequence]
    case 'upperCase':
      return [sequence.toLowerCase()]
    default: {
      const re = reGetWordsByCase[wc]
      if (re instanceof RegExp) {
        const matches = sequence.match(re)
        if (!matches) {
          return null
        }
        switch (wc) {
          // case 'dotCase':
          // case 'pathCase':
          // case 'snakeCase':
          // case 'paramCase':
          // case 'noCase':
          case 'capitalCase':
          case 'constantCase':
          case 'pascalCase':
          case 'headerCase':
            return matches.map((w) => w.toLowerCase())
          default:
            return matches
        }
      } else {
        const matchHead = sequence.match(re[0])
        if (!matchHead) {
          return null
        }
        switch (wc) {
          case 'camelCase':
            return [matchHead[1]].concat(
              sequence.match(re[1])?.map((w) => w.toLowerCase()) || []
            )
          case 'sentenceCase':
            return [matchHead[1].toLowerCase()].concat(
              sequence.match(re[1]) || []
            )
          default:
            return null
        }
      }
    }
  }
}

/**
 * Only transform a sequence string belongs {@link WordCase}.
 * @param sequence sequence to be transform
 * @param targetCase transform target case
 * @returns transformed sequence
 */
export function caseTransform(sequence: string, targetCase: WordCase) {
  const reSpiltChar = /[\d$]/g
  const targets: string[] = []

  function pushWord(piece: string) {
    const wc = switchWordCase(piece)
    const words = getWordsByCase(piece, wc)
    if (words) {
      const cased = joinCaseActions[targetCase](words)
      targets.push(cased)
    }
  }

  const matches = Array.from(sequence.matchAll(reSpiltChar))
  if (matches.length) {
    let lastIndx = 0
    for (const { index, 0: value } of matches) {
      const piece = sequence.slice(lastIndx, index)
      if (piece.length) {
        pushWord(piece)
      }
      lastIndx = <number>index + value.length
      targets.push(value)
    }
    const piece = sequence.slice(lastIndx)
    if (piece.length) {
      pushWord(piece)
    }
  } else {
    pushWord(sequence)
  }

  return targets.join('')
}
