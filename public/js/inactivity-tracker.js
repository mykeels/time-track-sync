const InactivityTracker = Vue.component("inactivity-tracker", {
  data() {
    return {
      startTime: new Date(),
      endTime: new Date()
    };
  },
  methods: {
    pad(num, count) {
      num = Math.floor(num);
      count = count || Number.POSITIVE_INFINITY;
      const $num = num + "";
      return "0".repeat(count - $num.length) + $num;
    },
    start() {
      if (this.interval) clearInterval(this.interval);
      this.interval = setInterval(
        function() {
          this.endTime = new Date();
          const ALERT_INTERVAL = 10;
          if (this.seconds >= ALERT_INTERVAL) {
            this.stop();
            this.$parent.$emit("stop");
            alert(
              `${ALERT_INTERVAL} seconds have elapsed since your last activity`
            );
            this.start();
            this.reset();
          }
        }.bind(this),
        1000
      );
    },
    stop() {
      clearInterval(this.interval);
    },
    reset() {
      this.startTime = this.endTime;
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
    time() {
      return `${this.hours} : ${this.minutes} : ${this.seconds}`;
    }
  },
  mounted() {
    this.start();

    this.$parent.$on("reset", this.reset.bind(this));
    this.$parent.$on("stop", this.stop.bind(this));
    this.$parent.$on("start", this.start.bind(this));
  }
});
