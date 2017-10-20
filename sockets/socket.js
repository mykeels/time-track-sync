module.exports = (app) => {
    require('express-ws')(app)

    app.ws('/time', (ws, req) => {
        const usersTime = {}

        ws.on('message', (message = '') => {
            try {
                const data = JSON.parse(message)
                /**
                 * {
                 *  "id": 1
                 * }
                 */
                if (data.constructor.name === 'Object') {
                    if (!!Number(data.id)) { //check that [id] is a number
                        usersTime[Number(data.id)] = (usersTime[Number(data.id)] || 0) + 10 
                        ws.send(usersTime[Number(data.id)])
                    }
                    else {
                        console.error("[data.id] is NaN", data.id)
                    }
                }
                else {
                    console.error('[data] is not an Object', data)
                }
            }
            catch (ex) {
                console.error("there was an error parsing", message)
            }
            //console.log(message);
        })
    })
}