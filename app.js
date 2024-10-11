const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { Server } = require("socket.io");
const fs = require("fs");

const app = express();
const server = createServer(app);
const io = new Server(server);

const words = fs
  .readFileSync("dictionnaire.txt", "utf-8")
  .split("\n")
  .map((word) => word.trim());

function getRandomWord() {
  const randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex];
}

let secretWord = getRandomWord();
console.log("Mot secret choisi:", secretWord);

app.use(express.static("./public"));

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

const players = {};

io.on("connection", (socket) => {
  console.log("Un joueur s'est connecté");

  players[socket.id] = {
    attempts: 0,
    correctLetters: Array(secretWord.length).fill("_"),
  };

  socket.emit("wordLength", { length: secretWord.length });

  socket.on("guess", (data) => {
    const guessedWord = data.word.toLowerCase();
    const player = players[socket.id];

    if (!words.includes(guessedWord)) {
      socket.emit("guessResult", {
        result: "Le mot n'existe pas dans le dictionnaire.",
      });
      return;
    }

    if (player.attempts >= 6) {
      socket.emit("guessResult", {
        result: "Vous avez déjà atteint le nombre maximum d'essais.",
      });
      return;
    }

    player.attempts++;

    for (let i = 0; i < guessedWord.length; i++) {
      if (guessedWord[i] === secretWord[i]) {
        player.correctLetters[i] = guessedWord[i];
      } else if (secretWord.includes(guessedWord[i])) {
        if (player.correctLetters[i] === "_") {
          player.correctLetters[i] = guessedWord[i];
        }
      }
    }

    if (guessedWord === secretWord) {
      io.emit("guessResult", { result: "Correct ! Vous avez trouvé le mot." });
      secretWord = getRandomWord();
      console.log("Nouveau mot secret choisi:", secretWord);
      for (const id in players) {
        players[id].attempts = 0;
        players[id].correctLetters = Array(secretWord.length).fill("_");
      }
    } else {
      socket.emit("guessResult", {
        result: `Faux ! Lettres trouvées : ${player.correctLetters.join(
          " "
        )}, Essais restants : ${6 - player.attempts}`,
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("Un joueur s'est déconnecté");
    delete players[socket.id];
  });
});

server.listen(4000, () => {
  console.log("server running at http://localhost:4000");
});
