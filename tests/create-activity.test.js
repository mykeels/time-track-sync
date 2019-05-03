const { assert } = require('chai')
const { createActivity } = require('../time-tracker/utils.fn')
const TimeTrackerInfo = require('./stubs/time-tracker-info.stub')


describe('Create Activity', () => {
    describe('Empty Object', () => {
        it('should create activity', () => {
            assert.isObject(createActivity({}))
        })
    })

    describe('isActive', () => {
        it('should be false', () => {
            const activity = createActivity({})
            assert.isFalse(activity.isActive)
        })
    })
})