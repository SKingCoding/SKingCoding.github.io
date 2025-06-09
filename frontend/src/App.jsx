import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import UsernameForm from './components/UsernameForm';
import LobbyOptions from './components/LobbyOptions';
import Lobby from './components/Lobby';
import Game from './components/Game';
import './App.css';

// Use the Cloudflare Worker URL
// Updated to use new Worker URL
const BACKEND_URL = 'https://party-game-backend-pusy.onrender.com;

// Create socket connection with explicit configuration
const socket = io(BACKEND_URL, {
  transports: ['polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  withCredentials: false,
  forceNew: true,
  autoConnect: false,
  path: '/socket.io/',
  extraHeaders: {
    "Access-Control-Allow-Origin": "https://skingcoding.github.io"
  }
});

export default function App() {
  const [username, setUsername] = useState('');
  const [gameState, setGameState] = useState('username');
  const [lobby, setLobby] = useState(null);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  useEffect(() => {
    console.log('Initializing socket connection...');
    
    // Connection event handlers
    socket.on('connect', () => {
      console.log('Socket connected successfully');
      setIsConnected(true);
      setError(null);
      setConnectionAttempts(0);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      setConnectionAttempts(prev => prev + 1);
      
      // Try to reconnect with a different transport if polling fails
      if (connectionAttempts >= 3) {
        console.log('Switching to alternative transport...');
        socket.io.opts.transports = ['polling'];
        socket.connect();
      }
      
      if (connectionAttempts >= 5) {
        setError('Failed to connect to game server. Please try again later.');
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        socket.connect();
      }
    });

    // Game state handlers
    socket.on('lobbyUpdate', (updatedLobby) => {
      console.log('Lobby updated:', updatedLobby);
      setLobby(updatedLobby);
    });

    socket.on('gameStarted', (gameData) => {
      console.log('Game started:', gameData);
      setGameState('game');
      setLobby(gameData);
    });

    socket.on('gameEnded', () => {
      console.log('Game ended');
      setGameState('username');
      setLobby(null);
    });

    // Connect to the server
    console.log('Attempting to connect to server...');
    socket.connect();

    return () => {
      console.log('Cleaning up socket connection...');
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.off('lobbyUpdate');
      socket.off('gameStarted');
      socket.off('gameEnded');
      socket.disconnect();
    };
  }, [connectionAttempts]);

  const handleUsernameSubmit = (name) => {
    console.log('Username submitted:', name);
    setUsername(name);
    setGameState('lobbyOptions');
  };

  const handleCreateLobby = () => {
    console.log('Creating new lobby...');
    setError(null);
    socket.emit('createLobby', { username }, (response) => {
      console.log('Create lobby response:', response);
      if (response.error) {
        setError(response.error);
      } else {
        setLobby(response);
        setGameState('lobby');
      }
    });
  };

  const handleJoinLobby = (code) => {
    console.log('Joining lobby:', code);
    setError(null);
    socket.emit('joinLobby', { code, username }, (response) => {
      console.log('Join lobby response:', response);
      if (response.error) {
        setError(response.error);
      } else {
        setLobby(response);
        setGameState('lobby');
      }
    });
  };

  const handleSetRounds = (rounds) => {
    console.log('Setting rounds:', rounds);
    socket.emit('setRounds', { code: lobby.code, rounds });
  };

  const handleStartGame = () => {
    console.log('Starting game...');
    socket.emit('startGame', { code: lobby.code });
  };

  const handleFlipCoin = (choice) => {
    console.log('Flipping coin:', choice);
    socket.emit('flipCoin', { code: lobby.code, choice });
  };

  const handleNextRound = () => {
    console.log('Moving to next round...');
    socket.emit('nextRound', { code: lobby.code });
  };

  const handleEndGame = () => {
    console.log('Ending game...');
    socket.emit('endGame', { code: lobby.code });
  };

  const renderContent = () => {
    switch (gameState) {
      case 'username':
        return <UsernameForm onSubmit={handleUsernameSubmit} />;
      
      case 'lobbyOptions':
        return (
          <LobbyOptions
            onCreateLobby={handleCreateLobby}
            onJoinLobby={handleJoinLobby}
            error={error}
          />
        );
      
      case 'lobby':
        return (
          <Lobby
            socket={socket}
            lobby={lobby}
            username={username}
            isHost={lobby?.hostId === socket.id}
            onSetRounds={handleSetRounds}
            onStartGame={handleStartGame}
          />
        );
      
      case 'game':
        return (
          <Game
            socket={socket}
            lobby={lobby}
            username={username}
            onFlipCoin={handleFlipCoin}
            onNextRound={handleNextRound}
            onEndGame={handleEndGame}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-500 text-white p-4 rounded-lg mb-4 text-center"
            >
              {error}
            </motion.div>
          )}

          {gameState === 'username' && (
            <motion.div
              key="username"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {renderContent()}
            </motion.div>
          )}

          {gameState === 'lobbyOptions' && (
            <motion.div
              key="lobby-options"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {renderContent()}
            </motion.div>
          )}

          {gameState === 'lobby' && lobby && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              {renderContent()}
            </motion.div>
          )}

          {gameState === 'game' && lobby && (
            <motion.div
              key="game"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              {renderContent()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 