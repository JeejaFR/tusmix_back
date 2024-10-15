const fs = require("fs");

const words = fs
  .readFileSync("dictionnaire.txt", "utf-8")
  .split("\n")
  .map((word) => word.trim())
  .map((word) => removeAccents(word.toUpperCase()));

function removeAccents(word) {
  return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function getRandomWord() {
  const randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex];
}

let secretWord = getRandomWord();
console.log("secretWord: " + secretWord);

const players = {};

module.exports = (io) => {
  io.on("connection", (socket) => {
    socket.emit("wordLength", { length: secretWord.length });

    socket.emit("wordFirstLetter", { firstLetter: secretWord[0] });

    socket.on("guess", (roomCode, word) => {
      const guessedWord = removeAccents(word.toUpperCase());
      console.log("guessedWord: " + guessedWord);
      console.log("roomCode: " + roomCode);

      const player = (players[socket.id] = {
        attempts: 0,
        correctLetters: Array(secretWord.length).fill("_"),
      });

      if (!words.includes(guessedWord)) {
        socket.emit("guessResult", {
          result: "Le mot n'existe pas dans le dictionnaire.",
        });
        return;
      }

      if (player.attempts >= 5) {
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
        socket.emit("guessResult", {
          result: "Correct ! Vous avez trouvé le mot.",
        });

        secretWord = getRandomWord();
        console.log("Nouveau mot secret: " + secretWord);

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
      delete players[socket.id];
    });
  });
};
