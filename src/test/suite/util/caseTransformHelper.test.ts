import {
  ComplexWordCase,
  WordCase,
  caseTransformHelper,
  joinCaseActions,
} from '@/util/caseTransformHelper'
import { strict } from 'assert'

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

const casesReMap: Record<ComplexWordCase, RegExp> = {
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

const complexCasesList = Object.keys(casesReMap) as ComplexWordCase[]

describe('casesReMap', function () {
  it('should match casedMap', function () {
    complexCasesList.forEach((wc) => {
      strict.ok(casesReMap[wc].test(casedMap[wc]))
    })
  })
})

describe('joinCaseActions', function () {
  it('should match casedMap', function () {
    complexCasesList.forEach((wc) => {
      strict.equal(casedMap[wc], joinCaseActions[wc](words))
    })
  })
})

describe(`#${caseTransformHelper.name}()`, function () {
  it('should return expected cased word', function () {
    complexCasesList.forEach((wc) => {
      complexCasesList.forEach((wc2) => {
        strict.equal(caseTransformHelper(casedMap[wc], wc2), casedMap[wc2])
      })
    })
  })
})
