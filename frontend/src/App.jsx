import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { motion } from 'framer-motion';
import UsernameForm from './components/UsernameForm';
import LobbyOptions from './components/LobbyOptions';
import Lobby from './components/Lobby';
import Game from './components/Game';

// Use Raspberry Pi's local IP address
const BACKEND_URL = 'http://192.168.1.100:4000'; // Replace with your Pi's IP
const socket = io(BACKEND_URL);

export default function App() {
  const [username, setUsername] = useState('');
  const [gameState, setGameState] = useState('username'); // username -> lobbyOptions -> lobby -> game
  const [lobby, setLobby] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    socket.on('lobbyUpdate', (updatedLobby) => {
      setLobby(updatedLobby);
    });

    socket.on('gameStarted', (gameLobby) => {
      setLobby(gameLobby);
      setGameState('game');
    });

    socket.on('gameEnded', (gameLobby) => {
      setLobby(gameLobby);
      setGameState('lobby');
    });

    return () => {
      socket.off('lobbyUpdate');
      socket.off('gameStarted');
      socket.off('gameEnded');
    };
  }, []);

  const handleUsernameSubmit = (name) => {
    setUsername(name);
    setGameState('lobbyOptions');
  };

  const handleCreateLobby = () => {
    socket.emit('createLobby', { username }, (response) => {
      if (response.error) {
        setError(response.error);
      } else {
        setLobby(response);
        setGameState('lobby');
      }
    });
  };

  const handleJoinLobby = () => {
    const code = prompt('Enter lobby code:');
    if (code) {
      socket.emit('joinLobby', { code, username }, (response) => {
        if (response.error) {
          setError(response.error);
        } else {
          setLobby(response);
          setGameState('lobby');
        }
      });
    }
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
          />
        );
      
      case 'lobby':
        return (
          <Lobby
            socket={socket}
            lobby={lobby}
            username={username}
            isHost={lobby?.hostId === socket.id}
          />
        );
      
      case 'game':
        return (
          <Game
            socket={socket}
            lobby={lobby}
            username={username}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 to-blue-200 flex flex-col items-center justify-center p-4">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
        >
          {error}
        </motion.div>
      )}
      {renderContent()}
    </div>
  );
} 