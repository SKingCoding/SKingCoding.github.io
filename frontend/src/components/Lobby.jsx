import React, { useState } from 'react';
import { motion } from 'framer-motion';

function Lobby({ socket, lobby, username, isHost }) {
  const [rounds, setRounds] = useState(5);

  const handleStartGame = () => {
    if (isHost) {
      socket.emit('setRounds', { code: lobby.code, rounds });
      socket.emit('startGame', { code: lobby.code });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="lobby"
    >
      <h2>Game Lobby</h2>
      <div className="lobby-code">
        <p>Lobby Code:</p>
        <h3>{lobby.code}</h3>
      </div>

      <div className="players-list">
        <h3>Players ({lobby.users.length})</h3>
        <ul>
          {lobby.users.map((user) => (
            <li key={user.id} className={user.isHost ? 'host' : ''}>
              {user.username} {user.isHost ? '(Host)' : ''}
            </li>
          ))}
        </ul>
      </div>

      {isHost && (
        <div className="game-settings">
          <h3>Game Settings</h3>
          <div className="rounds-selector">
            <label htmlFor="rounds">Number of Rounds:</label>
            <select
              id="rounds"
              value={rounds}
              onChange={(e) => setRounds(Number(e.target.value))}
            >
              {[3, 5, 7, 10].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartGame}
            className="start-game-btn"
            disabled={lobby.users.length < 2}
          >
            Start Game
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

export default Lobby; 