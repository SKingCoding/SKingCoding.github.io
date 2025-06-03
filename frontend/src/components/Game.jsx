import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function Game({ socket, lobby, username }) {
  const [currentRound, setCurrentRound] = useState(null);
  const [question, setQuestion] = useState(null);
  const [coinResult, setCoinResult] = useState(null);
  const [isYourTurn, setIsYourTurn] = useState(false);

  useEffect(() => {
    socket.on('newRound', (round) => {
      console.log('New round:', round);
      setCurrentRound(round);
      setIsYourTurn(round.playerId === socket.id);
      setCoinResult(null);
      setQuestion(null);
    });

    socket.on('yourQuestion', ({ question }) => {
      console.log('Your question:', question);
      setQuestion(question);
    });

    socket.on('coinFlipped', ({ coinResult, question }) => {
      console.log('Coin flipped:', coinResult, question);
      setCoinResult(coinResult);
      if (question) {
        setQuestion(question);
      }
    });

    return () => {
      socket.off('newRound');
      socket.off('yourQuestion');
      socket.off('coinFlipped');
    };
  }, [socket]);

  const handleFlipCoin = () => {
    socket.emit('flipCoin', { code: lobby.code });
  };

  if (!currentRound) {
    return (
      <div className="game-loading">
        <h2>Waiting for game to start...</h2>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="game"
    >
      <div className="game-header">
        <h2>Round {currentRound.currentRound} of {currentRound.totalRounds}</h2>
      </div>

      <div className="game-content">
        {isYourTurn ? (
          <div className="your-turn">
            <h3>It's your turn!</h3>
            {question && (
              <div className="question">
                <p>{question}</p>
              </div>
            )}
            {!coinResult && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleFlipCoin}
                className="flip-coin-btn"
              >
                Flip Coin
              </motion.button>
            )}
          </div>
        ) : (
          <div className="waiting">
            <h3>Waiting for {lobby.users.find(u => u.id === currentRound.playerId)?.username}'s turn...</h3>
          </div>
        )}

        {coinResult && (
          <div className="coin-result">
            <h3>Coin landed on: {coinResult}</h3>
            {coinResult === 'heads' && question && (
              <div className="question">
                <p>{question}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default Game; 