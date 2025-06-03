import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { QUESTIONS } from "./questions.js";

const app = express();
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://skingcoding.github.io",
    "https://party-game-backend.onrender.com"
  ],
  credentials: true,
  methods: ["GET", "POST"]
}));
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://skingcoding.github.io",
      "https://party-game-backend.onrender.com"
    ],
    methods: ["GET", "POST"],
    credentials: true,
    transports: ['websocket', 'polling']
  },
  allowEIO3: true
});

const lobbies = {};

function generateLobbyCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

io.on("connection", (socket) => {
  let currentLobby = null;
  let currentUser = null;

  socket.on("createLobby", ({ username }, cb) => {
    const code = generateLobbyCode();
    lobbies[code] = {
      code,
      hostId: socket.id,
      users: [],
      rounds: 0,
      currentRound: 0,
      gameState: "lobby",
      questions: [...QUESTIONS],
      roundData: []
    };
    currentLobby = code;
    currentUser = { id: socket.id, username, isHost: true };
    lobbies[code].users.push(currentUser);
    socket.join(code);
    cb({ code, users: lobbies[code].users });
    io.to(code).emit("lobbyUpdate", lobbies[code]);
  });

  socket.on("joinLobby", ({ code, username }, cb) => {
    const lobby = lobbies[code];
    if (!lobby) return cb({ error: "Lobby not found" });
    if (lobby.users.find(u => u.username === username)) {
      return cb({ error: "Username taken" });
    }
    currentLobby = code;
    currentUser = { id: socket.id, username, isHost: false };
    lobby.users.push(currentUser);
    socket.join(code);
    cb({ code, users: lobby.users });
    io.to(code).emit("lobbyUpdate", lobby);
  });

  socket.on("setRounds", ({ code, rounds }) => {
    if (lobbies[code]) {
      lobbies[code].rounds = rounds;
      io.to(code).emit("lobbyUpdate", lobbies[code]);
    }
  });

  socket.on("startGame", ({ code }) => {
    const lobby = lobbies[code];
    if (!lobby) return;
    lobby.gameState = "in-game";
    lobby.currentRound = 0;
    lobby.roundData = [];
    io.to(code).emit("gameStarted", lobby);
    startNextRound(lobby);
  });

  function startNextRound(lobby) {
    if (lobby.currentRound >= lobby.rounds) {
      lobby.gameState = "finished";
      io.to(lobby.code).emit("gameEnded", lobby);
      return;
    }

    const player = lobby.users[Math.floor(Math.random() * lobby.users.length)];
    const questionIdx = Math.floor(Math.random() * lobby.questions.length);
    const question = lobby.questions.splice(questionIdx, 1)[0];
    
    const round = {
      playerId: player.id,
      question,
      coinResult: null,
      revealed: false
    };
    
    lobby.roundData.push(round);
    lobby.currentRound++;
    
    io.to(lobby.code).emit("newRound", {
      currentRound: lobby.currentRound,
      totalRounds: lobby.rounds,
      playerId: player.id
    });
    
    io.to(player.id).emit("yourQuestion", { question });
  }

  socket.on("flipCoin", ({ code }) => {
    const lobby = lobbies[code];
    if (!lobby) return;
    
    const round = lobby.roundData[lobby.currentRound - 1];
    const coinResult = Math.random() < 0.5 ? "heads" : "tails";
    round.coinResult = coinResult;
    round.revealed = coinResult === "heads";
    
    io.to(lobby.code).emit("coinFlipped", {
      coinResult,
      question: round.revealed ? round.question : null
    });
    
    setTimeout(() => startNextRound(lobby), 2500);
  });

  socket.on("disconnect", () => {
    if (currentLobby && lobbies[currentLobby]) {
      const lobby = lobbies[currentLobby];
      lobby.users = lobby.users.filter(u => u.id !== socket.id);
      
      if (lobby.users.length === 0) {
        delete lobbies[currentLobby];
      } else {
        if (lobby.hostId === socket.id) {
          lobby.hostId = lobby.users[0].id;
          lobby.users[0].isHost = true;
        }
        io.to(currentLobby).emit("lobbyUpdate", lobby);
      }
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`)); 