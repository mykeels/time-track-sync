function WebSocket() {
    this.messages = []
    this.send = function (data) {
        this.messages.push(data)
    }
    this.active = false
    this.OPEN = 1
    this.readyState = this.OPEN
}

module.exports = WebSocket