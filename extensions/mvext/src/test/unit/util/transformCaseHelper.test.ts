import { transformCaseHelper } from '@/util/transformCaseHelper'
import assert from 'assert/strict'

describe(`#${transformCaseHelper.name}()`, function () {
  it('should return expected cased word', function () {
    assert.equal(
      transformCaseHelper('itIs a_good-weather.', 'dot'),
      'itIs a_good-weather.',
    )
  })

  it('should keep word prefix and suffix', function () {
    assert.equal(transformCaseHelper('__init__', 'camel'), '__init__')
    assert.equal(transformCaseHelper('_addWord_', 'kebab'), '_add-word_')
    assert.equal(transformCaseHelper('_addWord_', 'header'), '_Add-Word_')
    assert.equal(transformCaseHelper('a_-b-_c', 'snake'), 'a_-b-_c')
  })
})
