/**
 * Functions transform from the `norm` word array to a target word.
 */
const dispatchNorm = {
	dotCase: (norm: string[]) => norm.join('.'),
	pathCase: (norm: string[]) => norm.join('/'),
	snakeCase: (norm: string[]) => norm.join('_'),
	paramCase: (norm: string[]) => norm.join('-'),
	noCase: (norm: string[]) => norm.join(' '),
	sentenceCase: (norm: string[]) =>
		norm.reduce(
			(pv, cv, ci) => pv + (ci ? ' ' + cv : cv[0].toUpperCase() + cv.substring(1)),
			''
		),
	constantCase: (norm: string[]) =>
		norm.reduce((pv, cv, ci) => pv + (ci ? '_' : '') + cv.toUpperCase(), ''),
	pascalCase: (norm: string[]) =>
		norm.reduce((pv, cv) => pv + cv[0].toUpperCase() + cv.substring(1), ''),
	camelCase: (norm: string[]) =>
		norm.reduce(
			(pv, cv, ci) => pv + (ci ? cv[0].toUpperCase() + cv.substring(1) : cv),
			''
		),
	capitalCase: (norm: string[]) =>
		norm.reduce(
			(pv, cv, ci) => pv + (ci ? ' ' : '') + cv[0].toUpperCase() + cv.substring(1),
			''
		),
	headerCase: (norm: string[]) =>
		norm.reduce(
			(pv, cv, ci) => pv + (ci ? '-' : '') + cv[0].toUpperCase() + cv.substring(1),
			''
		),
};
type WordCase = keyof typeof dispatchNorm;

/**
 * Each word case links a RegExp tuple represents:`['match this case', 'matches of this case']`
 */
const reCases: Record<WordCase, Record<'re' | 'words', RegExp>> = {
	// firstChar: l
	noCase: {
		get re() {
			return /^(?:(?!^) [a-z]+|[a-z]+)+$/;
		},
		words: /[a-z]+/g,
	},
	// firstChar: u; inc: ' '
	sentenceCase: {
		get re() {
			return /^([A-Z][a-z]*)(?: [a-z]+)*$/;
		},
		words: /(?<= )[a-z]+/g,
	},
	// firstChar: l
	dotCase: {
		get re() {
			return /^(?:(?!^)\.[a-z]+|[a-z]+)+$/;
		},
		words: /[a-z]+/g,
	},
	// firstChar: l
	pathCase: {
		get re() {
			return /^(?:(?!^)\/[a-z]+|[a-z]+)+$/;
		},
		words: /[a-z]+/g,
	},
	// firstChar: l
	snakeCase: {
		get re() {
			return /^(?:(?!^)_[a-z]+|[a-z]+)+$/;
		},
		words: /[a-z]+/g,
	},
	// firstChar: u; inc: '-'
	headerCase: {
		get re() {
			return /^(?:(?!^)-[A-Z][a-z]*|[A-Z][a-z]*)+$/;
		},
		words: /[A-Z][a-z]*/g,
	},
	// firstChar: l
	camelCase: {
		get re() {
			return /^([a-z]+)(?:[A-Z][a-z]*)*$/;
		},
		words: /[A-Z][a-z]*/g,
	},
	// firstChar: u; inc: ' '
	capitalCase: {
		get re() {
			return /^(?:(?!^) [A-Z][a-z]*|[A-Z][a-z]*)+$/;
		},
		words: /[A-Z][a-z]*/g,
	},
	// firstChar: u; inc: '_'
	constantCase: {
		get re() {
			return /^(?:(?!^)_[A-Z]+|[A-Z]+)+$/;
		},
		words: /[A-Z]+/g,
	},
	// firstChar: l
	paramCase: {
		get re() {
			return /^(?:(?!^)-[a-z]+|[a-z]+)+$/;
		},
		words: /[a-z]+/g,
	},
	// firstChar: u; inc: ''
	pascalCase: {
		get re() {
			return /^(?:[A-Z][a-z]*)+$/;
		},
		words: /[A-Z][a-z]*/g,
	},
};

/**
 * Transform one word from `wordCase` to `norm` array.
 * @param wordCase
 * @returns transformed word
 */
function transformToNorm(word: string, wordCase: WordCase) {
	const res: string[] = [];
	switch (wordCase) {
		case 'constantCase':
		case 'headerCase':
		case 'capitalCase':
		case 'pascalCase':
			for (const match of reCases[wordCase].words[Symbol.matchAll](word)) {
				res.push(match[0].toLowerCase());
			}
			break;
		case 'sentenceCase': {
			const re = word.match(reCases[wordCase].re);
			re && res.push(re[1].toLowerCase());
			for (const match of reCases[wordCase].words[Symbol.matchAll](word)) {
				res.push(match[0]);
			}
			break;
		}
		case 'camelCase': {
			const re = word.match(reCases[wordCase].re);
			re && res.push(re[1]);
			for (const match of reCases[wordCase].words[Symbol.matchAll](word)) {
				res.push(match[0].toLowerCase());
			}
			break;
		}
		default:
			for (const match of reCases[wordCase].words[Symbol.matchAll](word)) {
				res.push(match[0]);
			}
			break;
	}
	return res;
}

/**
 * Only transform a word string belongs {@link WordCase}.
 * @param word word to be transform
 * @param targetCase transform target case
 * @returns transformed word
 */
function dispatchWord(word: string, targetCase: WordCase) {
	const reLower = /^[a-z]$/;
	let reWeChar: RegExp;
	let matches: RegExpMatchArray | null;
	/**
	 * Simply transform from `wc` to `targetCase`
	 * @param wc `word`'s case
	 * @returns transformed text
	 */
	const transform = (wc: WordCase) =>
		dispatchNorm[targetCase](transformToNorm(word, wc));

	if (reLower.test(word[0])) {
		reWeChar = /( )|(_)|(-)|(\.)|(\/)/;
		matches = word.match(reWeChar);

		if (!matches) {
			if (reCases.camelCase.re.test(word)) {
				return transform('camelCase');
			}
			return transform('noCase');
		}

		const idx = matches.findIndex((v, i) => v && i);
		switch (idx) {
			case 1:
				return transform('noCase');
			case 2:
				return transform('snakeCase');
			case 3:
				return transform('paramCase');
			case 4:
				return transform('dotCase');
			case 5:
				return transform('pathCase');
			default:
				break;
		}
	} else if (/^[A-Z]$/.test(word[0])) {
		reWeChar = /( )|(_)|(-)/;
		matches = word.match(reWeChar);

		if (!matches) {
			if (reCases.constantCase.re.test(word)) {
				return transform('constantCase');
			}
			return transform('pascalCase');
		}

		const idx = matches.findIndex((v, i) => v && i);
		switch (idx) {
			case 1:
				if (reLower.test(word.split(' ', 2)[1][0])) {
					return transform('sentenceCase');
				}
				return transform('capitalCase');
			case 2:
				return transform('constantCase');
			case 3:
				return transform('headerCase');
			default:
				break;
		}
	}
	return '';
}

// @ts-ignore type-export
export = { dispatchNorm, dispatchWord, reCases, transformToNorm };
export type { WordCase };
