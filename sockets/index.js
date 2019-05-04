const colors = require('../utils/colors')

module.exports = app => {
  require('express-ws')(app);

  const TimeTracker = require('../time-tracker')
  const TimeTrackerUser = TimeTracker.TimeTrackerUser

  const axios = require('axios')

  const $emitter = require('./sockets.events')

  const timeTracker = new TimeTracker($emitter)
  const timeTrackerNoLiveCount = new TimeTracker($emitter)

  app.timeTracker = timeTracker
  app.timeTrackerNoLiveCount = timeTrackerNoLiveCount
  app.getTimeTracker = (info) => {
    if (info && info.noLiveCount) return timeTrackerNoLiveCount
    else return timeTracker
  }

  const wsErrorHandler = function (err) {
    if (err) console.error("ws-error", err)
  }

  const errorThrow = (err, ws) => {
    console.error(err)
    if (ws) {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({
          error: err
        }), wsErrorHandler)
      }
    }
  }

  app.ws('/events', (ws, req) => {
    try {
      $emitter.emit('socket:add', ws)

      ws.on('close', () => {
        $emitter.emit('socket:remove', ws)
      })
    }
    catch (ex) {
      errorThrow(ex, ws);
    }
  })

  app.ws('/time', (ws, req) => {
    ws.on('message', (message = '') => {
      try {
        const data = JSON.parse(message);
        /**
         * Sample structure of [data] object
         * {
         *  'message': 'client:start'
         *  'info': { ... }
         * }
         */
        if (data.constructor.name === 'Object') {
          if (data.info || data.message === 'PING') {
            if (data.message === 'client:start') {
              try {
                const info = data.info
                const user = app.getTimeTracker(info).get(info)
                user.start(info, ws)
                user.sync()
              }
              catch (ex) {
                errorThrow(ex, ws)
                return;
              }
            } 
            else if (data.message === 'client:leave') {
              try {
                const info = data.info
                const user = app.getTimeTracker(info).get(info)
                user.leave(ws)
              }
              catch (ex) {
                errorThrow(ex, ws)
                return;
              }
            }
            else if (data.message === 'client:enter') {
              try {
                const info = data.info
                const user = app.getTimeTracker(info).get(info)
                user.enter(info, ws)
                user.sync()
              }
              catch (ex) {
                errorThrow(ex, ws)
                return;
              }
            }
            else if (data.message === 'client:modal') {
              try {
                const info = data.info
                const user = app.getTimeTracker(info).get(info)
                user.respondToModal(!!data.response, info)

              }
              catch (ex) {
                errorThrow(ex, ws)
                return;
              }
            }
            else if (data.message === 'client:inactive-modal:show') {
              try {
                const info = data.info
                const user = app.getTimeTracker(info).get(info)
                user.showInactiveModal(info)
                user.broadcast({ message: 'server:inactive-modal:show' }, ws)
              }
              catch (ex) {
                errorThrow(ex, ws)
                return;
              }
            }
            else if (data.message === 'client:inactive-modal:close') {
              try {
                const info = data.info
                const user = app.getTimeTracker(info).get(info)
                user.closeInactiveModal(info, !!data.response)
                user.sync()
                user.broadcast({ message: 'server:inactive-modal:close' }, ws)
              }
              catch (ex) {
                errorThrow(ex, ws)
                return;
              }
            }
            else if (data.message === 'client:timeouts:override') {
              try {
                const info = data.info
                const timeouts = data.timeouts || {}
                const user = app.getTimeTracker(info).get(info)
                user.overrideTimeouts(timeouts)
              }
              catch (ex) {
                errorThrow(ex, ws)
                return;
              }
            }
            else if (data.message === 'client:logout') {
              try {
                const info = data.info
                const user = app.getTimeTracker(info).get(info)
                user.clientInactivityLogout()
              }
              catch (ex) {
                errorThrow(ex, ws)
                return;
              }
            }
            else if (data.message === 'PING') {

            }
            else {
              errorThrow(new Error('invalid message'), ws)
            }
          } 
          else {
            errorThrow('[data.info] must be a valid Object', ws);
          }
        } 
        else {
          errorThrow('[data] must be a valid Object', ws);
        }
      } catch (ex) {
        errorThrow(ex, ws);
      } 
    }); 
 
    ws.on('close', ev => {
      const keyInfo = { key: ws.key }
      const user = timeTracker.exists(keyInfo) ? timeTracker.get(keyInfo) :
                  (timeTrackerNoLiveCount.exists(keyInfo) ? timeTrackerNoLiveCount.get(keyInfo) : null)
      if (user) {
        user.exit(ws)
        if (user.allSockets.length == 0) {
          //no active sessions
          const url = user.url
          
          const requestData = {
            key: user.key,
            ipAddr: user.ipAddr,
            programId: user.programId,
            activities: user.activities.filter(activity => activity.duration > 0).map(activity => ({
              name: activity.name,
              title: activity.title,
              duration: activity.duration,
              url: activity.url,
              url_short: activity.url_short,
              start_time: activity.start_time
            }))
          }

          if (url) {
            axios.post(url, requestData).then((response) => {
              console.log(response.status, response.data, requestData.key, requestData.activities.map(activity => activity.duration).join(', '))
            }).catch((err) => {
              console.error(err)
            })
          }
          else {
            console.log(requestData.key, requestData.activities.map(activity => activity.duration).join(', '))
          }

          $emitter.emit('socket:server:logout', requestData)

          user.close()
          console.log(user.report())
        }
      }
    });
  }); 

  setInterval(() => {
    for (const user of [...timeTracker.users(), ...timeTrackerNoLiveCount.users()]) {
      user.activities.forEach(activity => {
        if (activity.isActive && !activity.isInActiveModalShown) {
          activity.duration += 1;
        }
      })

      if (!user.noLiveCount && user.allSockets.length > 0 && user.allSockets.every(ws => !ws.active)) {
        user.inactiveSeconds += 1
      }

      if (!user.noLiveCount && process.env.NODE_ENV !== 'production') {
        console.log(
          'key:', user.key,
          'activities:', user.activities.filter(activity => activity.isActive).length, 
          'inactive-seconds:', user.inactiveSeconds,
          'durations:', user.activities.map(activity => (activity.isActive ? colors.FgGreen : colors.FgRed) + activity.duration + colors.Reset).join(', '),
          'sockets:', user.allSockets.length
        )
      }
    }
  }, 1000);
 
};

/**
 * restart process every day
 */

setTimeout(function () {
  process.exit(0)
}, 24 * 60 * 60 * 1000)