const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { Server } = require("socket.io");
const socketHandler = require("./api/lobbySocket");
const cors = require('cors');
const fs = require("fs");

const app = express();


app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

const server = createServer(app);
const io = new Server(4001, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

socketHandler(io);

app.use(express.static("./public"));


app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

server.listen(4000, () => {
  console.log("server running at http://localhost:4000");
});
