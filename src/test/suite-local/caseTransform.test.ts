import { strict } from 'assert'
import { describe, it } from 'mocha'
import type { WordCase } from '../../utils/caseTransformHelper'
import {
  caseTransform,
  getWordsByCase,
  joinCaseActions,
  switchWordCase,
} from '../../utils/caseTransformHelper'

function testAll(words: string[], casedMap: Record<WordCase, string>) {
  describe('joinCaseActions', function () {
    it('should match casedMap', function () {
      casesList.forEach((wc) => {
        strict.equal(casedMap[wc], joinCaseActions[wc](words))
      })
    })
  })

  describe(`#${getWordsByCase.name}()`, function () {
    it('should deepEqual words', function () {
      casesList.forEach((wc) => {
        if (wc === 'lowerCase' || wc === 'upperCase') {
          strict.deepEqual(getWordsByCase(casedMap[wc], wc), [
            casedMap.lowerCase,
          ])
        } else {
          strict.deepEqual(getWordsByCase(casedMap[wc], wc), words)
        }
      })
    })
  })

  describe('casesReMap', function () {
    it('should match casedMap', function () {
      casesList.forEach((wc) => {
        strict.ok(casesReMap[wc].test(casedMap[wc]))
      })
    })
  })

  describe(`#${switchWordCase.name}()`, function () {
    it('should return expect word case', function () {
      casesList.forEach((wc) => {
        if (wc === 'lowerCase' || wc === 'upperCase') {
          return
        }
        strict.equal(switchWordCase(casedMap[wc]), wc)
      })
    })
  })

  describe(`#${caseTransform.name}()`, function () {
    it('should return expected cased word', function () {
      casesList.forEach((wc) => {
        if (wc === 'lowerCase' || wc === 'upperCase') {
          return
        }
        casesList.forEach((wc2) => {
          strict.equal(caseTransform(casedMap[wc], wc2), casedMap[wc2])
        })
      })
    })
  })
}

const casesReMap: Record<WordCase, RegExp> = {
  lowerCase: /^[a-z]+$/,
  upperCase: /^[A-Z]+$/,
  noCase: /^(?:(?<!^) [a-z]+|[a-z]+)+$/,
  sentenceCase: /^([A-Z][a-z]*)(?: [a-z]+)*$/,
  dotCase: /^(?:(?<!^)\.[a-z]+|[a-z]+)+$/,
  pathCase: /^(?:(?<!^)\/[a-z]+|[a-z]+)+$/,
  snakeCase: /^(?:(?<!^)_[a-z]+|[a-z]+)+$/,
  headerCase: /^(?:(?<!^)-[A-Z][a-z]*|[A-Z][a-z]*)+$/,
  camelCase: /^([a-z]+)(?:[A-Z][a-z]*)*$/,
  titleCase: /^(?:(?<!^) [A-Z][a-z]*|[A-Z][a-z]*)+$/,
  constantCase: /^(?:(?<!^)_[A-Z]+|[A-Z]+)+$/,
  kebabCase: /^(?:(?<!^)-[a-z]+|[a-z]+)+$/,
  pascalCase: /^(?:[A-Z][a-z]*)+$/,
}
const casesList = Object.keys(casesReMap) as WordCase[]

describe('Low Level', function () {
  const words = ['hello', 'world']
  const casedMap: Record<WordCase, string> = {
    lowerCase: 'helloworld',
    upperCase: 'HELLOWORLD',
    titleCase: 'Hello World',
    noCase: 'hello world',
    kebabCase: 'hello-world',
    pascalCase: 'HelloWorld',
    sentenceCase: 'Hello world',
    snakeCase: 'hello_world',
    dotCase: 'hello.world',
    camelCase: 'helloWorld',
    constantCase: 'HELLO_WORLD',
    pathCase: 'hello/world',
    headerCase: 'Hello-World',
  }
  testAll(words, casedMap)
})

describe('High Level', function () {
  const casedMap: Record<WordCase, string> = {
    lowerCase: 'itisagoodweather',
    upperCase: 'ITISAGOODWEATHER',
    titleCase: 'It Is A Good Weather',
    noCase: 'it is a good weather',
    kebabCase: 'it-is-a-good-weather',
    pascalCase: 'ItIsAGoodWeather',
    sentenceCase: 'It is a good weather',
    snakeCase: 'it_is_a_good_weather',
    pathCase: 'it/is/a/good/weather',
    dotCase: 'it.is.a.good.weather',
    camelCase: 'itIsAGoodWeather',
    headerCase: 'It-Is-A-Good-Weather',
    constantCase: 'IT_IS_A_GOOD_WEATHER',
  }
  const words = ['it', 'is', 'a', 'good', 'weather']
  testAll(words, casedMap)
})
