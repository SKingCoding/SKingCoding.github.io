import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Lobby({ socket, lobby, username, isHost }) {
  const [rounds, setRounds] = useState(lobby.users.length);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isHost) {
      socket.emit('setRounds', { code: lobby.code, rounds });
    }
  }, [rounds, isHost, socket, lobby.code]);

  const handleStartGame = () => {
    if (rounds < lobby.users.length) {
      setError(`Minimum ${lobby.users.length} rounds required`);
      return;
    }
    socket.emit('startGame', { code: lobby.code });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full"
    >
      <h2 className="text-3xl font-bold text-center mb-8">Game Lobby</h2>
      
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Lobby Code:</h3>
        <div className="bg-gray-100 p-3 rounded-md text-center font-mono text-2xl">
          {lobby.code}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Players:</h3>
        <ul className="space-y-2">
          {lobby.users.map((user) => (
            <motion.li
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>{user.username}</span>
              {user.isHost && <span className="text-sm text-gray-500">(Host)</span>}
            </motion.li>
          ))}
        </ul>
      </div>

      {isHost && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Number of Rounds:</h3>
          <input
            type="number"
            min={lobby.users.length}
            value={rounds}
            onChange={(e) => setRounds(parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
      )}

      {isHost && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleStartGame}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors"
        >
          Start Game
        </motion.button>
      )}
    </motion.div>
  );
} 