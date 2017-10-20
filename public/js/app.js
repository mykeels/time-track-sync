/// <reference path="./app.config.js" />
/// <reference path="./socket.js" />
/// <reference path="./time-tracker.js" />
/// <reference path="./inactivity-tracker.js" />

const app = new Vue({
    el: '.clock',
    components: { 
        'time-tracker': TimeTracker,
        'inactivity-tracker': InactivityTracker
    },
    mounted() {
        const userId = Number(baseValue('user-id')) || 0
        this.$on('log-time', () => socket.send(JSON.stringify({ id: userId })))
    }
});

(function (window, app) {
    window.onfocus = function () {
        app.$emit('start');
        app.$emit('reset');
    }
    
    window.onblur = function () {
        app.$emit('stop');
    }
    
    window.onkeydown = window.onmousemove = 
    window.onwheel = window.onmousewheel = 
    window.onmousedown = window.onkeyup = function () {
        app.$emit('reset');
    }
})(window, app)

