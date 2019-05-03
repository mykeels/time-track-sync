const assert = require('chai').assert

const TimeTracker = require('../time-tracker')
const TimeTrackerUser = TimeTracker.TimeTrackerUser

const WebSocket = require('./stubs/ws.stub')

const TimeTrackerInfo = require('./stubs/time-tracker-info.stub')
const info = new TimeTrackerInfo({ totalTime: 0 })
const key = (new TimeTrackerInfo()).createKey()
const ws = new WebSocket()
const { addSeconds } = require('../time-tracker/utils.fn')

module.exports = {
    assert,
    TimeTracker,
    TimeTrackerUser,
    TimeTrackerInfo,
    WebSocket,
    info,
    key,
    ws,
    addSeconds
}