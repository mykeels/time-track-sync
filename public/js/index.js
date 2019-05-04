/// <reference path="./app.config.js" />
/// <reference path="./time-display.js" />
/// <reference path="./comps/modal.vue.js" />
/// <reference path="./inactivity-tracker.js" />
/// <reference path="./window-startup-time.js" />

const baseKeyElem = document.querySelector('base[name="key"]')
const baseKey = baseKeyElem && baseKeyElem.getAttribute('value') 

const app = new Vue({
    el: 'div.container',
    data: {
        info: {
            wsUrl: `${location.origin.replace(/^https?/, 'ws')}/time`,
            key: baseKey || '1',
            totalTime: 0,
            urlFull: 'http://localhost:8888',
            activity: 'home-page',
            activity: 'Home Page',
        },
        seconds: 0,/** from when page loads, till the page ends */
        visible: false,
        socket: null,
        startCount: 0,
        showTimer: true,
        showLoader: true,
        noLiveCount: 0,
        className: '',
        hideTracker: false,
        overrideTimeout: false
    },
    components: { 
        'inactivity-tracker': InactivityTracker,
        'time-display': TimeDisplay,
    },
    computed: {
        totalTime() {
            return this.seconds
        }
    },
    methods: {
        updateTime() {
            if (this.info.initSeconds == 0) this.info.initSeconds = Math.ceil(windowStartupTime() / 1000)
            else this.info.initSeconds = -1
            this.startCount += 1;
            console.log('tracker:init-seconds', this.info.initSeconds)
            if (this.socket.readyState === this.socket.OPEN) {
                this.socket.send(
                    JSON.stringify({ 
                        message: 'client:start', 
                        info: this.info
                    })
                )
            }
        },
        createSocket() {
            try {
                const self = this; //a way to keep the context
                self.socketReloadCount = (self.socketReloadCount || 0) + 1;
                this.socket = this.socket || (function () {
                    const socket = new WebSocket(self.info.wsUrl);
    
                    socket.onmessage = (res) => {
                        if (res.data) {
                            const data = JSON.parse(res.data)
                            if (data.message === 'server:sync') {
                                self.seconds = data.seconds
                                self.visible = true //display the component when the previousSeconds value has been received from the server to keep the display up-to-date
                                self.showLoader = false
                            }
                            else if (data.message === 'server:modal') {
                                EventBus.$emit('tracker:show-inactive-modal')
                            }
                            else if (data.message === 'server:logout') {
                                EventBus.$emit("tracker:stop")
                                location.href = rootUrl('logout')
                            }
                            else if (data.message === 'server:inactive-modal:close') {
                                EventBus.$emit('modal:close')
                            }
                            else if (data.message === 'server:inactive-modal:show') {
                                EventBus.$emit('modal:show', {
                                    title: 'You\'ve been inactive',
                                    body: 'Are you still here?'
                                })
                            }
                            console.log(data);
                        }
                    }
            
                    socket.onopen = (ev) => {
                        if (EventBus.isInFocus) {
                            self.updateTime()
                        }
                        else {
                            self.startCount = 0;
                        }
                        console.log("socket connection opened", ev, self.startCount, EventBus.isInFocus)
                        if (EventBus.isInFocus) EventBus.$emit('tracker:start')
                    }
            
                    socket.onclose = (ev) => {
                        console.warn("socket connection has closed", ev)
                        self.socket = null;
                        EventBus.$emit("tracker:stop");
                        self.startCount = 0;
                        self.info.initSeconds = self.seconds
                        console.log(self.info.totalTime, self.seconds)

                        setTimeout(self.createSocket.bind(self), 3000);
                    }

                    socket.onerror = (err) => {
                        console.error('socket-error:', err)
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
        this.previousSeconds = this.info.totalTime || 0;
        this.info.initSeconds = 0

        if (this.info.disabled || !this.info.wsUrl) {
            this.visible = false;
        }
        else {
            EventBus.isInFocus = true;

            EventBus.$on('tracker:tick', () => {
                this.seconds++;
                this.$forceUpdate()
            })

            const STATE = {
                LEAVE: 'client:leave',
                ENTER: 'client:enter',
                INACTIVITY_CANCEL: 'inactivity-cancel',
                MODAL_RESPONSE: 'client:modal',
                SHOW_INACTIVE_MODAL: 'client:inactive-modal:show',
                CLOSE_INACTIVE_MODAL: 'client:inactive-modal:close',
                LOGOUT: 'client:logout',
                TIMEOUTS_OVERRIDE: 'client:timeouts:override'
            }

            EventBus.$on('tracker:start', () => {
                if (this.state !== STATE.SHOW_INACTIVE_MODAL) {
                    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                        if (this.startCount === 0) this.updateTime();
                        this.state = STATE.ENTER
                        this.socket.send(JSON.stringify({ message: STATE.ENTER, info: this.info }))
                    }
                }
            })

            EventBus.$on('tracker:stop', () => {
                if (this.state !== STATE.SHOW_INACTIVE_MODAL) {
                    if (this.socket) {
                        this.showTimer = false
                        this.state = STATE.LEAVE;
                        this.socket.send(JSON.stringify({ message: STATE.LEAVE, info: this.info }))
                    }
                    this.showLoader = true
                }
            })

            EventBus.$on('tracker:hide-inactive-modal', () => {
                /** does the same as tracker:start without the conditional */
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    if (this.startCount === 0) this.updateTime();
                    this.state = STATE.ENTER
                    this.socket.send(JSON.stringify({ message: STATE.ENTER, info: this.info }))
                }

                EventBus.$emit('modal:close')
            })

            EventBus.$on('modal:close:event', () => {
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    this.state = STATE.CLOSE_INACTIVE_MODAL
                    this.socket.send(JSON.stringify({ message: STATE.CLOSE_INACTIVE_MODAL, info: this.info }))
                }
            })

            EventBus.$on('tracker:show-inactive-modal', () => {
                if (this.socket) {
                    this.showTimer = false
                    this.state = STATE.SHOW_INACTIVE_MODAL;
                    this.socket.send(JSON.stringify({ message: STATE.SHOW_INACTIVE_MODAL, info: this.info }))
                }
                this.showLoader = true

                EventBus.$emit('modal:show', {
                    title: 'You\'ve been inactive',
                    body: 'Are you still here?'
                })
            })

            EventBus.$on('tracker:modal:reply', (response) => {
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    this.socket.send(JSON.stringify({ message: STATE.MODAL_RESPONSE, info: this.info, response }))
                }
            })

            EventBus.$on('tracker:inactive-modal:close', (response) => {
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    this.socket.send(JSON.stringify({ message: STATE.CLOSE_INACTIVE_MODAL, info: this.info, response }))
                }
            })

            EventBus.$on('tracker:timeouts:override', (timeouts = {}) => {
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    this.socket.send(JSON.stringify({ message: STATE.TIMEOUTS_OVERRIDE, info: this.info, timeouts }))
                }
            })

            EventBus.$on('tracker:logout', () => {
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    this.socket.send(JSON.stringify({ message: STATE.LOGOUT, info: this.info }))
                }
            })

            this.createSocket()

            setInterval(() => {
                if (this.socket.readyState === this.socket.OPEN) {
                    this.socket.send(JSON.stringify({ message: 'PING' }))
                }
            }, 5000)
        }
    }
});

