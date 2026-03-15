/* global io, PIECES */

const socket = io();

// ── STATE ──
let roomId = null;
let myColor = null;
let gameMode = null;
let selectedSquare = null;
let validMoves = [];
let lastMove = null;
let isSpectator = false;
let pendingPromotion = null;

// ── DOM HELPERS ──
const $ = id => document.getElementById(id);
const show = id => { const el = $(id); el && el.classList.add('active'); };
const hide = id => { const el = $(id); el && el.classList.remove('active'); };
const showScreen = id => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  show(id);
};

// ── TOAST ──
function toast(msg, type = 'info', duration = 3000) {
  const t = $('toast');
  t.textContent = msg;
  t.className = `toast ${type}`;
  setTimeout(() => t.classList.add('visible'), 10);
  setTimeout(() => t.classList.remove('visible'), duration);
}

// ── BUILD BOARD ──
function buildBoard() {
  const board = $('chess-board');
  board.innerHTML = '';
  const files = ['a','b','c','d','e','f','g','h'];

  for (let rank = 8; rank >= 1; rank--) {
    for (let fileIdx = 0; fileIdx < 8; fileIdx++) {
      const file = files[fileIdx];
      const sqId = `${file}${rank}`;
      const isLight = (fileIdx + rank) % 2 !== 0;

      const sq = document.createElement('div');
      sq.className = `square ${isLight ? 'light' : 'dark'}`;
      sq.dataset.square = sqId;
      sq.addEventListener('click', () => onSquareClick(sqId));
      board.appendChild(sq);
    }
  }
}

// ── UPDATE BOARD FROM FEN ──
function renderBoard(fen) {
  const files = ['a','b','c','d','e','f','g','h'];
  // Parse FEN position
  const [position] = fen.split(' ');
  const rows = position.split('/');

  // Clear pieces
  document.querySelectorAll('.square').forEach(sq => {
    sq.innerHTML = '';
    sq.classList.remove('last-move-from','last-move-to','in-check','selected','valid-move','valid-capture');
  });

  // Map FEN piece chars
  const pieceMap = {
    K:'wK', Q:'wQ', R:'wR', B:'wB', N:'wN', P:'wP',
    k:'bK', q:'bQ', r:'bR', b:'bB', n:'bN', p:'bP'
  };

  let rank = 8;
  for (const row of rows) {
    let fileIdx = 0;
    for (const ch of row) {
      if (ch >= '1' && ch <= '8') {
        fileIdx += parseInt(ch);
      } else {
        const file = files[fileIdx];
        const sqEl = document.querySelector(`[data-square="${file}${rank}"]`);
        if (sqEl && pieceMap[ch]) {
          sqEl.innerHTML = `<span class="piece">${PIECES[pieceMap[ch]]}</span>`;
        }
        fileIdx++;
      }
    }
    rank--;
  }

  // Highlight last move
  if (lastMove) {
    const fromEl = document.querySelector(`[data-square="${lastMove.from}"]`);
    const toEl   = document.querySelector(`[data-square="${lastMove.to}"]`);
    if (fromEl) fromEl.classList.add('last-move-from');
    if (toEl)   toEl.classList.add('last-move-to');
  }
}

// ── SQUARE CLICK ──
function onSquareClick(square) {
  if (isSpectator) return;

  // If promotion pending, ignore
  if (pendingPromotion) return;

  // If a valid move, execute it
  if (selectedSquare && validMoves.includes(square)) {
    // Check pawn promotion
    const fromEl = document.querySelector(`[data-square="${selectedSquare}"]`);
    const isPawn = fromEl && fromEl.querySelector('.piece svg') &&
      (selectedSquare[1] === '7' && myColor === 'white' || selectedSquare[1] === '2' && myColor === 'black');
    const isPromoRank = (myColor === 'white' && square[1] === '8') || (myColor === 'black' && square[1] === '1');

    if (isPawn && isPromoRank) {
      pendingPromotion = { from: selectedSquare, to: square };
      showPromotion();
      return;
    }

    socket.emit('make_move', { roomId, move: { from: selectedSquare, to: square } });
    clearSelection();
    return;
  }

  // Deselect
  if (selectedSquare === square) {
    clearSelection();
    return;
  }

  // Select a piece
  clearSelection();
  const sqEl = document.querySelector(`[data-square="${square}"]`);
  if (!sqEl || !sqEl.querySelector('.piece')) return;

  // Only select own pieces
  const svgEl = sqEl.querySelector('svg');
  if (!svgEl) return;

  // Determine piece color by fill
  const stroke = svgEl.querySelector('g')?.getAttribute('fill');
  const pieceIsWhite = !stroke || stroke.includes('fff') || stroke.includes('#f') || stroke === '#fff' || stroke === 'white';
  const pieceColor = pieceIsWhite ? 'white' : 'black';

  if (myColor && pieceColor !== myColor) return;

  selectedSquare = square;
  sqEl.classList.add('selected');
  socket.emit('get_moves', { roomId, square });
}

