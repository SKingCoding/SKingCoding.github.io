import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { QUESTIONS } from "./questions.js";

const app = express();

// CORS configuration for Express
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  credentials: false,
  allowedHeaders: ["Content-Type", "Authorization", "Access-Control-Allow-Origin"]
}));

const server = http.createServer(app);

// Socket.IO configuration with CORS
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    credentials: false,
    allowedHeaders: ["Content-Type", "Authorization", "Access-Control-Allow-Origin"],
    transports: ['polling', 'websocket']
  },
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
  path: '/socket.io/',
  serveClient: false,
  cookie: false
});

// Add a basic health check endpoint
app.get('/', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Add a socket.io health check endpoint
app.get('/socket.io/', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ status: 'ok', message: 'Socket.IO is running' });
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

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log('New client connected:', socket.id);
  
  let currentLobby = null;
  let currentUser = null;

  socket.on("createLobby", ({ username }, cb) => {
    console.log('Creating lobby for user:', username);
    try {
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
      console.log('Lobby created:', code);
      cb({ code, users: lobbies[code].users });
      io.to(code).emit("lobbyUpdate", lobbies[code]);
    } catch (error) {
      console.error('Error creating lobby:', error);
      cb({ error: 'Failed to create lobby' });
    }
  });

  socket.on("joinLobby", ({ code, username }, cb) => {
    console.log('Joining lobby:', code, 'User:', username);
    try {
      const lobby = lobbies[code];
      if (!lobby) {
        console.log('Lobby not found:', code);
        return cb({ error: "Lobby not found" });
      }
      if (lobby.users.find(u => u.username === username)) {
        console.log('Username taken:', username);
        return cb({ error: "Username taken" });
      }
      currentLobby = code;
      currentUser = { id: socket.id, username, isHost: false };
      lobby.users.push(currentUser);
      socket.join(code);
      console.log('User joined lobby:', code);
      cb({ code, users: lobby.users });
      io.to(code).emit("lobbyUpdate", lobby);
    } catch (error) {
      console.error('Error joining lobby:', error);
      cb({ error: 'Failed to join lobby' });
    }
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
    console.log('Client disconnected:', socket.id);
    if (currentLobby && lobbies[currentLobby]) {
      const lobby = lobbies[currentLobby];
      lobby.users = lobby.users.filter(u => u.id !== socket.id);
      
      if (lobby.users.length === 0) {
        console.log('Deleting empty lobby:', currentLobby);
        delete lobbies[currentLobby];
      } else {
        if (lobby.hostId === socket.id) {
          console.log('Reassigning host in lobby:', currentLobby);
          lobby.hostId = lobby.users[0].id;
          lobby.users[0].isHost = true;
        }
        io.to(currentLobby).emit("lobbyUpdate", lobby);
      }
    }
  });
});

// Log when server starts
server.listen(process.env.PORT || 4000, () => {
  console.log(`Server running on port ${process.env.PORT || 4000}`);
  console.log('CORS enabled for all origins');
  console.log('Socket.IO server initialized');
}); 