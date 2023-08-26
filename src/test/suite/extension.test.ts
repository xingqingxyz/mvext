import strict from 'assert/strict'

describe('vscode', function () {
  it('work', function () {
    strict.equal(-1, [1, 2, 3].indexOf(5))
    strict.equal(-1, [1, 2, 3].indexOf(0))
  })
})
