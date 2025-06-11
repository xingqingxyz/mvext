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

const complexCasesReMap: Record<ComplexWordCase, RegExp> = {
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

const complexCasesList = Object.keys(complexCasesReMap) as ComplexWordCase[]

describe('complexCasesReMap', function () {
  it('should match casedMap', function () {
    complexCasesList.forEach((wc) => {
      strict.ok(complexCasesReMap[wc].test(casedMap[wc]))
    })
  })
})

describe('joinCaseActions', function () {
  it('should match casedMap', function () {
    complexCasesList.forEach((wc) => {
      strict.equal(joinCaseActions[wc](words), casedMap[wc])
    })
  })
})

describe(`#${transformCaseHelper.name}()`, function () {
  it('should return expected cased word', function () {
    strict.equal(
      transformCaseHelper('it_is.a.good_weather', 'camel'),
      'itIs.a.GoodWeather',
    )
    strict.equal(
      transformCaseHelper('itIs a_good-weather.', 'dot'),
      'itIs a_good-weather.',
    )
  })

  it('should dedup word contained `-` or `_`', function () {
    strict.equal(transformCaseHelper('a__b___c', 'snake'), 'a_b_c')
    strict.equal(transformCaseHelper('a--b---c', 'kebab'), 'a-b-c')
    strict.equal(transformCaseHelper('it--is---great', 'header'), 'It-Is-Great')
  })

  it('should keep word prefix and suffix', function () {
    strict.equal(transformCaseHelper('__init__', 'camel'), '__init__')
    strict.equal(transformCaseHelper('_addWord_', 'kebab'), '_add-word_')
    strict.equal(transformCaseHelper('_addWord_', 'header'), '_Add-Word_')
    strict.equal(transformCaseHelper('a_-b-_c', 'snake'), 'a_-b-_c')
  })
})
