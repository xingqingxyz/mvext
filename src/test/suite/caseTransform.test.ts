import { strict } from 'assert'
import { describe } from 'mocha'
import type { WordCase } from '../../utils/caseTransformHelper'
import {
  caseTransform,
  getWordsByCase,
  joinCaseActions,
  switchWordCase,
} from '../../utils/caseTransformHelper'

function testAll(words: string[], casedMap: Record<WordCase, string>) {
  describe('`joinCaseActions`', function () {
    casesList.forEach((wc) => {
      strict.equal(casedMap[wc], joinCaseActions[wc](words))
    })
  })

  describe('`getWordsByCase`', function () {
    casesList.forEach((wc) => {
      if (wc === 'lowerCase' || wc === 'upperCase') {
        strict.deepEqual(getWordsByCase(casedMap[wc], wc), [casedMap.lowerCase])
      } else {
        strict.deepEqual(getWordsByCase(casedMap[wc], wc), words)
      }
    })
  })

  describe('`casesReMap`', function () {
    casesList.forEach((wc) => {
      strict.ok(casesReMap[wc].test(casedMap[wc]))
    })
  })

  describe('`switchWordCase`', function () {
    casesList.forEach((wc) => {
      if (wc === 'lowerCase' || wc === 'upperCase') {
        return
      }
      strict.equal(switchWordCase(casedMap[wc]), wc)
    })
  })

  describe('`caseTransform`', function () {
    casesList.forEach((wc) => {
      if (wc === 'lowerCase' || wc === 'upperCase') {
        return
      }
    })
  })

  describe('', function () {
    casesList.forEach((wc) => {
      casesList.forEach((wc2) => {
        strict.equal(caseTransform(casedMap[wc], wc2), casedMap[wc2])
      })
    })
  })
}

const casesReMap = {
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
const casesList = Object.keys(casesReMap) as WordCase[]

describe('Low Level', function () {
  const words = ['hello', 'world']
  const casedMap: Record<WordCase, string> = {
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
  testAll(words, casedMap)
})

describe('High Level', function () {
  const casedMap = {
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
  const words = ['it', 'is', 'a', 'good', 'weather']
  testAll(words, casedMap)
})
