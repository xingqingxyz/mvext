import assert = require('assert')
import type { WordCase } from '../../utils/caseTransformHelper'
import transform from '../../utils/caseTransformHelper'

function getReWordCase(): Record<WordCase, RegExp> {
  return {
    lowerCase: /^[a-z]+$/,
    upperCase: /^[A-Z]+$/,
    noCase: /^(?:(?<!^) [a-z]+|[a-z]+)+$/,
    sentenceCase: /^([A-Z][a-z]*)(?: [a-z]+)*$/,
    dotCase: /^(?:(?<!^)\.[a-z]+|[a-z]+)+$/,
    pathCase: /^(?:(?<!^)\/[a-z]+|[a-z]+)+$/,
    snakeCase: /^(?:(?<!^)_[a-z]+|[a-z]+)+$/,
    headerCase: /^(?:(?<!^)-[A-Z][a-z]*|[A-Z][a-z]*)+$/,
    camelCase: /^([a-z]+)(?:[A-Z][a-z]*)*$/,
    capitalCase: /^(?:(?<!^) [A-Z][a-z]*|[A-Z][a-z]*)+$/,
    constantCase: /^(?:(?<!^)_[A-Z]+|[A-Z]+)+$/,
    paramCase: /^(?:(?<!^)-[a-z]+|[a-z]+)+$/,
    pascalCase: /^(?:[A-Z][a-z]*)+$/,
  }
}

const main = (wordCases: Record<WordCase, string>, words: string[]) => {
  function test(suite: string, fn: (wc: WordCase) => any) {
    suite && console.log(`Test ${suite}`)
    let pass = true
    let wc: WordCase
    for (wc in wordCases) {
      try {
        fn(wc)
      } catch (err) {
        console.error(
          (err as { message: string }).message.padEnd(80) + ' << ' + wc
        )
        pass = false
      }
    }
    if (!pass) {
      process.exit(1)
    }
  }

  test('`joinCaseActions`', (wc) => {
    assert.equal(wordCases[wc], transform.joinCaseActions[wc](words))
  })

  test('`getWordsByCase`', (wc) => {
    if (wc === 'lowerCase' || wc === 'upperCase') {
      assert.deepEqual(transform.getWordsByCase(cases[wc], wc), [
        cases.lowerCase,
      ])
    } else {
      assert.deepEqual(transform.getWordsByCase(cases[wc], wc), words)
    }
  })

  const reWordCase = getReWordCase()
  test('`reWordCase`', (wc) => {
    assert.ok(reWordCase[wc].test(cases[wc]))
  })

  test('`switchWordCase`', (wc) => {
    if (wc === 'lowerCase' || wc === 'upperCase') {
      return
    }
    assert.equal(transform.switchWordCase(cases[wc]), wc)
  })

  test('`caseTransform`', (wc) => {
    if (wc === 'lowerCase' || wc === 'upperCase') {
      return
    }
    test('', (wc2) => {
      try {
        assert.equal(transform.caseTransform(cases[wc], wc2), cases[wc2])
      } catch (err) {
        console.error(wc)
        throw err
      }
    })
  })
}

let cases: Record<WordCase, string> = {
  lowerCase: 'helloworld',
  upperCase: 'HELLOWORLD',
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
}
let words = ['hello', 'world']
console.log('Low Level Test')
main(cases, words)

cases = {
  lowerCase: 'itisagoodweather',
  upperCase: 'ITISAGOODWEATHER',
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
}
words = ['it', 'is', 'a', 'good', 'weather']
console.log('High Level Test')
main(cases, words)
