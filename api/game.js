const fs = require("fs");

// Charger le dictionnaire de mots depuis un fichier
const words = fs
  .readFileSync("dictionnaire.txt", "utf-8")
  .split("\n")
  .map((word) => word.trim());

// Fonction pour obtenir un mot aléatoire
function getRandomWord() {
  const randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex];
}

// Définir le mot secret initial
let secretWord = getRandomWord();
console.log("secretWord: "+secretWord);

const players = {};

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Un joueur s'est connecté");

    // Envoie la longueur du mot au joueur
    socket.emit("wordLength", { length: secretWord.length });

    socket.on("guess", (roomCode, data) => {
      const guessedWord = data.word.toLowerCase();
      console.log("guessedWord: "+guessedWord);
      const player = players[socket.id] = {
        attempts: 0,
        correctLetters: Array(secretWord.length).fill("_"),
      };

      // Vérifier si le mot est correct ou non
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
        io.to(roomCode).emit("guessResult", { result: "Correct ! Vous avez trouvé le mot." });
        // Choisir un nouveau mot et réinitialiser les tentatives
        secretWord = getRandomWord();
        for (const id in players) {
          players[id].attempts = 0;
          players[id].correctLetters = Array(secretWord.length).fill("_");
        }
      } else {
        socket.emit("guessResult", {
          result: `Faux ! Lettres trouvées : ${player.correctLetters.join(" ")}, Essais restants : ${6 - player.attempts}`,
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("Un joueur s'est déconnecté");
      delete players[socket.id];
    });
  });
};
