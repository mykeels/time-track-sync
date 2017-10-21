module.exports = (app) => {
    require('express-ws')(app)

    const usersTime = {}

    app.ws('/time', (ws, req) => {
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
                        if (data.message === 'update') {
                            usersTime[Number(data.id)] = (usersTime[Number(data.id)] || 0) + 10 
                            ws.send(usersTime[Number(data.id)])
                        }
                        else if (data.message === 'refresh') {
                            ws.send(usersTime[Number(data.id)])
                        }
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