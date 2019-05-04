/// <reference path="../event-bus.js" />

const Modal = Vue.component('modal', {
    data() {
        return {
            title: '',
            body: '',
            footer: '',
            show: false
        }
    },
    methods: {
        close(ev) {
            this.show = false;
            if (ev) EventBus.$emit('modal:close:event')
        }
    },
    computed: {
        
    },
    mounted() {
        EventBus.$on('modal:show', (modal) => {
            this.title = modal.title || '';
            this.body = modal.body || '';
            this.footer = modal.footer || '';
            this.show = true;
        })

        EventBus.$on('modal:close', () => {
            this.close()
        })
    }
})