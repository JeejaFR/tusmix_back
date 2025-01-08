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
console.log("secretWord: " + secretWord);

const players = {};

module.exports = (io) => {
  io.on("connection", (socket) => {
    // console.log("Un joueur s'est connecté");

    socket.on("joinGame", (room) => {
      console.log("utilisateur essaye de se connecter: "+ room.roomCode);

      // Vérifier si le joueur est bien dans la bonne room
      if (socket.rooms.has(room.roomCode)) {
        console.log("utilisateur connecté à la game: "+room.roomCode);
        console.log(secretWord.length);
        socket.emit("wordLength", { length: secretWord.length });
        socket.emit("wordFirstLetter", { firstLetter: secretWord[0] });
      } else {
        console.log("erreur, vous devez rejoindre une room");
        socket.emit("error", { message: "Vous devez rejoindre une room pour jouer." });
      }
    });

    socket.on("guess", (roomCode, word) => {
      console.log("word: " + secretWord);
      const guessedWord = word.toLowerCase();
      console.log("guessedWord: " + guessedWord);
      console.log("roomCode: " + roomCode);

      // Vérifier si le joueur est dans la bonne room
      if (!socket.rooms.has(roomCode)) {
        socket.emit("error", { message: "Vous devez rejoindre cette room pour jouer." });
        return;
      }

      const player = players[socket.id] = {
        score: 0,
        attempts: 0,
        correctLetters: Array(secretWord.length).fill("_"),
      };

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
        socket.emit("guessResult", { result: "Correct ! Vous avez trouvé le mot." });
        secretWord = getRandomWord();
        console.log("secretWord: " + secretWord);
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

    socket.on("disconnectGame", () => {
      console.log("Un joueur s'est déconnecté");
      delete players[socket.id];
    });
  });
};
