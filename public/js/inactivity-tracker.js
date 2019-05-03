const InactivityTracker = Vue.component("inactivity-tracker", {
  data() {
      return {
          startTime: new Date(),
          endTime: new Date(),
          isModalShown: false,
          ALERT_TIMEOUT: 60,
          LOGOUT_TIMEOUT: 120
      };
  },
  methods: {
      pad(num, count) {
          num = Math.floor(num);
          count = count || Number.POSITIVE_INFINITY;
          const $num = num + "";
          return "0".repeat((count - $num.length) || 0) + $num;
      },
      start() {
          if (this.interval) clearInterval(this.interval);
          this.interval = setInterval(
              function() {
                  this.endTime = new Date();
                  if (this.totalSeconds && 
                        !this.isModalShown && 
                        ((this.totalSeconds >= this.ALERT_TIMEOUT) && (this.totalSeconds < this.LOGOUT_TIMEOUT))
                     ) {
                      /**
                       * Stop Tracking Time
                       * Show Modal asking the user why he/she has been inactive
                       * 
                       * Disable the window.onfocus handler
                       */
                      this.windowFocusHandler = window.onfocus
                      window.onfocus = null;
                      EventBus.$emit("tracker:show-inactive-modal")
                      this.isModalShown = true
                  }
                  else if (this.totalSeconds && (this.totalSeconds >= this.LOGOUT_TIMEOUT)) {
                      /**
                       * Logout the user automatically
                       */
                      EventBus.$emit("tracker:logout")
                  }
              }.bind(this),
              1000
          );
      },
      stop() {
          clearInterval(this.interval);
      },
      reset(e) {
          if (!this.isModalShown) {
            this.startTime = this.endTime = new Date()
          }
          else console.warn('attempt to reset inactivity-tracker rebuffed because modal is active', this.time)
      }
  },
  computed: {
      elapsed() {
          return this.endTime - this.startTime;
      },
      hours() {
          return this.pad(Math.floor(this.elapsed / 1000 / 3600), 2);
      },
      minutes() {
          return this.pad(
              Math.floor((this.elapsed / 1000 - this.hours * 3600) / 60),
              2
          );
      },
      seconds() {
          return this.pad(
              this.elapsed / 1000 - this.minutes * 60 - this.hours * 3600,
              2
          );
      },
      totalSeconds() {
          return Math.floor(this.elapsed / 1000);
      },
      time() {
          return `${this.hours} : ${this.minutes} : ${this.seconds}`;
      }
  },
  mounted() {
      this.start();
      EventBus.$on("inactivity:reset", this.reset.bind(this));
      EventBus.$on("inactivity:stop", this.stop.bind(this));
      EventBus.$on("inactivity:start", this.start.bind(this));

      const modalCloseHandler = (preventEmit) => {
        this.isModalShown = false
        this.reset()
        console.log('modal closed')
        //restore the window.onfocus handler
        if (this.windowFocusHandler) window.onfocus = this.windowFocusHandler
    }

      EventBus.$on('modal:close', modalCloseHandler)
      EventBus.$on('modal:close:event', modalCloseHandler)

      EventBus.$on('modal-inactivity:reset', (preventEmit) => {
          this.reset()
          if (this.windowFocusHandler) window.onfocus = this.windowFocusHandler 
      })

      EventBus.$on('modal-inactivity:timeouts:override', (options = {}) => {
          try {
              this.ALERT_TIMEOUT = options.alertTimeout || this.ALERT_TIMEOUT
              this.LOGOUT_TIMEOUT = options.logoutTimeout || this.LOGOUT_TIMEOUT
              this.ALERT_TIMEOUT_CALL_MODE = options.alertTimeoutCallMode || this.ALERT_TIMEOUT_CALL_MODE
              this.LOGOUT_TIMEOUT_CALL_MODE = options.logoutTimeoutCallMode || this.LOGOUT_TIMEOUT_CALL_MODE

              EventBus.$emit('tracker:timeouts:override', {
                  alertTimeout: this.ALERT_TIMEOUT,
                  logoutTimeout: this.LOGOUT_TIMEOUT,
                  alertTimeoutCallMode: this.ALERT_TIMEOUT_CALL_MODE,
                  logoutTimeoutCallMode: this.LOGOUT_TIMEOUT_CALL_MODE
              })
          }
          catch (err) {
              console.error(err)
          }
      })
  }
});
