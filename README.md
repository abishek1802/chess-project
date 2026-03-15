# ♛ Grandmaster Chess

A beautiful, dark-themed chess web app powered by Node.js and Socket.io.

## Features

- ♟ **Player vs AI** — Challenge the computer (greedy AI with captures + checks priority)
- ⚔️ **Player vs Friend** — Real-time multiplayer via WebSockets + shareable room codes
- 👁 **Spectator mode** — Watch live games
- ✨ **Beautiful UI** — Dark dramatic theme, hand-crafted SVG pieces, gold accents
- 📜 **Move history** — Full algebraic notation sidebar
- ♟ **Full chess rules** — Castling, en passant, promotion modal, check highlighting

## Tech Stack

| Layer | Technology |
|-------|------------|
| Server | Node.js + Express |
| Realtime | Socket.io |
| Chess logic | chess.js |
| Frontend | Vanilla JS + CSS |
| Fonts | Playfair Display + DM Sans |

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start

# For development with auto-reload:
npm run dev
```

Then open **http://localhost:3000** in your browser.

## How to Play

### vs AI
1. Click **Play vs Computer**
2. You play White, AI responds as Black

### vs Friend
1. Click **Play vs Friend** → **Create New Room**
2. Share the 8-character room code with your friend
3. Friend clicks **Play vs Friend** → enters the code → **Join Room**

## Project Structure

```
chess-app/
├── server.js           # Express + Socket.io server
├── package.json
└── public/
    ├── index.html      # Main HTML (all screens)
    ├── css/
    │   └── style.css   # Full dark theme CSS
    └── js/
        ├── pieces.js   # SVG chess piece definitions
        └── app.js      # Client-side game logic
```

## Upgrading the AI

The current AI (`getAIMove` in `server.js`) uses a greedy strategy. To add minimax:

```js
// Replace getAIMove with a minimax + alpha-beta pruning function
// npm install chess.js (already installed)
// Depth 3-4 gives a decent opponent
```

## License

MIT
