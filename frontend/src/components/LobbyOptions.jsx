import React, { useState } from 'react';
import { motion } from 'framer-motion';

function LobbyOptions({ onCreateLobby, onJoinLobby, error }) {
  const [lobbyCode, setLobbyCode] = useState('');

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (lobbyCode.trim()) {
      onJoinLobby(lobbyCode.trim());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="lobby-options"
    >
      <h2>Choose an Option</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="options-container">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onCreateLobby}
          className="create-lobby-btn"
        >
          Create New Lobby
        </motion.button>

        <div className="join-lobby-section">
          <h3>Join Existing Lobby</h3>
          <form onSubmit={handleJoinSubmit}>
            <input
              type="text"
              value={lobbyCode}
              onChange={(e) => setLobbyCode(e.target.value)}
              placeholder="Enter lobby code"
              className="lobby-code-input"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="join-lobby-btn"
              disabled={!lobbyCode.trim()}
            >
              Join Lobby
            </motion.button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}

export default LobbyOptions; 