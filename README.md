# 🏓 Online Ping Pong Game

A real-time multiplayer ping pong game built with Node.js, Express, and Socket.IO. Play against other players online with smooth physics and responsive controls.

## Features

✨ **Real-time Multiplayer** - Connect with another player in the same room

🎮 **Smooth Gameplay** - 60 FPS game loop with physics-based ball movement

🎯 **Paddle Spin** - Hit the ball at different paddle positions to add spin

📊 **Score Tracking** - Keep track of scores during the match

🌐 **Room-Based** - Join specific game rooms by ID

⌨️ **Keyboard Controls** - Use W/S or Arrow Keys to move paddles

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/wusyuname/online-pong-game.git
   cd online-pong-game
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```
   The game will be available at `http://localhost:3000`

## How to Play

### Starting a Game

1. Open the game in your browser: `http://localhost:3000`
2. Enter a **Room ID** (both players must use the same ID)
3. Click **Join Game**
4. Wait for another player to join the same room
5. Once 2 players are in the room, the game starts automatically

### Controls

- **W** or **Arrow Up** - Move paddle up
- **S** or **Arrow Down** - Move paddle down
- **Reset Game** - Start a new match (appears after game starts)

### Game Rules

- The left player (Player 1) controls the left paddle (green)
- The right player (Player 2) controls the right paddle (red)
- The ball bounces off paddles and walls
- If the ball passes your paddle, the opponent scores
- First to score, wins the rally
- Click "Reset Game" to start a new match

## Game Mechanics

### Ball Physics
- Ball moves across the canvas at constant speed
- Bounces off top and bottom walls
- Reflects off paddles with angle based on hit position
- Ball position determines if it's "in" or "out"

### Paddle Spin
- Hit the ball at the **top of your paddle** for upward spin
- Hit at the **middle** for straight shots
- Hit at the **bottom** for downward spin

## Project Structure

```
online-pong-game/
├── server.js           # Express server with Socket.IO
├── package.json        # Project dependencies
├── public/
│   ├── index.html      # Game HTML
│   ├── game.js         # Client-side game logic
│   └── style.css       # Game styling
└── README.md           # This file
```

## Tech Stack

- **Backend**: Node.js, Express, Socket.IO
- **Frontend**: HTML5 Canvas, JavaScript
- **Communication**: WebSockets

## Development

For development with auto-restart:

```bash
npm install --save-dev nodemon
npm run dev
```

## Deployment

The game can be deployed to services like:

- **Heroku**
- **Railway**
- **Render**
- **AWS**
- **DigitalOcean**

Make sure to set the `PORT` environment variable.

## Future Enhancements

- [ ] Single-player vs AI mode
- [ ] Best of N series
- [ ] Leaderboard system
- [ ] Difficulty levels
- [ ] Sound effects
- [ ] Power-ups
- [ ] Mobile touch controls
- [ ] Spectator mode

## License

MIT

## Contributing

Feel free to fork this project and submit pull requests for any improvements!

## Support

If you encounter any issues, please open an issue on GitHub.

---

**Enjoy the game! 🎮**
