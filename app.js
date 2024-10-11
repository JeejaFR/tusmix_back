const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { Server } = require("socket.io");
const cors = require('cors');
const fs = require("fs");

const app = express();


app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));


const server = createServer(app);

const io = require("socket.io")(4001, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const rooms = {}; // Garde en mémoire les rooms et les joueurs associés

io.on("connection", (socket) => {
  console.log("Un utilisateur s'est connecté");

  socket.on("createRoom", (callback) => {
    const roomCode = generateRoomCode();
    rooms[roomCode] = [];
    
    // Ajouter le créateur à la room
    rooms[roomCode].push(socket.username); // ou utiliser un identifiant approprié
    socket.join(roomCode);
    
    // Émettre une notification pour les autres joueurs
    io.to(roomCode).emit("playerJoined", socket.username);

    callback(roomCode);
  });

  socket.on("joinRoom", (roomCode, username, callback) => {
    if (rooms[roomCode]) {
      if (!rooms[roomCode].includes(username)) {
        rooms[roomCode].push(username);
        socket.join(roomCode);
        io.to(roomCode).emit("playerJoined", username);
      }
      callback(rooms[roomCode]);
    }
  });

  socket.on("leaveRoom", (roomCode, callback) => {
    if (rooms[roomCode]) {
      rooms[roomCode] = rooms[roomCode].filter((username) => username !== socket.username);
      socket.leave(roomCode);
      io.to(roomCode).emit("playerLeft", socket.username);
      callback();
    }
  });

  socket.on("disconnect", () => {
    console.log("Un utilisateur s'est déconnecté");
    for (const roomCode in rooms) {
      rooms[roomCode] = rooms[roomCode].filter((player) => player !== socket.username);
      io.to(roomCode).emit("playerLeft", socket.username);
    }
  });
});


function generateRoomCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

// const words = fs
//   .readFileSync("dictionnaire.txt", "utf-8")
//   .split("\n")
//   .map((word) => word.trim());

// function getRandomWord() {
//   const randomIndex = Math.floor(Math.random() * words.length);
//   return words[randomIndex];
// }

// let secretWord = getRandomWord();
// console.log("Mot secret choisi:", secretWord);

app.use(express.static("./public"));


app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

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

server.listen(4000, () => {
  console.log("server running at http://localhost:4000");
});
