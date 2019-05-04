const { EventEmitter } = require('events')

const eventSockets = []

const $emitter = new EventEmitter()

$emitter.on('socket:add', (socket) => {
    if (socket && socket.send) {
        if (!eventSockets.includes(socket)) {
            eventSockets.push(socket)
            console.log('events:', 'socket added')
        }
    }
})

$emitter.on('socket:remove', (socket) => {
    if (socket && socket.send) {
        eventSockets.splice(eventSockets.indexOf(socket), 1)
        console.log('events:', 'socket removed')
    }
})

$emitter.on('socket:server:logout', (data = {}) => {
    eventSockets.forEach(socket => {
        if (socket.readyState === socket.OPEN) {
            socket.send(JSON.stringify(Object.assign({ message: 'server:logout' }, data)))
            console.log('events:', 'socket:server:logout')
        }
    })
})

module.exports = $emitter