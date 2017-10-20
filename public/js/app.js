const app = new Vue({
    el: '.clock',
    components: { 
        'time-tracker': TimeTracker,
        'inactivity-tracker': InactivityTracker
    }
})

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

