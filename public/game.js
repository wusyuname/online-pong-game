const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const score1El = document.getElementById('score1');
const score2El = document.getElementById('score2');
const joinBtn = document.getElementById('joinBtn');
const resetBtn = document.getElementById('resetBtn');
const roomInput = document.getElementById('roomId');

let socket;
let gameState = null;
let playerNumber = null;
let gameActive = false;
let localPaddleY = 250;
const paddleHeight = 100;
const paddleWidth = 10;

// Keyboard controls
const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.key.toUpperCase()] = true;
  if (e.key === ' ') e.preventDefault(); // Prevent space from scrolling
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toUpperCase()] = false;
});

// Initialize socket connection
function initializeSocket() {
  socket = io();

  socket.on('connect', () => {
    console.log('Connected to server');
  });

  socket.on('playerNumber', (data) => {
    playerNumber = data.playerNumber;
    console.log('You are Player', playerNumber);
    statusEl.textContent = `You are Player ${playerNumber}. Waiting for opponent...`;
  });

  socket.on('playerJoined', (data) => {
    console.log(`Player ${data.playerNumber} joined. Players in room: ${data.playersInRoom}`);
    statusEl.textContent = `${data.playersInRoom} player(s) in room...`;
  });

  socket.on('gameStarted', () => {
    console.log('Game started!');
    gameActive = true;
    statusEl.textContent = 'Game Started! Play!';
    joinBtn.textContent = 'Reconnect';
    joinBtn.disabled = false;
    resetBtn.style.display = 'inline-block';
  });

  socket.on('gameState', (state) => {
    gameState = state;
    score1El.textContent = state.paddle1Score;
    score2El.textContent = state.paddle2Score;
  });

  socket.on('gameReset', () => {
    gameActive = true;
    statusEl.textContent = 'Game Reset! Play!';
    resetBtn.style.display = 'inline-block';
  });

  socket.on('playerLeft', () => {
    gameActive = false;
    statusEl.textContent = 'Opponent disconnected. Waiting for new player...';
    resetBtn.style.display = 'none';
  });

  socket.on('roomFull', (data) => {
    statusEl.textContent = data.message + ' Try another room ID.';
  });

  socket.on('disconnect', () => {
    gameActive = false;
    statusEl.textContent = 'Disconnected from server';
    resetBtn.style.display = 'none';
  });
}

function joinGame() {
  const roomId = roomInput.value || 'default';
  socket.emit('joinGame', { roomId });
  joinBtn.disabled = true;
  joinBtn.textContent = 'Joining...';
}

function resetGame() {
  socket.emit('resetGame');
}

// Update paddle position based on keyboard input
function updatePaddlePosition() {
  const speed = 6;
  
  if (keys['W'] || keys['ARROWUP']) {
    localPaddleY = Math.max(0, localPaddleY - speed);
  }
  if (keys['S'] || keys['ARROWDOWN']) {
    localPaddleY = Math.min(canvas.height - paddleHeight, localPaddleY + speed);
  }

  // Send paddle position to server
  if (socket) {
    socket.emit('paddleMove', { paddleY: localPaddleY });
  }
}

// Draw functions
function drawPaddle(x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);
}

function drawBall(x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawCanvas() {
  // Clear canvas
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw center line
  ctx.strokeStyle = '#444';
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);

  if (!gameState) return;

  // Draw paddles
  drawPaddle(10, gameState.paddle1Y, paddleWidth, paddleHeight, '#00ff88');
  drawPaddle(canvas.width - 10 - paddleWidth, gameState.paddle2Y, paddleWidth, paddleHeight, '#ff0055');

  // Draw ball
  drawBall(gameState.ballX, gameState.ballY, gameState.ballRadius, '#ffff00');

  // Draw scores on canvas
  ctx.fillStyle = '#fff';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(gameState.paddle1Score, canvas.width / 4, 50);
  ctx.fillText(gameState.paddle2Score, (canvas.width / 4) * 3, 50);
}

// Game loop
function gameLoop() {
  updatePaddlePosition();
  drawCanvas();
  requestAnimationFrame(gameLoop);
}

// Initialize
initializeSocket();
gameLoop();
