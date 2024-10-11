const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { Server } = require("socket.io");

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static("./public"));

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

const secretWord = "tusmo";

io.on("connection", (socket) => {
  console.log("Un joueur s'est connecté");

  socket.on("guess", (data) => {
    const guessedWord = data.word.toLowerCase();
    if (guessedWord === secretWord) {
      io.emit("guessResult", { result: "Correct ! Vous avez trouvé le mot." });
    } else {
      io.emit("guessResult", { result: "Faux ! Essayez encore." });
    }
  });

  socket.on("disconnect", () => {
    console.log("Un joueur s'est déconnecté");
  });
});

server.listen(4000, () => {
  console.log("server running at http://localhost:4000");
});
