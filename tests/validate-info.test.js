const { assert } = require('chai')
const { validateInfo } = require('../time-tracker/utils.fn')
const TimeTrackerInfo = require('./stubs/time-tracker-info.stub')


describe('ValidateInfo', () => {
    describe('NULL', () => {
        it('should throw error', () => {
            assert.throws(() => {
                validateInfo(null)
            })
        })
    })

    describe('UNDEFINED', () => {
        it('should throw error', () => {
            assert.throws(() => {
                validateInfo(undefined)
            })
        })
    })

    describe('Empty Object', () => {
        it('should NOT throw error', () => {
            assert.doesNotThrow(() => {
                validateInfo({})
            })
        })
    })

    describe('TimeTrackerInfo instance', () => {
        const info = new TimeTrackerInfo()
        it('should NOT throw error', () => {
            assert.doesNotThrow(() => {
                validateInfo(info)
            })
        })
    })
})