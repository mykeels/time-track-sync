const { assert } = require('chai')
const { addSeconds } = require('../time-tracker/utils.fn')

describe('AddSeconds', () => {
    const d1 = new Date()

    it('diff seconds should be 0', () => {
        const now = addSeconds(0)
        assert.equal((new Date(now() - d1)).getSeconds(), 0)
    })

    it('diff seconds should be 3', () => {
        const now = addSeconds(3)
        assert.equal((new Date(now() - d1)).getSeconds(), 3)
    })

    it('diff seconds should be 5', () => {
        const now = addSeconds(5)
        assert.equal((new Date(now() - d1)).getSeconds(), 5)
    })
})