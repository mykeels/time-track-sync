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

describe('TimeTrackerFlow', () => {

    const timeTracker = new TimeTracker()
    const user = timeTracker.get(info)

    describe('Enter', () => {
        user.enter(info, ws)

        it('should have totalSeconds as 0', () => {
            assert.equal(user.totalSeconds, 0)
        })

        describe('InactivityModal', () => {
            const timeTracker = new TimeTracker()
            const user = timeTracker.get(info)

            describe('User chose NO', () => {
                user.enter(info, ws)
                user.respondToModal(false, info)

                it('should have totalSeconds as 30', () => {
                    assert.equal(user.totalSeconds, 30)
                })
            })
            
            describe('User chose YES', () => {
                const timeTracker = new TimeTracker()
                const user = timeTracker.get(info)

                user.enter(info, ws)
                user.inactiveSeconds = 20
                user.respondToModal(true, info)

                it('should have totalSeconds as 20', () => {
                    assert.equal(user.totalSeconds, 20)
                })
            })
        })
    })

    describe('UserStart', () => {
        describe('PageLoadTime', () => {
            it('should add to activity duration', () => {
                const timeTracker = new TimeTracker()
                const info = new TimeTrackerInfo({ initSeconds: 5 })
                const user = timeTracker.get(info)
    
                user.start(info, ws)

                assert.equal(user.totalDuration, 5)
            })
        })
    })

    describe('UserEnter', () => {
        describe('NoModalRequired', () => {
            it('should have total duration equal to 100', () => {
                const timeTracker = new TimeTracker()
                const user = timeTracker.get(info)

                user.overrideTimeouts({
                    alertTimeout: 120,
                    logoutTimeout: 600
                })
    
                user.start(info, ws)
    
                user.inactiveSeconds = 100
    
                user.enter(info, ws)
    
                assert.equal(user.totalDuration, 100)
            })
        })

        describe('Modal Required', () => {
            it('should trigger inactive modal', () => {
                const timeTracker = new TimeTracker()
                const user = timeTracker.get(info)

                user.overrideTimeouts({
                    alertTimeout: 120,
                    logoutTimeout: 600
                })
    
                user.start(info, ws)
    
                user.inactiveSeconds = 120
    
                user.enter(info, ws)
    
                assert.equal(user.totalDuration, 0)
    
                assert.equal(JSON.parse(user.allSockets[0].messages.slice(-1)[0]).message, 'server:modal')
            })
        })

        describe('Logout', () => {
            it('should logout if inactivity-seconds is more than 600', () => {
                const timeTracker = new TimeTracker()
                const user = timeTracker.get(info)
    
                user.start(info, ws)
    
                user.inactiveSeconds = 601
    
                user.enter(info, ws)
    
                assert.equal(JSON.parse(user.allSockets[0].messages.slice(-1)[0]).message, 'server:logout')
            })

            describe('ClientInactivity', () => {
                it('should not reset inactive duration more than once', () => {
                    const timeTracker = new TimeTracker()
                    const user = timeTracker.get(info)

                    user.overrideTimeouts({
                        alertTimeout: 120,
                        logoutTimeout: 600
                    })
        
                    user.start(info, ws)
    
                    user.activities[0].duration = 125
        
                    user.inactiveSeconds = 601
        
                    user.clientInactivityLogout()
        
                    user.clientInactivityLogout()
        
                    assert.equal(user.totalDuration, 35)
                })
            })
        })
        
    })

    describe('InactivityAction', () => {
        const timeTracker = new TimeTracker()
        const user = timeTracker.get(info)

        user.overrideTimeouts({
            alertTimeout: 120,
            logoutTimeout: 600
        })

        it('should neither require modal nor logout (100 seconds)', () => {
            user.inactiveSeconds = 100

            assert.equal(user.inactivityRequiresNoModal(), true)
            assert.equal(user.inactivityRequiresModal(), false)
            assert.equal(user.inactivityRequiresLogout(), false)
        })

        it('should require modal (130 seconds)', () => {
            user.inactiveSeconds = 130

            assert.equal(user.inactivityRequiresNoModal(), false)
            assert.equal(user.inactivityRequiresModal(), true)
            assert.equal(user.inactivityRequiresLogout(), false)
        })

        it('should require logout (610 seconds)', () => {
            user.inactiveSeconds = 610

            assert.equal(user.inactivityRequiresNoModal(), false)
            assert.equal(user.inactivityRequiresModal(), false)
            assert.equal(user.inactivityRequiresLogout(), true)
        })
    })
})