function clearSelection() {
  selectedSquare = null;
  validMoves = [];
  document.querySelectorAll('.square').forEach(sq => {
    sq.classList.remove('selected','valid-move','valid-capture');
  });
}

// ── VALID MOVES HIGHLIGHT ──
socket.on('valid_moves', ({ moves }) => {
  validMoves = moves;
  moves.forEach(sq => {
    const sqEl = document.querySelector(`[data-square="${sq}"]`);
    if (!sqEl) return;
    if (sqEl.querySelector('.piece')) {
      sqEl.classList.add('valid-capture');
    } else {
      sqEl.classList.add('valid-move');
    }
  });
});

// ── GAME STATE UPDATE ──
socket.on('game_state', (state) => {
  lastMove = state.lastMove || lastMove;
  renderBoard(state.fen);
  updateStatus(state);
  updateHistory(state.history);
  updateTurnIndicators(state.turn);
});

function updateStatus(state) {
  const statusEl = $('status-text');
  if (!statusEl) return;

  if (state.isCheckmate) {
    const winner = state.turn === 'w' ? 'Black' : 'White';
    statusEl.innerHTML = `<span>Checkmate!</span> ${winner} wins!`;
    showGameOver(winner, 'checkmate');
  } else if (state.isStalemate) {
    statusEl.innerHTML = `<span>Stalemate</span> — Draw`;
    showGameOver(null, 'stalemate');
  } else if (state.isDraw) {
    statusEl.innerHTML = `<span>Draw</span>`;
    showGameOver(null, 'draw');
  } else if (state.inCheck) {
    const side = state.turn === 'w' ? 'White' : 'Black';
    statusEl.innerHTML = `<span>${side} is in Check!</span>`;
    // Highlight king
    highlightKingCheck(state.fen, state.turn);
  } else {
    const side = state.turn === 'w' ? 'White' : 'Black';
    statusEl.innerHTML = `${side}'s turn to move`;
  }
}

function highlightKingCheck(fen, turn) {
  const files = ['a','b','c','d','e','f','g','h'];
  const [pos] = fen.split(' ');
  const kingChar = turn === 'w' ? 'K' : 'k';
  const rows = pos.split('/');
  let rank = 8;
  for (const row of rows) {
    let fileIdx = 0;
    for (const ch of row) {
      if (ch >= '1' && ch <= '8') fileIdx += parseInt(ch);
      else {
        if (ch === kingChar) {
          const sq = document.querySelector(`[data-square="${files[fileIdx]}${rank}"]`);
          if (sq) sq.classList.add('in-check');
        }
        fileIdx++;
      }
    }
    rank--;
  }
}

function updateHistory(history) {
  const container = $('history-moves');
  if (!container) return;
  container.innerHTML = '';

  for (let i = 0; i < history.length; i += 2) {
    const num = document.createElement('div');
    num.className = 'history-move-num';
    num.textContent = `${Math.floor(i/2)+1}.`;
    container.appendChild(num);

    const w = document.createElement('div');
    w.className = 'history-move';
    w.textContent = history[i] || '';
    container.appendChild(w);

    const b = document.createElement('div');
    b.className = 'history-move';
    b.textContent = history[i+1] || '';
    container.appendChild(b);
  }

  container.scrollTop = container.scrollHeight;
}

function updateTurnIndicators(turn) {
  const wCard = $('white-player-card');
  const bCard = $('black-player-card');
  const wDot = $('white-turn-dot');
  const bDot = $('black-turn-dot');

  if (wCard && bCard) {
    wCard.classList.toggle('active', turn === 'w');
    bCard.classList.toggle('active', turn === 'b');
  }
  if (wDot) wDot.style.display = turn === 'w' ? 'block' : 'none';
  if (bDot) bDot.style.display = turn === 'b' ? 'block' : 'none';
}

// ── PROMOTION ──
function showPromotion() {
  const modal = $('promotion-modal');
  if (!modal) return;
  const grid = $('promotion-grid');
  const color = myColor === 'white' ? 'w' : 'b';
  const pieces = ['Q','R','B','N'];
  grid.innerHTML = '';
  pieces.forEach(p => {
    const div = document.createElement('div');
    div.className = 'promotion-piece';
    div.innerHTML = PIECES[`${color}${p}`];
    div.addEventListener('click', () => {
      if (pendingPromotion) {
        socket.emit('make_move', {
          roomId,
          move: { from: pendingPromotion.from, to: pendingPromotion.to, promotion: p.toLowerCase() }
        });
        pendingPromotion = null;
        clearSelection();
        modal.classList.remove('active');
      }
    });
    grid.appendChild(div);
  });
  modal.classList.add('active');
}

