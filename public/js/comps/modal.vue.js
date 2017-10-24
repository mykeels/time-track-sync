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
        close() {
            this.show = false;
        }
    },
    computed: {
        
    },
    mounted() {
        this.$parent.$on('modal:show', (modal) => {
            this.title = modal.title || '';
            this.body = modal.body || '';
            this.footer = modal.footer || '';
            this.show = true;
        })
    }
})