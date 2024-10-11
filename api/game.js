// io.on('connection', (socket) => {
//   console.log('A user connected');

//   // Event for creating a room
//   socket.on('createRoom', (callback) => {
//     const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
//     socket.join(roomCode);
//     callback(roomCode);  // Send room code back to the client
//   });

//   // Event for joining a room
//   socket.on('joinRoom', (roomCode, username) => {
//     socket.join(roomCode);
//     io.to(roomCode).emit('playerJoined', username); // Notify everyone in the room
//   });

//   // Event for disconnecting from a room
//   socket.on('disconnect', () => {
//     console.log('A user disconnected');
//   });
// });

// const players = {};

// io.on("connection", (socket) => {
//   console.log("Un joueur s'est connecté");

//   players[socket.id] = {
//     attempts: 0,
//     correctLetters: Array(secretWord.length).fill("_"),
//   };

//   socket.emit("wordLength", { length: secretWord.length });

//   socket.on("guess", (data) => {
//     const guessedWord = data.word.toLowerCase();
//     const player = players[socket.id];

//     if (!words.includes(guessedWord)) {
//       socket.emit("guessResult", {
//         result: "Le mot n'existe pas dans le dictionnaire.",
//       });
//       return;
//     }

//     if (player.attempts >= 6) {
//       socket.emit("guessResult", {
//         result: "Vous avez déjà atteint le nombre maximum d'essais.",
//       });
//       return;
//     }

//     player.attempts++;

//     for (let i = 0; i < guessedWord.length; i++) {
//       if (guessedWord[i] === secretWord[i]) {
//         player.correctLetters[i] = guessedWord[i];
//       } else if (secretWord.includes(guessedWord[i])) {
//         if (player.correctLetters[i] === "_") {
//           player.correctLetters[i] = guessedWord[i];
//         }
//       }
//     }

//     if (guessedWord === secretWord) {
//       io.emit("guessResult", { result: "Correct ! Vous avez trouvé le mot." });
//       secretWord = getRandomWord();
//       console.log("Nouveau mot secret choisi:", secretWord);
//       for (const id in players) {
//         players[id].attempts = 0;
//         players[id].correctLetters = Array(secretWord.length).fill("_");
//       }
//     } else {
//       socket.emit("guessResult", {
//         result: `Faux ! Lettres trouvées : ${player.correctLetters.join(
//           " "
//         )}, Essais restants : ${6 - player.attempts}`,
//       });
//     }
//   });

//   socket.on("disconnect", () => {
//     console.log("Un joueur s'est déconnecté");
//     delete players[socket.id];
//   });
// });