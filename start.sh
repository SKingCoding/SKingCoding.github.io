#!/bin/bash

# Get Pi's IP address
IP_ADDRESS=$(hostname -I | awk '{print $1}')

# Start backend
echo "Starting backend server..."
cd ~/party-game/backend
node index.js &
BACKEND_PID=$!

# Build and serve frontend
echo "Building frontend..."
cd ~/party-game/frontend
npm run build

echo "Starting frontend server..."
npx serve -s dist -l 3000 &
FRONTEND_PID=$!

echo "=========================================="
echo "Party Game is running!"
echo "Backend: http://$IP_ADDRESS:4000"
echo "Frontend: http://$IP_ADDRESS:3000"
echo "=========================================="
echo "To play the game, open http://$IP_ADDRESS:3000"
echo "Press Ctrl+C to stop the servers"

# Handle shutdown
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM
wait 