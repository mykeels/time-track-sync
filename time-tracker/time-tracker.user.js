const { EventEmitter } = require('events')
const { validateInfo, createActivity } = require('./utils.fn')
const { DEFAULT_ALERT_TIMEOUT, DEFAULT_LOGOUT_TIMEOUT } = require('./constants')

function TimeTrackerUser(info, $emitter = new EventEmitter()) {
    
    validateInfo(info)

    const key = info.key
    
    const validateWebSocket = (ws) => {
        if (!ws) throw new Error('[ws] must be a valid WebSocket instance')
    }

    const user = {
        key: key,
        inactiveSeconds: 0, //inactive time in seconds
        activities: [],
        url: info.submitUrl,
        programId: info.programId,
        ipAddr: info.ipAddr,
        totalTime: (Number(info.totalTime) || 0),
        isLoggingOut: null,

        /**
         * @returns {Number} total duration in seconds of activities excluding initial-total-time
         */
        get totalDuration() {
            return this.activities.reduce((a, b) => a + b.duration, 0)
        },
        /**
         * @returns {Number} total duration in seconds of activities plus initial-total-time
         */
        get totalSeconds() {
            return this.totalDuration + this.totalTime
        },
        /**
         * @returns {Array} list of all sockets in all activities belongs to this user
         */
        get allSockets() {
            return this.activities.map(activity => activity.sockets).reduce((a, b) => a.concat(b), [])
        },
        /**
         * 
         * @param {any} data JSON or string you want to send via web sockets
         * @param {*} socket WebSocket instance you want to exclude from broadcast
         */
        broadcast (data, socket) {
            this.allSockets.forEach(ws => {
                const shouldSend = socket ? (socket !== ws) : true // if socket arg is specified, don't send to that socket
                if (ws.readyState === ws.OPEN && shouldSend) {
                    ws.send(JSON.stringify(data))
                }
            })
        },
        inactivityRequiresNoModal () {
            return this.inactiveSeconds < this.ALERT_TIMEOUT
        },
        inactivityRequiresModal () {
            return !this.inactivityRequiresNoModal() && this.inactiveSeconds < this.LOGOUT_TIMEOUT
        },
        inactivityRequiresLogout () {
            return !this.inactivityRequiresModal() && !this.inactivityRequiresNoModal()
        },
        ALERT_TIMEOUT: info.DEFAULT_ALERT_TIMEOUT || DEFAULT_ALERT_TIMEOUT,
        LOGOUT_TIMEOUT: info.DEFAULT_LOGOUT_TIMEOUT || DEFAULT_LOGOUT_TIMEOUT,
        overrideTimeouts (options = {}) {
            this.ALERT_TIMEOUT = Math.ceil(options.alertTimeout) || this.ALERT_TIMEOUT;
            this.LOGOUT_TIMEOUT = Math.ceil(options.logoutTimeout) || this.LOGOUT_TIMEOUT;
        }
    }

    /**
     * 
     * @param {{ activity: '' }} info 
     */
    user.findActivity = (info) => {
        return user.activities.find(item => item.name == info.activity)
    }

    user.start = (info, ws) => {
        /**
         * to be executed when a page is opened
         */
        validateInfo(info)
        validateWebSocket(ws)
        user.totalTime = Math.max(user.totalTime, Number(info.totalTime))
        user.enter(info, ws)
        ws.key = info.key
        let activity = user.findActivity(info)
        if (!!Number(info.initSeconds) && user.allSockets.length <= 1 && activity) {
            /**
             * make sure the page load time is taken into account
             */
            activity.duration += info.initSeconds
        }
    }

    user.enter = (info, ws) => {
        /*
         * to be executed on client:enter when the client focuses on a page
         */
        validateInfo(info)
        validateWebSocket(ws)
        let activity = user.findActivity(info)
        if (!activity) {
            activity = createActivity(info)
            activity.sockets.push(ws)
            user.activities.push(activity)
        }
        else if (activity) {
            if (activity.sockets.indexOf(ws) < 0) {
                activity.sockets.push(ws)
            }
        }

        /**
         * check inactive seconds
         */
        if (user.inactiveSeconds) {
            if (user.inactivityRequiresNoModal()) {
                user.handleNoModal(info)
            }
            else if (user.inactivityRequiresModal()) {
                if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ message: 'server:modal' }))
            }
            else {
                user.respondToModal(false, info)
                user.logout()
            }
        }
        ws.active = true
    }

    /**
     * general logout
     */
    user.logout = () => {
        user.isLoggingOut = true
        user.allSockets.forEach(socket => {
            if (socket.readyState === socket.OPEN) {
                socket.send(JSON.stringify({ message: 'server:logout' }))
            }
        })
    }

    /**
     * logout because of mouse and keyboard inactivity while on client page
     * removes about 90 seconds from the duration
     */
    user.clientInactivityLogout = () => {
        if (!user.isLoggingOut) {
            user.removeInactiveDuration(info)
        }
        user.logout()
    }

    user.closeAllModals = () => {
        /**
         * inform all clients to close their open inactivity-modal
         */
        user.allSockets.forEach(socket => {
            if (socket.readyState === socket.OPEN) {
                socket.send(JSON.stringify({ message: 'server:inactive-modal:close' }))
            }
        })
    }
    
    user.leave = (ws) => {
        /**
         * to be executed on client:leave when the client page loses focus
         */
        validateWebSocket(ws)
        ws.active = false
    }

    user.exit = (ws) => {
        /**
         * to be executed on ws:close when a WebSocket connection closes
         */
        user.activities.forEach(activity => {
            const index = activity.sockets.findIndex(socket => socket === ws)
            if (index >= 0) {
                activity.sockets.splice(index, 1)
            }
        })
    }

    user.sync = (socket) => {
        user.allSockets.forEach(ws => {
            const shouldSend = socket ? (socket !== ws) : true // if socket arg is specified, don't send to that socket
            if (ws.readyState === ws.OPEN && shouldSend) {
                ws.send(JSON.stringify({ message: 'server:sync', seconds: user.totalSeconds }))
            }
        })
    }

    user.handleNoModal = (info) => {
        let activity = user.findActivity(info)
        if (activity) {
            activity.duration += user.inactiveSeconds
        }
        user.inactiveSeconds = 0
    }

    /**
     * 
     * @param {boolean} response yes/no on whether the user was busy on something important during calculated inactive-time
     */
    user.respondToModal = (response, info) => {
        let activity = user.findActivity(info)
        if (activity) {
            if (response) {
                activity.duration += user.inactiveSeconds
            }
            else {
                activity.duration += 30
            }
        }
        user.inactiveSeconds = 0
    }
    
    user.showInactiveModal = (info, now = () => (new Date())) => {
        let activity = user.findActivity(info)
        if (activity) {
            activity.isInActiveModalShown = true
            activity.inactiveModalShowTime = now()
        }
    } 
    
    user.closeInactiveModal = (info, response, now = () => (new Date())) => {
        let activity = user.findActivity(info)
        if (activity && activity.inactiveModalShowTime) {
            activity.isInActiveModalShown = false
            const elapsedSeconds = (new Date(now() - activity.inactiveModalShowTime)).getSeconds()
            if (response) {
                activity.duration += elapsedSeconds
            }
            else {
                user.removeInactiveDuration(info)
            }
            activity.inactiveModalShowTime = null
        }
        user.inactiveSeconds = 0
    }

    user.removeInactiveDuration = (info) => {
        let activity = user.findActivity(info)
        if (activity) {
            activity.duration = Math.max((activity.duration - (user.ALERT_TIMEOUT - 30)), 30)
        }
    }

    user.close = () => {
        /**
         * to be executed when all sockets have closed
         */
        user.inactiveSeconds = 0
        // user.totalTime += user.activities.reduce((a, b) => a + b.duration, 0)
        user.totalTime = 0
        user.activities.forEach(activity => {
            activity.duration = 0
        })
        user.isLoggingOut = null
    }

    user.report = () => ({
        seconds: user.totalSeconds,
        startTime: user.totalTime,
        activities: user.activities.map(activity => ({
            name: activity.name,
            title: activity.title,
            duration: activity.duration,
            url: activity.url,
            url_short: activity.url_short,
            start_time: activity.start_time
        })),
        key: user.key
    })

    return user
}

module.exports = TimeTrackerUser