import assert = require('assert');
import type { WordCase } from '../../caseTransform';
const { dispatchNorm, dispatchWord, reCases, transformToNorm } = require('../../cases');

const main = (cases: Record<WordCase, string>, norm: string[]) => {
	let wc: WordCase;
	let res: string | string[];

	console.log('Test `dispatchNorm`');

	for (wc in cases) {
		res = dispatchNorm[wc](norm);
		try {
			assert.deepEqual(
				res,
				cases[wc],
				`Expected ${wc}: '${cases[wc]}', but got '${res}'`
			);
		} catch (err) {
			console.error((err as { message: string }).message);
		}
	}

	console.log('Test `reCases`');

	for (wc in cases) {
		try {
			assert.deepEqual(
				reCases[wc].re.test(cases[wc]),
				true,
				`Expected ${wc} to be true`
			);
		} catch (err) {
			console.error((err as { message: string }).message);
		}
	}

	console.log('Test `transformToNorm`');

	for (wc in cases) {
		res = transformToNorm(cases[wc], wc);
		try {
			assert.deepEqual(
				res,
				norm,
				`Expected ${wc}: '${cases[wc]} => ${norm}', but got '${res}'`
			);
		} catch (err) {
			console.error((err as { message: string }).message);
		}
	}

	console.log('Test `dispatchWord`');

	let targetCase: WordCase;
	for (targetCase in cases) {
		for (wc in cases) {
			res = dispatchWord(cases[wc], targetCase);
			try {
				assert.deepEqual(
					res,
					cases[targetCase],
					`Expected ${wc} -> ${targetCase}: '${cases[wc]} => ${cases[targetCase]}', but got '${res}'`
				);
			} catch (err) {
				console.error((err as { message: string }).message);
			}
		}
	}
};

let cases: Record<WordCase, string> = {
	capitalCase: 'Hello World',
	noCase: 'hello world',
	paramCase: 'hello-world',
	pascalCase: 'HelloWorld',
	sentenceCase: 'Hello world',
	snakeCase: 'hello_world',
	dotCase: 'hello.world',
	camelCase: 'helloWorld',
	constantCase: 'HELLO_WORLD',
	pathCase: 'hello/world',
	headerCase: 'Hello-World',
};
let norm = ['hello', 'world'];
main(cases, norm);

cases = {
	capitalCase: 'It Is A Good Weather',
	noCase: 'it is a good weather',
	paramCase: 'it-is-a-good-weather',
	pascalCase: 'ItIsAGoodWeather',
	sentenceCase: 'It is a good weather',
	snakeCase: 'it_is_a_good_weather',
	pathCase: 'it/is/a/good/weather',
	dotCase: 'it.is.a.good.weather',
	camelCase: 'itIsAGoodWeather',
	headerCase: 'It-Is-A-Good-Weather',
	constantCase: 'IT_IS_A_GOOD_WEATHER',
};
norm = ['it', 'is', 'a', 'good', 'weather'];
main(cases, norm);
