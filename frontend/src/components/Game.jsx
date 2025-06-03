import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Game({ socket, lobby, username }) {
  const [question, setQuestion] = useState(null);
  const [isYourTurn, setIsYourTurn] = useState(false);
  const [coinResult, setCoinResult] = useState(null);
  const [revealedQuestion, setRevealedQuestion] = useState(null);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    socket.on('yourQuestion', ({ question }) => {
      setQuestion(question);
      setIsYourTurn(true);
    });

    socket.on('newRound', ({ playerId }) => {
      setIsYourTurn(socket.id === playerId);
      setQuestion(null);
      setCoinResult(null);
      setRevealedQuestion(null);
    });

    socket.on('coinFlipped', ({ coinResult, question }) => {
      setCoinResult(coinResult);
      if (question) {
        setRevealedQuestion(question);
      }
    });

    return () => {
      socket.off('yourQuestion');
      socket.off('newRound');
      socket.off('coinFlipped');
    };
  }, [socket]);

  const handleFlipCoin = () => {
    setIsFlipping(true);
    socket.emit('flipCoin', { code: lobby.code });
    setTimeout(() => setIsFlipping(false), 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full"
    >
      <h2 className="text-3xl font-bold text-center mb-8">Round {lobby.currentRound}</h2>

      {isYourTurn && question && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Your Secret Question:</h3>
          <div className="bg-yellow-100 p-4 rounded-lg">
            <p className="text-lg">{question}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleFlipCoin}
            disabled={isFlipping}
            className="w-full mt-4 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Flip Coin
          </motion.button>
        </div>
      )}

      {!isYourTurn && (
        <div className="text-center text-gray-600">
          Waiting for the current player...
        </div>
      )}

      {coinResult && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mt-8 text-center"
        >
          <div className="text-2xl font-bold mb-4">
            {coinResult === 'heads' ? 'Heads!' : 'Tails!'}
          </div>
          {revealedQuestion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-yellow-100 p-4 rounded-lg"
            >
              <p className="text-lg">{revealedQuestion}</p>
            </motion.div>
          )}
        </motion.div>
      )}

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-2">Players:</h3>
        <ul className="space-y-2">
          {lobby.users.map((user) => (
            <li
              key={user.id}
              className={`flex items-center space-x-2 ${
                isYourTurn && user.id === socket.id ? 'text-blue-600 font-bold' : ''
              }`}
            >
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>{user.username}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
} 