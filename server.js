const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

// Game state
const gameRooms = {};
const players = {};

class GameRoom {
  constructor(roomId) {
    this.roomId = roomId;
    this.players = [];
    this.gameState = {
      ballX: 400,
      ballY: 300,
      ballSpeedX: 5,
      ballSpeedY: 5,
      ballRadius: 8,
      paddle1Y: 250,
      paddle2Y: 250,
      paddle1Score: 0,
      paddle2Score: 0,
      gameActive: false
    };
    this.gameInterval = null;
  }

  addPlayer(socketId, playerNumber) {
    if (this.players.length < 2) {
      this.players.push({ socketId, playerNumber });
      return true;
    }
    return false;
  }

  removePlayer(socketId) {
    this.players = this.players.filter(p => p.socketId !== socketId);
  }

  startGame() {
    if (this.players.length === 2 && !this.gameState.gameActive) {
      this.gameState.gameActive = true;
      this.gameLoop();
    }
  }

  stopGame() {
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
    }
    this.gameState.gameActive = false;
  }

  gameLoop() {
    this.gameInterval = setInterval(() => {
      this.updateGame();
      this.broadcastGameState();
    }, 1000 / 60); // 60 FPS
  }

  updateGame() {
    const state = this.gameState;
    const canvasWidth = 800;
    const canvasHeight = 600;
    const paddleHeight = 100;
    const paddleWidth = 10;
    const paddleMargin = 10;

    // Update ball position
    state.ballX += state.ballSpeedX;
    state.ballY += state.ballSpeedY;

    // Ball collision with top and bottom
    if (state.ballY - state.ballRadius < 0 || state.ballY + state.ballRadius > canvasHeight) {
      state.ballSpeedY *= -1;
      state.ballY = Math.max(state.ballRadius, Math.min(canvasHeight - state.ballRadius, state.ballY));
    }

    // Ball collision with paddles
    // Left paddle (Player 1)
    if (
      state.ballX - state.ballRadius < paddleMargin + paddleWidth &&
      state.ballY > state.paddle1Y &&
      state.ballY < state.paddle1Y + paddleHeight
    ) {
      state.ballSpeedX *= -1;
      state.ballX = paddleMargin + paddleWidth + state.ballRadius;
      // Add spin based on where the ball hits
      const hitPos = (state.ballY - state.paddle1Y) / paddleHeight;
      state.ballSpeedY = (hitPos - 0.5) * 8;
    }

    // Right paddle (Player 2)
    if (
      state.ballX + state.ballRadius > canvasWidth - paddleMargin - paddleWidth &&
      state.ballY > state.paddle2Y &&
      state.ballY < state.paddle2Y + paddleHeight
    ) {
      state.ballSpeedX *= -1;
      state.ballX = canvasWidth - paddleMargin - paddleWidth - state.ballRadius;
      // Add spin based on where the ball hits
      const hitPos = (state.ballY - state.paddle2Y) / paddleHeight;
      state.ballSpeedY = (hitPos - 0.5) * 8;
    }

    // Ball out of bounds - scoring
    if (state.ballX - state.ballRadius < 0) {
      state.paddle2Score++;
      this.resetBall();
    } else if (state.ballX + state.ballRadius > canvasWidth) {
      state.paddle1Score++;
      this.resetBall();
    }
  }

  resetBall() {
    const state = this.gameState;
    state.ballX = 400;
    state.ballY = 300;
    state.ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * 5;
    state.ballSpeedY = (Math.random() - 0.5) * 8;
  }

  updatePaddlePosition(playerNumber, paddleY) {
    if (playerNumber === 1) {
      this.gameState.paddle1Y = Math.max(0, Math.min(500, paddleY));
    } else if (playerNumber === 2) {
      this.gameState.paddle2Y = Math.max(0, Math.min(500, paddleY));
    }
  }

  broadcastGameState() {
    const sockets = io.sockets.sockets;
    this.players.forEach(player => {
      const socket = sockets.get(player.socketId);
      if (socket) {
        socket.emit('gameState', {
          ...this.gameState,
          playerNumber: player.playerNumber
        });
      }
    });
  }

  reset() {
    this.stopGame();
    this.gameState = {
      ballX: 400,
      ballY: 300,
      ballSpeedX: 5,
      ballSpeedY: 5,
      ballRadius: 8,
      paddle1Y: 250,
      paddle2Y: 250,
      paddle1Score: 0,
      paddle2Score: 0,
      gameActive: false
    };
  }
}

io.on('connection', (socket) => {
  console.log('New connection:', socket.id);

  socket.on('joinGame', (data) => {
    const roomId = data.roomId || 'default';
    socket.join(roomId);
    players[socket.id] = { roomId };

    if (!gameRooms[roomId]) {
      gameRooms[roomId] = new GameRoom(roomId);
    }

    const room = gameRooms[roomId];
    const playerNumber = room.players.length + 1;

    if (room.addPlayer(socket.id, playerNumber)) {
      socket.emit('playerNumber', { playerNumber });
      io.to(roomId).emit('playerJoined', { 
        playerNumber,
        playersInRoom: room.players.length
      });

      // Start game if 2 players are present
      if (room.players.length === 2) {
        room.startGame();
        io.to(roomId).emit('gameStarted');
      }
    } else {
      socket.emit('roomFull', { message: 'Room is full' });
    }
  });

  socket.on('paddleMove', (data) => {
    const player = players[socket.id];
    if (player) {
      const room = gameRooms[player.roomId];
      if (room) {
        const playerData = room.players.find(p => p.socketId === socket.id);
        if (playerData) {
          room.updatePaddlePosition(playerData.playerNumber, data.paddleY);
        }
      }
    }
  });

  socket.on('resetGame', () => {
    const player = players[socket.id];
    if (player) {
      const room = gameRooms[player.roomId];
      if (room) {
        room.reset();
        io.to(player.roomId).emit('gameReset');
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Disconnected:', socket.id);
    const player = players[socket.id];
    if (player) {
      const room = gameRooms[player.roomId];
      if (room) {
        room.removePlayer(socket.id);
        if (room.players.length === 0) {
          room.stopGame();
          delete gameRooms[player.roomId];
        } else {
          room.stopGame();
          io.to(player.roomId).emit('playerLeft');
        }
      }
    }
    delete players[socket.id];
  });
});

server.listen(PORT, () => {
  console.log(`Ping Pong server running on http://localhost:${PORT}`);
});
