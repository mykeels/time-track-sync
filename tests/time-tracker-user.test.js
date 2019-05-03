const {
    assert,
    TimeTracker,
    TimeTrackerUser,
    TimeTrackerInfo,
    WebSocket,
    info,
    key,
    ws,
    addSeconds
} = require('./setup.test')

describe('TimeTrackerUser', () => {
    const timeTracker = new TimeTracker()
    const user = timeTracker.get(info)

    it('should make an instance of TimeTrackerUser', () => {
        assert.isNotNull(user)
        assert.isDefined(user)
    })
    it('should have appropriate TimeTrackerUser.prototype', () => {
        assert.isDefined(user.activities)
        assert.isArray(user.activities)

        assert.isDefined(user.inactiveSeconds)
        assert.equal(user.inactiveSeconds, 0)
        
        assert.isDefined(user.key)
        assert.equal(user.key, '1-1')
    })

    describe('TimeTrackerUser.prototype.enter()', () => {
        const timeTracker = new TimeTracker()
    
        const user = timeTracker.get(info)

        user.start(info, ws)
    
        it('should have activities.length === 1', () => {
            user.enter(info, ws)
    
            assert.equal(user.activities.length, 1)
        })
        
        it('should have activities array unique', () => {
            user.enter(info, ws)
            user.enter(info, ws)
            user.enter(info, ws)
    
            assert.equal(user.activities.length, 1)
        })
        
        it('should have activities[index].sockets unique', () => {
            user.enter(info, ws)
            user.enter(info, ws)
            user.enter(info, ws)
    
            assert.equal(user.activities[0].sockets.length, 1)
        })
    })

    describe('TimeTrackerUser.prototype.leave()', () => {

        it('should set activities[0].sockets[0] [active] property to false', () => {
            user.enter(info, ws)
            user.leave(ws)
    
            assert.isFalse(ws.active)
            assert.isFalse(user.activities[0].sockets[0].active)
        })
    })
    
    describe('TimeTrackerUser.prototype.exit()', () => {

        it('should set activities[0].sockets[0] [active] property to false', () => {
            user.enter(info, ws)
            user.leave(ws)
    
            assert.isFalse(ws.active)
            assert.isFalse(user.activities[0].sockets[0].active)
        })
    })
    
    describe('TimeTrackerUser.prototype.totalSeconds', () => {

        it('should have totalSeconds set to 0', () => {
            user.enter(info, ws)

            assert.equal(user.totalSeconds, info.totalTime)
        })
    })
    
    describe('TimeTrackerUser.prototype.allSockets', () => {

        it('should have allSockets as an array', () => {
            user.enter(info, ws)

            assert.isArray(user.allSockets)
            assert.equal(user.allSockets.length, 1)
        })
    })
    
    describe('TimeTrackerUser.prototype.close', () => {

        it('should have callMode as false', () => {
            user.enter(info, ws)

            user.close()

            assert.notEqual(user.activities.length, 0)
            user.activities.forEach(activity => {
                assert.equal(activity.duration, 0)
            })
        })
    })
    
    describe('TimeTrackerUser.prototype.activities', () => {
        const timeTracker = new TimeTracker()
        const user = timeTracker.get(info)

        it('should have activities', () => {
            user.enter(info, ws)

            assert.equal(user.activities.length, 1)

            assert.equal(user.activities[0].name, info.activity)
        })

        describe('Activity with different socket (new tab)', () => {
            it('should have two sockets', () => {
                const ws2 = new WebSocket()

                user.enter(info, ws2)

                assert.equal(user.activities.length, 1)

                assert.equal(user.allSockets.length, 2)
            })
        })
    })
    
    describe('TimeTrackerUser.prototype.leave', () => {
        const timeTracker = new TimeTracker()
        const user = timeTracker.get(info)

        it('should have ws.active as false', () => {
            user.leave(ws)

            assert.isFalse(ws.active)
        })
    })
    
    describe('TimeTrackerUser.prototype.closeInactiveModal', () => {

        it('should have first activity duration as 165', () => {
            const timeTracker = new TimeTracker()
            const user = timeTracker.get(info)

            user.enter(info, ws)

            user.activities[0].duration = 120

            user.showInactiveModal(info, addSeconds(0))

            user.closeInactiveModal(info, true, addSeconds(45))

            assert.equal(user.activities[0].duration, 165)
        })

        it('should have first activity duration as 30', () => {
            const timeTracker = new TimeTracker()
            const user = timeTracker.get(info)

            user.overrideTimeouts({
                alertTimeout: 120,
                logoutTimeout: 600
            })

            user.enter(info, ws)

            user.activities[0].duration = 120

            user.showInactiveModal(info, addSeconds(0))

            user.closeInactiveModal(info, false, addSeconds(45))

            assert.equal(user.activities[0].duration, 30)
        })
    })
    
    describe('TimeTrackerUser.prototype.sync()', () => {
        it('should have sent data with message as "server:sync"', () => {
            const timeTracker = new TimeTracker()
            const user = timeTracker.get(info)

            user.start(info, ws)
            user.enter(info, ws)

            user.sync()

            assert.isTrue(user.allSockets[0].messages.some(data => {
                return JSON.parse(data).message === 'server:sync'
            }))
        })
    })
    
    describe('TimeTrackerUser.prototype.exit()', () => {
        const timeTracker = new TimeTracker()
        const user = timeTracker.get(info)

        user.start(info, ws)

        describe('Activity', () => {
            it('should have no sockets', () => {
                user.enter(info, ws)
    
                assert.isTrue(user.activities.length > 0)
                assert.isTrue(user.activities[0].sockets.length > 0)

                user.exit(ws)

                assert.isFalse(user.activities[0].sockets.length > 0)
            })
        })
    })
    
    describe('TimeTrackerUser.prototype.report()', () => {
        const timeTracker = new TimeTracker()
        const user = timeTracker.get(info)

        user.start(info, ws)

        it('should have same number of activities as user', () => {
            user.enter(info, ws)

            assert.equal(user.report().activities.length, user.activities.length)
        })
    })

    describe('TimeTrackerUser default timeout values', () => {
        const timeTracker = new TimeTracker()
        const user = timeTracker.get(info)

        user.overrideTimeouts({
            alertTimeout: 120,
            logoutTimeout: 600
        })

        user.start(info, ws)

        it('should have ALERT_TIMEOUT as 120', () => {
            assert.equal(user.ALERT_TIMEOUT, 120)
        })

        it('should have LOGOUT_TIMEOUT as 600', () => {
            assert.equal(user.LOGOUT_TIMEOUT, 600)
        })
    })

    describe('TimeTrackerUser.prototype.overrideTimeouts()', () => {
        const timeTracker = new TimeTracker()
        const user = timeTracker.get(info)

        user.start(info, ws)

        user.overrideTimeouts({
            alertTimeout: 5, 
            logoutTimeout: 10
        })

        it('should have ALERT_TIMEOUT as 5', () => {
            assert.equal(user.ALERT_TIMEOUT, 5)
        })

        it('should have LOGOUT_TIMEOUT as 10', () => {
            assert.equal(user.LOGOUT_TIMEOUT, 10)
        })
    })
})