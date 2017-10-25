/// <reference path="./app.config.js" />
/// <reference path="./socket.js" />
/// <reference path="./time-display.js" />
/// <reference path="./comps/modal.vue.js" />
/// <reference path="./inactivity-tracker.js" />

const app = new Vue({
    el: '.clock',
    data: {
        seconds: 0,
        socket: null,
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
        },
        createSocket() {
            try {
                const self = this; //a way to keep the context
                this.socket = this.socket || (function () {
                    const socket = new WebSocket(`${location.origin.replace(/^https?/, 'ws')}/time`);
    
                    socket.onmessage = (message) => {
                        if (message.data) {
                            const data = JSON.parse(message.data)
                            if (!!Number(data.seconds))
                                self.seconds = Number(data.seconds)
                            console.log(data);
                        }
                    }
            
                    socket.onopen = (ev) => {
                        console.log("socket connection opened", ev)
                        self.updateTime()
                    }
            
                    socket.onclose = (ev) => {
                        console.warn("socket connection has closed", ev)
                        self.socket = null;
                        self.$emit("stop");

                        setTimeout(self.createSocket.bind(self), 3000);
                    }
    
                    return socket;
                })()
            }
            catch (ex) {
                console.error(ex);
            }
        }
    },
    mounted() {
        this.$on('tick', () => {
            this.seconds++;
            this.$forceUpdate()
        })

        this.$on('stop', () => {
            if (this.socket) this.socket.send(JSON.stringify({ id: this.userId, patientId: this.patientId, message: 'stop' }))
        })

        this.$on('start', () => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) 
                this.socket.send(JSON.stringify({ id: this.userId, patientId: this.patientId, message: 'start' }))
        })

        this.createSocket()
    }
});

