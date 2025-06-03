import React, { useState } from 'react';
import { motion } from 'framer-motion';

function UsernameForm({ onSubmit }) {
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      onSubmit(username.trim());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="username-form"
    >
      <h2>Enter Your Username</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="username-input"
          maxLength={20}
          required
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          className="submit-btn"
          disabled={!username.trim()}
        >
          Continue
        </motion.button>
      </form>
    </motion.div>
  );
}

export default UsernameForm; 