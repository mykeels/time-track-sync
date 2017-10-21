/// <reference path="./min/vue.min.js" />

const TimeDisplay = Vue.component('time-display', {
    props: ['seconds'],
    computed: {
        hours() {
            return this.pad(Math.floor(this.seconds / 3600), 2)
        },
        minutes() {
            return this.pad(Math.floor(this.seconds / 60), 2)
        },
        time() {
            return `${this.hours} : ${this.minutes} : ${this.pad(this.seconds % 60, 2)}`;
        }
    },
    methods: {
        pad (num, count) {
            count = count || 0;
            const $num = num + '';
            return '0'.repeat(count - $num.length) + $num;
        }
    }
})