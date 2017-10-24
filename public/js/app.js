/// <reference path="./app.config.js" />
/// <reference path="./socket.js" />
/// <reference path="./time-display.js" />
/// <reference path="./comps/modal.vue.js" />
/// <reference path="./inactivity-tracker.js" />

const app = new Vue({
    el: '.clock',
    data: {
        seconds: 0,
        socket: socket,
        userId: Number(baseValue('user-id')) || 0,
        patientId: Number(baseValue('patient-id')) || 0
    },
    components: { 
        'inactivity-tracker': InactivityTracker,
        'time-display': TimeDisplay,
        'modal': Modal
    },
    methods: {
        updateTime() {
            this.socket.send(JSON.stringify({ id: this.userId, patientId: this.patientId, message: 'update' }));
        }
    },
    mounted() {
        //this.$on('log-time', () => this.updateTime())
        this.$on('tick', () => {
            this.seconds++;
        })
        socket.onmessage = (message) => {
            if (message.data) {
                const data = JSON.parse(message.data)
                this.seconds = Number(data.seconds)
                console.log(data);
            }
        }

        socket.onopen = () => this.updateTime()

        socket.onclose = (ev) => {
            console.warn("socket connection has closed", ev)
        }
    }
});

