module.exports = app => {
  require("express-ws")(app);

  const usersTime = {};

  app.ws("/time", (ws, req) => {
    ws.on("message", (message = "") => {
      try {
        const data = JSON.parse(message);
        /**
                 * {
                 *  "id": 1,
                 *  "patientId": 874
                 * }
                 */
        if (data.constructor.name === "Object") {
          if (
            (!!Number(data.id) || Number(data.id) === 0) &&
            (!!Number(data.patientId) || Number(data.patientId) === 0)
          ) {
            //check that [id] and [patientId] are numbers
            const key = `${data.id}-${data.patientId}`;
            ws.key = key;
            if (data.message === "update") {
              usersTime[key] = usersTime[key] || {
                dates: [
                  {
                    start: new Date(),
                    end: null
                  }
                ],
                sockets: [],
                interval() {
                  return Math.floor(this.dates.map(date => {
                    return (date.end || new Date()) - date.start;
                  }).reduce((a, b) => a + b) / 1000);
                }
              };
              if (usersTime[key].sockets.indexOf(ws) < 0) {
                //add ws to client sockets list
                usersTime[key].sockets.push(ws);
              }
              ws.send(
                JSON.stringify({
                  seconds: usersTime[key].interval(),
                  clients: usersTime[key].sockets.length
                })
              );
            } else if (data.message === "stop") {
              const key = ws.key;
              usersTime[key].dates[usersTime[key].dates.length - 1].end = new Date();
              ws.clientState = "stopped";
              ws.send(
                JSON.stringify({
                  message: "ws stopped"
                })
              );
            } else if (data.message === "start") {
              const key = ws.key;
              usersTime[key].dates.push({
                start: new Date(),
                end: null
              });
              ws.clientState = null;
              ws.send(
                JSON.stringify({
                  message: "ws started"
                })
              );
            }
          } else {
            console.error("[data.id] is NaN", data.id);
          }
        } else {
          console.error("[data] is not an Object", data);
        }
      } catch (ex) {
        console.error("there was an error parsing", message);
      }
    });

    ws.on("close", ev => {
      const key = ws.key;
      if (key)
        usersTime[key].sockets.splice(usersTime[key].sockets.indexOf(ws), 1);
    });
  });

  setInterval(() => {
    for (const key in usersTime) {
      console.log(
        "sending message to ",
        usersTime[key].sockets.filter(
          socket => socket.clientState !== "stopped"
        ).length,
        " clients"
      );
      usersTime[key].sockets.forEach(socket => {
        if (socket.clientState != "stopped") {
          socket.send(
            JSON.stringify({
              seconds: usersTime[key].interval(),
              clients: usersTime[key].sockets.length
            })
          );
        }
      });
    }
  }, 3000);
};
