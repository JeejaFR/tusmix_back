const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static('./public'));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  console.log('a user connected: '+socket.id);
  io.emit('message', 'Salut mon boeuf');

  socket.on('message', (data) => {
    console.log(data);
  })
});

server.listen(4000, () => {
  console.log('server running at http://localhost:4000');
});