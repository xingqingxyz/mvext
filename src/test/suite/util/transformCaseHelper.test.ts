import {
  ComplexWordCase,
  WordCase,
  joinCaseActions,
  transformCaseHelper,
} from '@/util/transformCaseHelper'
import { strict } from 'assert'

const casedMap: Record<WordCase, string> = {
  camel: 'itIsAGoodWeather',
  constant: 'IT_IS_A_GOOD_WEATHER',
  dot: 'it.is.a.good.weather',
  header: 'It-Is-A-Good-Weather',
  kebab: 'it-is-a-good-weather',
  lower: 'itisagoodweather',
  normal: 'it is a good weather',
  pascal: 'ItIsAGoodWeather',
  path: 'it/is/a/good/weather',
  sentence: 'It is a good weather',
  snake: 'it_is_a_good_weather',
  title: 'It Is A Good Weather',
  upper: 'ITISAGOODWEATHER',
}

const words = ['it', 'is', 'a', 'good', 'weather']

const casesReMap: Record<ComplexWordCase, RegExp> = {
  camel: /^([a-z]+)(?:[A-Z][a-z]*)*$/,
  constant: /^(?:(?<!^)_[A-Z]+|[A-Z]+)+$/,
  dot: /^(?:(?<!^)\.[a-z]+|[a-z]+)+$/,
  header: /^(?:(?<!^)-[A-Z][a-z]*|[A-Z][a-z]*)+$/,
  kebab: /^(?:(?<!^)-[a-z]+|[a-z]+)+$/,
  normal: /^(?:(?<!^) [a-z]+|[a-z]+)+$/,
  pascal: /^(?:[A-Z][a-z]*)+$/,
  path: /^(?:(?<!^)\/[a-z]+|[a-z]+)+$/,
  sentence: /^([A-Z][a-z]*)(?: [a-z]+)*$/,
  snake: /^(?:(?<!^)_[a-z]+|[a-z]+)+$/,
  title: /^(?:(?<!^) [A-Z][a-z]*|[A-Z][a-z]*)+$/,
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

describe(`#${transformCaseHelper.name}()`, function () {
  it('should return expected cased word', function () {
    complexCasesList.forEach((wc) => {
      complexCasesList.forEach((wc2) => {
        strict.equal(transformCaseHelper(casedMap[wc], wc2), casedMap[wc2])
      })
    })
  })
})
