import { transformCaseHelper } from '@/util/transformCaseHelper'
import assert from 'assert/strict'

describe(`#${transformCaseHelper.name}()`, function () {
  it('should return expected cased word', function () {
    assert.equal(
      transformCaseHelper('it_is.a.good_weather', 'camel'),
      'itIs.a.GoodWeather',
    )
    assert.equal(
      transformCaseHelper('itIs a_good-weather.', 'dot'),
      'itIs a_good-weather.',
    )
  })

  it('should dedup word contained `-` or `_`', function () {
    assert.equal(transformCaseHelper('a__b___c', 'snake'), 'a_b_c')
    assert.equal(transformCaseHelper('a--b---c', 'kebab'), 'a-b-c')
    assert.equal(transformCaseHelper('it--is---great', 'header'), 'It-Is-Great')
  })

  it('should keep word prefix and suffix', function () {
    assert.equal(transformCaseHelper('__init__', 'camel'), '__init__')
    assert.equal(transformCaseHelper('_addWord_', 'kebab'), '_add-word_')
    assert.equal(transformCaseHelper('_addWord_', 'header'), '_Add-Word_')
    assert.equal(transformCaseHelper('a_-b-_c', 'snake'), 'a_-b-_c')
  })
})
