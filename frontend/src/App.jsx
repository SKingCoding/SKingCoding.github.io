import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import UsernameForm from './components/UsernameForm';
import LobbyOptions from './components/LobbyOptions';
import Lobby from './components/Lobby';
import Game from './components/Game';
import './App.css';

const BACKEND_URL = 'https://party-game-backend.onrender.com';
const socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000,
  withCredentials: true
});

export default function App() {
  const [username, setUsername] = useState('');
  const [gameState, setGameState] = useState(null);
  const [lobby, setLobby] = useState(null);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log('Initializing socket connection...');
    
    socket.on('connect', () => {
      console.log('Socket connected successfully!', socket.id);
      setIsConnected(true);
      setError(null);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError('Failed to connect to game server. Please try again later.');
      setIsConnected(false);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        setError('Disconnected from server. Please refresh the page.');
      }
    });

    socket.on('lobbyUpdate', (updatedLobby) => {
      console.log('Received lobby update:', updatedLobby);
      setLobby(updatedLobby);
    });

    socket.on('gameState', (state) => {
      console.log('Received game state update:', state);
      setGameState(state);
    });

    socket.on('error', (errorMessage) => {
      console.error('Received error from server:', errorMessage);
      setError(errorMessage);
    });

    return () => {
      console.log('Cleaning up socket connection...');
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.off('lobbyUpdate');
      socket.off('gameState');
      socket.off('error');
    };
  }, []);

  const handleUsernameSubmit = (name) => {
    console.log('Submitting username:', name);
    setUsername(name);
    setError(null);
  };

  const handleCreateLobby = () => {
    console.log('Creating new lobby...');
    if (!isConnected) {
      console.error('Cannot create lobby: Socket not connected');
      setError('Not connected to server. Please refresh the page.');
      return;
    }
    setError(null);
    socket.emit('createLobby', { username }, (response) => {
      console.log('Create lobby response:', response);
      if (response.error) {
        console.error('Error creating lobby:', response.error);
        setError(response.error);
      }
    });
  };

  const handleJoinLobby = (code) => {
    console.log('Joining lobby:', code);
    if (!isConnected) {
      console.error('Cannot join lobby: Socket not connected');
      setError('Not connected to server. Please refresh the page.');
      return;
    }
    setError(null);
    socket.emit('joinLobby', { code, username }, (response) => {
      console.log('Join lobby response:', response);
      if (response.error) {
        console.error('Error joining lobby:', response.error);
        setError(response.error);
      }
    });
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