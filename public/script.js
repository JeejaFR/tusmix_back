const socket = io();

socket.on('message', (data) => {
  console.log(data);
  socket.emit('message', 'je suis connecté');
})