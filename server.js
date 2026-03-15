const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Chess } = require('chess.js');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// In-memory game rooms
const rooms = {};

// Simple AI: picks a random legal move (can be upgraded to minimax)
function getAIMove(chess) {
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;

  // Prioritize captures, then checks, then random
  const captures = moves.filter(m => m.flags.includes('c') || m.flags.includes('e'));
  const checks = moves.filter(m => {
    chess.move(m);
    const isCheck = chess.inCheck();
    chess.undo();
    return isCheck;
  });

  let pool = checks.length > 0 ? checks : captures.length > 0 ? captures : moves;
  return pool[Math.floor(Math.random() * pool.length)];
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Create a new game room
  socket.on('create_room', ({ mode }) => {
    const roomId = uuidv4().slice(0, 8).toUpperCase();
    const chess = new Chess();
    rooms[roomId] = {
      chess,
      mode, // 'pvp' or 'ai'
      players: { white: socket.id, black: mode === 'ai' ? 'AI' : null },
      spectators: []
    };
    socket.join(roomId);
    socket.emit('room_created', { roomId, color: 'white' });
    socket.emit('game_state', { fen: chess.fen(), turn: chess.turn(), history: chess.history() });
  });

  // Join existing room
  socket.on('join_room', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return socket.emit('error', { message: 'Room not found' });
    if (room.players.black && room.players.black !== 'AI') {
      room.spectators.push(socket.id);
      socket.join(roomId);
      socket.emit('joined_as_spectator', { roomId });
      socket.emit('game_state', { fen: room.chess.fen(), turn: room.chess.turn(), history: room.chess.history() });
      return;
    }
    room.players.black = socket.id;
    socket.join(roomId);
    socket.emit('room_joined', { roomId, color: 'black' });
    io.to(roomId).emit('game_start', { fen: room.chess.fen() });
    io.to(roomId).emit('game_state', { fen: room.chess.fen(), turn: room.chess.turn(), history: room.chess.history() });
  });

  // Handle a move
  socket.on('make_move', ({ roomId, move }) => {
    const room = rooms[roomId];
    if (!room) return;

    const chess = room.chess;
    try {
      const result = chess.move(move);
      if (!result) return socket.emit('invalid_move');

      const state = {
        fen: chess.fen(),
        turn: chess.turn(),
        lastMove: move,
        history: chess.history(),
        inCheck: chess.inCheck(),
        isCheckmate: chess.isCheckmate(),
        isStalemate: chess.isStalemate(),
        isDraw: chess.isDraw(),
        isGameOver: chess.isGameOver()
      };

      io.to(roomId).emit('game_state', state);

      // If AI mode and it's black's turn
      if (room.mode === 'ai' && chess.turn() === 'b' && !chess.isGameOver()) {
        setTimeout(() => {
          const aiMove = getAIMove(chess);
          if (aiMove) {
            chess.move(aiMove);
            const aiState = {
              fen: chess.fen(),
              turn: chess.turn(),
              lastMove: { from: aiMove.from, to: aiMove.to, promotion: aiMove.promotion },
              history: chess.history(),
              inCheck: chess.inCheck(),
              isCheckmate: chess.isCheckmate(),
              isStalemate: chess.isStalemate(),
              isDraw: chess.isDraw(),
              isGameOver: chess.isGameOver()
            };
            io.to(roomId).emit('game_state', aiState);
          }
        }, 400);
      }
    } catch (e) {
      socket.emit('invalid_move');
    }
  });

  // Request valid moves for a square
  socket.on('get_moves', ({ roomId, square }) => {
    const room = rooms[roomId];
    if (!room) return;
    const moves = room.chess.moves({ square, verbose: true });
    socket.emit('valid_moves', { moves: moves.map(m => m.to) });
  });

  // Resign
  socket.on('resign', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;
    const color = room.players.white === socket.id ? 'white' : 'black';
    io.to(roomId).emit('game_over', { reason: 'resignation', winner: color === 'white' ? 'black' : 'white' });
    delete rooms[roomId];
  });

  // Offer/accept draw
  socket.on('offer_draw', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;
    const opponent = room.players.white === socket.id ? room.players.black : room.players.white;
    if (opponent && opponent !== 'AI') io.to(opponent).emit('draw_offered');
  });

  socket.on('accept_draw', ({ roomId }) => {
    io.to(roomId).emit('game_over', { reason: 'draw', winner: null });
    delete rooms[roomId];
  });

  socket.on('disconnect', () => {
    // Notify rooms of disconnection
    for (const [roomId, room] of Object.entries(rooms)) {
      if (room.players.white === socket.id || room.players.black === socket.id) {
        io.to(roomId).emit('opponent_disconnected');
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`♟️  Chess server running at http://localhost:${PORT}`);
});
