const {
    assert,
    TimeTracker,
    TimeTrackerInfo,
    ws
} = require('./setup.test')
const { createActivity } = require('../time-tracker/utils.fn')

describe('TimeTracker', () => {
    it('should make an instance of TimeTracker', () => {
        const timeTracker = new TimeTracker()

        assert.isNotNull(timeTracker)
        assert.isDefined(timeTracker)
    })

    describe('Add User', () => {
        describe('Count', () => {
            const timeTracker = new TimeTracker()
            const info = new TimeTrackerInfo()

            it('should be 1', () => {
                timeTracker.get(info)
                assert.equal(timeTracker.users().length, 1)
            })

            it('should be 0', () => {
                timeTracker.remove(info)
                assert.equal(timeTracker.users().length, 0)
            })
        })
        
        describe('Activity Name', () => {
            const timeTracker = new TimeTracker()
            const info = new TimeTrackerInfo()

            const timeTrackerUser = timeTracker.get(info)

            it('should be same as info.activity', () => {
                timeTrackerUser.enter(info, ws)
                assert.equal(timeTrackerUser.activities[0].name, info.activity)
            })

            it('should be unknown', () => {
                const timeTracker = new TimeTracker()
                const info = { activity: '' }

                const timeTrackerUser = timeTracker.get(info)

                assert.equal(info.activity, 'unknown')
            })
        })

        describe('Exists', () => {
            const timeTracker = new TimeTracker()
            const info1 = new TimeTrackerInfo()
            const info2 = { ...new TimeTrackerInfo(), key: '1-2' }

            const timeTrackerUser = timeTracker.get(info1)

            it('should be true', () => {
                assert.isTrue(timeTracker.exists(info1))
            })

            it('should be false', () => {
                assert.isFalse(timeTracker.exists(info2))
            })
        })

        describe('Keys', () => {
            const timeTracker = new TimeTracker()

            it('should be array', () => {
                assert.isArray(timeTracker.keys())
            })

            it('should be empty', () => {
                assert.equal(timeTracker.keys().length, 0)
            })
        })

        describe('Remove', () => {
            const timeTracker = new TimeTracker()
            const info = new TimeTrackerInfo()

            it('should work', () => {
                const timeTrackerUser = timeTracker.get(info)

                assert.equal(timeTracker.users().length, 1)

                timeTracker.remove(info)

                assert.equal(timeTracker.users().length, 0)
            })
        })
    })
})