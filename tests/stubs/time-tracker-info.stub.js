function TimeTrackerInfo (options = {}) {

    this.key = options.key || '1-1'

    this.totalTime = (typeof(options.totalTime) != 'undefined') ? options.totalTime : 339

    this.wsUrl = options.wsUrl || 'ws://localhost:3000/time'

    this.programId = options.programId || '8'

    this.urlFull = options.urlFull || 'http://localhost:8888/'

    this.urlShort = options.urlShort || '/'

    this.ipAddr = options.ipAddr || '127.0.0.1'

    this.activity = options.activity || 'Notes/Offline Activities Review'

    this.title = options.title || 'home-page'

    this.submitUrl = options.submitUrl || 'http://localhost:8888/submit'

    this.startTime = options.startTime || '2019-05-03 04:01:10'

    this.disabled = options.disabled || false

    this.initSeconds = options.initSeconds || 0

    this.createKey = function () {
        return this.key
    }

}



module.exports = TimeTrackerInfo