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

// Stockage des données par room
const roomsData = {};

module.exports = (io) => {
  io.on("connection", (socket) => {
    // Quand un utilisateur rejoint une room
    socket.on("joinRoom", (roomCode, username, callback) => {
      console.log("player: " + username + " connecté");

      const room = io.sockets.adapter.rooms.get(roomCode);

      if (room) {
        // Initialisation des données de la room si nécessaire
        if (!roomsData[roomCode]) {
          roomsData[roomCode] = { secretWord: "", players: {} };
        }

        // Ajouter le joueur dans les données de la room
        roomsData[roomCode].players[socket.id] = {
          username: username,
          score: 0,
          attempts: 0,
          correctLetters: [],
        };

        socket.join(roomCode);

        // Récupérer les joueurs de la room
        const playersInRoom = Object.values(roomsData[roomCode].players);

        io.to(roomCode).emit("roomPlayers", playersInRoom);
        callback({ success: true, playersInRoom });
      } else {
        console.log("pas de room");
      }
    });

    // Quand un utilisateur crée une room
    socket.on("createRoom", (username, callback) => {
      const roomCode = Math.random().toString(36).substring(2, 15);

      // Initialisation des données de la room
      roomsData[roomCode] = { secretWord: "", players: {} };

      roomsData[roomCode].players[socket.id] = {
        username: username,
        score: 0,
        attempts: 0,
        correctLetters: [],
      };

      socket.join(roomCode);

      const playersInRoom = Object.values(roomsData[roomCode].players);

      io.to(roomCode).emit("roomPlayers", playersInRoom);
      callback({ success: true, roomCode, playersInRoom });
    });

    // Lancement du jeu
    socket.on("askStartGame", ({ roomCode }) => {
      console.log("on ask");

      const secretWord = getRandomWord();
      roomsData[roomCode].secretWord = secretWord;

      io.to(roomCode).emit("startGame", { roomCode });
      io.to(roomCode).emit("wordLength", secretWord.length);
      io.to(roomCode).emit("wordFirstLetter", secretWord[0]);
    });

    // Gestion des propositions
    socket.on("guess", (roomCode, word) => {
      const room = roomsData[roomCode];
      if (!room) {
        socket.emit("error", { message: "La room n'existe pas." });
        return;
      }

      const guessedWord = word.toLowerCase();
      const secretWord = room.secretWord;

      if (!words.includes(guessedWord)) {
        socket.emit("guessResult", {
          result: "Le mot n'existe pas dans le dictionnaire.",
        });
        return;
      }

      const player = room.players[socket.id];
      if (!player) {
        socket.emit("error", { message: "Joueur non trouvé dans la room." });
        return;
      }

      if (player.attempts >= 5) {
        socket.emit("guessResult", {
          result: "Vous avez déjà atteint le nombre maximum d'essais.",
        });
        return;
      }

      player.attempts++;

      // Mise à jour des lettres correctes
      player.correctLetters = Array.from(secretWord).map((letter, i) =>
        guessedWord[i] === letter ? letter : player.correctLetters[i] || "_"
      );

      if (guessedWord === secretWord) {
        console.log("Score actuel avant incrémentation :", player.score);

        // Incrémentation du score du joueur
        player.score += 1;

        console.log("Score après incrémentation :", player.score);

        socket.emit("guessResult", { result: "Correct ! Vous avez trouvé le mot." });

        // Nouveau mot pour la room
        const newSecretWord = getRandomWord();
        room.secretWord = newSecretWord;

        // Réinitialisation des joueurs
        Object.values(room.players).forEach((p) => {
          p.attempts = 0;
          p.correctLetters = Array(newSecretWord.length).fill("_");
        });

        io.to(roomCode).emit("roomPlayers", Object.values(room.players));
        io.to(roomCode).emit("newWord", newSecretWord.length);
        io.to(roomCode).emit("wordLength", newSecretWord.length);
        io.to(roomCode).emit("wordFirstLetter", newSecretWord[0]);
      } else {
        socket.emit("guessResult", {
          result: `Faux ! Lettres trouvées : ${player.correctLetters.join(" ")}, Essais restants : ${5 - player.attempts}`,
        });
      }
    });

    // Quand un utilisateur quitte la room
    socket.on("leaveRoom", (roomCode) => {
      const room = roomsData[roomCode];
      if (room && room.players[socket.id]) {
        delete room.players[socket.id];
        socket.leave(roomCode);

        // Mettre à jour les joueurs dans la room
        io.to(roomCode).emit("roomPlayers", Object.values(room.players));
      }
    });

    // Quand un utilisateur se déconnecte
    socket.on("disconnect", () => {
      for (const roomCode in roomsData) {
        const room = roomsData[roomCode];
        if (room.players[socket.id]) {
          delete room.players[socket.id];
          io.to(roomCode).emit("roomPlayers", Object.values(room.players));
        }
      }
      console.log("Utilisateur déconnecté");
    });
  });
};
