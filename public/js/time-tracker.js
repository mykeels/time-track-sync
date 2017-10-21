const TimeTracker = Vue.component('time-tracker', {
    data() {
        return {
            count: 0
        }
    },
    methods: {
        pad (num, count) {
            count = count || Number.POSITIVE_INFINITY;
            const $num = num + '';
            return '0'.repeat(count - $num.length) + $num;
        },
        start() {
            const STEP = 1000

            if (this.interval) clearInterval(this.interval);
            this.interval = setInterval((function () {
                this.count++;
                console.log('tick')
                if (this.count % 10 === 0) this.$parent.$emit('log-time')
            }).bind(this), STEP)
        },
        stop() {
            clearInterval(this.interval)
        }
    },
    computed: {
        hours() {
            return this.pad(Math.floor(this.count / 3600), 2)
        },
        minutes() {
            return this.pad(Math.floor((this.count - (this.hours * 3600)) / 60), 2)
        },
        seconds() {
            return this.pad(this.count - (this.minutes * 60) - (this.hours * 3600), 2)
        },
        time() {
            return `${this.hours} : ${this.minutes} : ${this.seconds}`;
        }
    },
    mounted() {
        //this.start()

        this.$parent.$on('start', this.start.bind(this));
        this.$parent.$on('stop', this.stop.bind(this));
    }
})