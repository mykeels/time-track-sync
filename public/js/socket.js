const socket = new WebSocket("ws://localhost:8888/time");
socket.onopen = () => {
  console.log("socket opening")
}
socket.onmessage = (ev) => {
  console.log(ev)
}
socket.onclose = (ev) => {
  console.log("connection closed", ev)
}