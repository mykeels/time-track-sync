module.exports = (app) => {
    require('express-ws')(app)

    app.ws('/', (ws, req) => {
        ws.on('message', (message) => {
            console.log(message);
        })
    })
}