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

// ── SOUND ENGINE (Web Audio API — no files needed) ──
const Audio = (() => {
  let ctx = null;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function play(type, opts = {}) {
    try {
      const c = getCtx();
      const { freq = 440, freq2 = freq, duration = 0.18, volume = 0.35,
              wave = 'sine', attack = 0.005, decay = 0.05, sustain = 0.6 } = opts;

      const osc  = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);

      osc.type = wave;
      osc.frequency.setValueAtTime(freq, c.currentTime);
      if (freq2 !== freq) osc.frequency.linearRampToValueAtTime(freq2, c.currentTime + duration);

      gain.gain.setValueAtTime(0, c.currentTime);
      gain.gain.linearRampToValueAtTime(volume, c.currentTime + attack);
      gain.gain.setValueAtTime(volume * sustain, c.currentTime + attack + decay);
      gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);

      osc.start(c.currentTime);
      osc.stop(c.currentTime + duration + 0.02);
    } catch(e) { /* AudioContext not available */ }
  }

  function chord(notes, opts = {}) {
    notes.forEach((freq, i) =>
      setTimeout(() => play('note', { ...opts, freq }), i * (opts.stagger || 0))
    );
  }

  return {
    // Soft wood-knock for normal move
    move() {
      play('move', { freq: 300, freq2: 220, duration: 0.12, volume: 0.28, wave: 'triangle', attack: 0.002, decay: 0.03 });
    },
    // Sharper click for captures
    capture() {
      play('cap1', { freq: 520, freq2: 180, duration: 0.14, volume: 0.38, wave: 'square', attack: 0.001, decay: 0.02, sustain: 0.2 });
      setTimeout(() => play('cap2', { freq: 200, freq2: 140, duration: 0.1, volume: 0.22, wave: 'triangle', attack: 0.001, decay: 0.02 }), 30);
    },
    // Tension sting for check
    check() {
      play('chk', { freq: 880, freq2: 660, duration: 0.22, volume: 0.3, wave: 'sawtooth', attack: 0.005, decay: 0.04, sustain: 0.5 });
    },
    // Castle — two-beat thud
    castle() {
      play('c1', { freq: 260, freq2: 220, duration: 0.13, volume: 0.3, wave: 'triangle', attack: 0.002 });
      setTimeout(() => play('c2', { freq: 200, freq2: 170, duration: 0.11, volume: 0.25, wave: 'triangle', attack: 0.002 }), 90);
    },
    // Promotion fanfare — ascending arpeggio
    promote() {
      [523, 659, 784, 1047].forEach((f, i) =>
        setTimeout(() => play('p', { freq: f, duration: 0.18, volume: 0.28, wave: 'sine', attack: 0.005, decay: 0.04, sustain: 0.5 }), i * 90)
      );
    },
    // Victory — major chord swell
    win() {
      const notes = [523, 659, 784, 1047];
      notes.forEach((f, i) =>
        setTimeout(() => play('w', { freq: f, duration: 0.55, volume: 0.22, wave: 'sine', attack: 0.02, decay: 0.08, sustain: 0.7 }), i * 110)
      );
      setTimeout(() => play('wHigh', { freq: 1568, duration: 0.7, volume: 0.18, wave: 'sine', attack: 0.03, decay: 0.1, sustain: 0.6 }), 480);
    },
    // Defeat — descending minor fall
    lose() {
      [494, 440, 392, 330].forEach((f, i) =>
        setTimeout(() => play('l', { freq: f, duration: 0.4, volume: 0.2, wave: 'sine', attack: 0.01, decay: 0.06, sustain: 0.65 }), i * 130)
      );
    },
    // Draw — neutral two-note resolution
    draw() {
      play('d1', { freq: 440, duration: 0.3, volume: 0.2, wave: 'sine', attack: 0.01, decay: 0.06 });
      setTimeout(() => play('d2', { freq: 392, duration: 0.35, volume: 0.18, wave: 'sine', attack: 0.01 }), 180);
    },
    // Resign — dull low thud
    resign() {
      play('r1', { freq: 180, freq2: 120, duration: 0.35, volume: 0.28, wave: 'triangle', attack: 0.005, decay: 0.08, sustain: 0.4 });
      setTimeout(() => play('r2', { freq: 130, freq2: 90, duration: 0.3, volume: 0.2, wave: 'triangle', attack: 0.002, decay: 0.06 }), 150);
    },
    // Illegal move — short buzzy error
    illegal() {
      play('ill', { freq: 160, freq2: 140, duration: 0.12, volume: 0.25, wave: 'sawtooth', attack: 0.001, decay: 0.02, sustain: 0.3 });
    }
  };
})();

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
    // Sound played on game_state response (so AI moves also get sound)
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
  const prevFen = lastMove ? null : null; // track for sound logic
  const wasMove = state.lastMove && (
    !lastMove ||
    state.lastMove.from !== lastMove.from ||
    state.lastMove.to   !== lastMove.to
  );

  lastMove = state.lastMove || lastMove;
  renderBoard(state.fen);
  updateStatus(state);
  updateHistory(state.history);
  updateTurnIndicators(state.turn);

  // ── Play sound for this state update ──
  if (state.isCheckmate) {
    // game_over handler plays win/lose — nothing here
  } else if (state.isStalemate || state.isDraw) {
    Audio.draw();
  } else if (wasMove && state.lastMove) {
    const m = state.lastMove;
    const flags = m.flags || '';
    if (flags.includes('k') || flags.includes('q')) {
      Audio.castle();                           // castling
    } else if (flags.includes('p')) {
      Audio.promote();                          // promotion
    } else if (flags.includes('c') || flags.includes('e')) {
      Audio.capture();                          // capture / en-passant
    } else {
      Audio.move();                             // normal move
    }
    if (state.inCheck && !state.isCheckmate) {
      setTimeout(() => Audio.check(), 80);      // layered check sting
    }
  }
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
  Audio.illegal();
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
  if (reason === 'resignation') {
    Audio.resign();
  } else if (reason === 'checkmate') {
    // Small delay so the last move sound plays first
    setTimeout(() => {
      if (!winner) return;
      const iWon = (winner === 'white' && myColor === 'white') ||
                   (winner === 'black' && myColor === 'black') ||
                   gameMode === 'local'; // local: always play win sound
      iWon ? Audio.win() : Audio.lose();
    }, 200);
  } else {
    Audio.draw();
  }
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
    if (confirm('Resign this game?')) {
      Audio.resign();
      socket.emit('resign', { roomId });
    }
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
