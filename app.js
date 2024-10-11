// const express = require("express");
// const { createServer } = require("node:http");
// const { join } = require("node:path");
// const { Server } = require("socket.io");

// const app = express();
// const server = createServer(app);
// const io = new Server(server);

// app.use(express.static("./public"));

// app.get("/", (req, res) => {
//   res.sendFile(join(__dirname, "index.html"));
// });

// const secretWord = "tusmo";

// io.on("connection", (socket) => {
//   console.log("Un joueur s'est connecté");

//   socket.on("guess", (data) => {
//     const guessedWord = data.word.toLowerCase();
//     if (guessedWord === secretWord) {
//       io.emit("guessResult", { result: "Correct ! Vous avez trouvé le mot." });
//     } else {
//       io.emit("guessResult", { result: "Faux ! Essayez encore." });
//     }
//   });

//   socket.on("disconnect", () => {
//     console.log("Un joueur s'est déconnecté");
//   });
// });

// server.listen(4000, () => {
//   console.log("server running at http://localhost:4000");
// });

const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { Server } = require("socket.io");
const fs = require("fs");

const app = express();
const server = createServer(app);
const io = new Server(server);

// Charger le dictionnaire de mots français
const words = fs
  .readFileSync("dictionnaire.txt", "utf-8")
  .split("\n")
  .map((word) => word.trim());

// Fonction pour choisir un mot aléatoire dans le dictionnaire
function getRandomWord() {
  const randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex];
}

// Démarrer avec un mot secret aléatoire
let secretWord = getRandomWord();
console.log("Mot secret choisi:", secretWord);

app.use(express.static("./public"));

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

io.on("connection", (socket) => {
  console.log("Un joueur s'est connecté");

  // Envoyer la longueur du mot au joueur lors de la connexion
  socket.emit("wordLength", { length: secretWord.length });

  socket.on("guess", (data) => {
    const guessedWord = data.word.toLowerCase();

    // Vérifier si le mot deviné existe dans le dictionnaire
    if (!words.includes(guessedWord)) {
      socket.emit("guessResult", {
        result: "Le mot n'existe pas dans le dictionnaire.",
      });
      return;
    }

    // Comparer les lettres avec le mot secret et donner un feedback
    let result = "";
    let correctLetters = [];

    for (let i = 0; i < guessedWord.length; i++) {
      if (guessedWord[i] === secretWord[i]) {
        correctLetters[i] = guessedWord[i]; // Lettre bien placée
      } else if (secretWord.includes(guessedWord[i])) {
        correctLetters[i] = guessedWord[i]; // Lettre présente mais mal placée
      } else {
        correctLetters[i] = "_"; // Lettre incorrecte
      }
    }

    // Si le mot est correct
    if (guessedWord === secretWord) {
      result = "Correct ! Vous avez trouvé le mot.";
      // Choisir un nouveau mot pour la prochaine partie
      secretWord = getRandomWord();
      console.log("Nouveau mot secret choisi:", secretWord);
    } else {
      result = `Faux ! Lettres trouvées : ${correctLetters.join(" ")}`;
    }

    io.emit("guessResult", { result });
  });

  socket.on("disconnect", () => {
    console.log("Un joueur s'est déconnecté");
  });
});

server.listen(4000, () => {
  console.log("server running at http://localhost:4000");
});
