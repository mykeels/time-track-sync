/// <reference path="./app.config.js" />
/// <reference path="./socket.js" />
/// <reference path="./time-display.js" />
/// <reference path="./time-tracker.js" />
/// <reference path="./inactivity-tracker.js" />

const app = new Vue({
    el: '.clock',
    data: {
        seconds: 0
    },
    components: { 
        'time-tracker': TimeTracker,
        'inactivity-tracker': InactivityTracker,
        'time-display': TimeDisplay
    },
    mounted() {
        const userId = Number(baseValue('user-id')) || 0
        this.$on('log-time', () => socket.send(JSON.stringify({ id: userId, message: 'update' })))

        socket.onmessage = (message) => {
            if (!!Number(message.data)) {
                this.seconds = Number(message.data);
                
            }
            console.log(message)
        }

        socket.onopen = () => socket.send(JSON.stringify({ id: userId, message: 'refresh' }))
    }
});