// ── GAME OVER ──
function showGameOver(winner, reason) {
  const overlay = $('game-over-overlay');
  const icon = $('game-over-icon');
  const title = $('game-over-title');
  const sub = $('game-over-sub');

  const reasonText = {
    checkmate: 'by checkmate',
    stalemate: 'by stalemate',
    draw: 'by draw',
    resignation: 'by resignation'
  };

  if (winner) {
    icon.textContent = winner === 'white' ? '♔' : '♚';
    title.textContent = `${winner.charAt(0).toUpperCase()+winner.slice(1)} Wins`;
  } else {
    icon.textContent = '🤝';
    title.textContent = 'Draw';
  }
  sub.textContent = reasonText[reason] || '';
  overlay.classList.add('active');
}

// ── SOCKET EVENTS ──
socket.on('room_created', ({ roomId: id, color }) => {
  roomId = id;
  myColor = color;
  const chip = $('room-id-chip');
  if (chip) chip.textContent = id;
  const roomDisplay = $('room-id-display');
  if (roomDisplay) roomDisplay.textContent = id;

  if (gameMode === 'pvp') {
    toast(`Room created! Share code: ${id}`, 'success', 5000);
    $('status-text').textContent = 'Waiting for opponent…';
  } else {
    toast('Game started! You play White.', 'success');
  }
});

socket.on('room_joined', ({ roomId: id, color }) => {
  roomId = id;
  myColor = color;
  toast('Joined game as Black!', 'success');
});

socket.on('joined_as_spectator', () => {
  isSpectator = true;
  myColor = null;
  toast('Watching as spectator', 'info');
});

socket.on('game_start', () => {
  toast('Game started! Good luck!', 'success');
});

socket.on('invalid_move', () => {
  toast('Invalid move', 'error', 1500);
  clearSelection();
});

socket.on('draw_offered', () => {
  if (confirm('Opponent offers a draw. Accept?')) {
    socket.emit('accept_draw', { roomId });
  }
});

socket.on('opponent_disconnected', () => {
  toast('Opponent disconnected', 'error');
});

socket.on('game_over', ({ reason, winner }) => {
  showGameOver(winner, reason);
});

socket.on('error', ({ message }) => {
  toast(message, 'error');
});

// ── HOME SCREEN ACTIONS ──
document.addEventListener('DOMContentLoaded', () => {
  buildBoard();

  // Mode buttons
  $('btn-vs-ai').addEventListener('click', () => {
    gameMode = 'ai';
    showScreen('game-screen');
    socket.emit('create_room', { mode: 'ai' });
  });

  $('btn-vs-player').addEventListener('click', () => {
    show('join-modal');
  });

  $('btn-create-room').addEventListener('click', () => {
    gameMode = 'pvp';
    hide('join-modal');
    showScreen('game-screen');
    socket.emit('create_room', { mode: 'pvp' });
  });

  $('btn-join-existing').addEventListener('click', () => {
    const code = $('room-code-input').value.trim().toUpperCase();
    if (!code) return toast('Enter a room code', 'error');
    gameMode = 'pvp';
    hide('join-modal');
    showScreen('game-screen');
    socket.emit('join_room', { roomId: code });
  });

  $('btn-cancel-join').addEventListener('click', () => hide('join-modal'));

  // Sidebar game actions
  $('btn-resign').addEventListener('click', () => {
    if (!roomId || isSpectator) return;
    if (confirm('Resign this game?')) socket.emit('resign', { roomId });
  });

  $('btn-offer-draw').addEventListener('click', () => {
    if (!roomId || isSpectator) return;
    socket.emit('offer_draw', { roomId });
    toast('Draw offered', 'info');
  });

  $('btn-new-game').addEventListener('click', () => {
    location.reload();
  });

  $('btn-copy-room').addEventListener('click', () => {
    const code = $('room-id-display')?.textContent;
    if (code) {
      navigator.clipboard.writeText(code).then(() => toast(`Copied: ${code}`, 'success'));
    }
  });

  // Sidebar logo → home
  document.querySelector('.sidebar-logo')?.addEventListener('click', () => {
    location.reload();
  });

  // Game over replay
  $('btn-play-again')?.addEventListener('click', () => location.reload());
  $('btn-go-home')?.addEventListener('click', () => location.reload());
});
