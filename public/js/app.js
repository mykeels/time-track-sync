/// <reference path="./app.config.js" />
/// <reference path="./socket.js" />
/// <reference path="./time-display.js" />
/// <reference path="./time-tracker.js" />
/// <reference path="./inactivity-tracker.js" />

const app = new Vue({
    el: '.clock',
    data: {
        seconds: 0,
        untrackedSeconds: 0,
        socket: socket,
        userId: Number(baseValue('user-id')) || 0
    },
    components: { 
        'time-tracker': TimeTracker,
        'inactivity-tracker': InactivityTracker,
        'time-display': TimeDisplay
    },
    methods: {
        updateTime() {
            this.socket.send(JSON.stringify({ id: this.userId, message: 'update' }));
            this.untrackedSeconds = 0; //reset untracked seconds;
        },
        updateUntrackedSeconds() {
            this.socket.send(JSON.stringify({ id: this.userId, message: 'update', seconds: this.untrackedSeconds }));
            this.untrackedSeconds = 0; //reset untracked seconds;
            this.$emit('sync-untracked-seconds')
        },
        refreshTime() {
            if (socket.readyState == socket.OPEN) this.socket.send(JSON.stringify({ id: this.userId, message: 'refresh' }))
            else console.log("socket is in CONNECTING state")
        }
    },
    mounted() {
        this.$on('log-time', () => this.updateTime())
        this.$on('tick', () => {
            this.untrackedSeconds++;
        })

        socket.onmessage = (message) => {
            if (!!Number(message.data)) {
                this.seconds = Number(message.data);
            }
        }

        socket.onopen = () => this.refreshTime()

        socket.onclose = (ev) => {
            console.warn("socket connection has closed", ev)
        }
    }
});

