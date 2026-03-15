// Beautiful SVG chess pieces — hand-crafted for elegance
const PIECES = {

  // ── WHITE PIECES ──

  wK: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
    <g fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22.5 11.63V6M20 8h5" stroke-width="2"/>
      <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="#fff"/>
      <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V17s-3.5-7.5-12-7c-4.5.5-6.5 3-6.5 3-2 5 1 10.5 8 12.5 0 0 0 6.5 0 7"/>
      <path d="M11.5 30c5.5-3 15.5-3 21 0M11.5 33.5c5.5-3 15.5-3 21 0M11.5 37c5.5-3 15.5-3 21 0"/>
    </g>
  </svg>`,

  wQ: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
    <g fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="6" cy="12" r="2.75"/>
      <circle cx="14" cy="9" r="2.75"/>
      <circle cx="22.5" cy="8" r="2.75"/>
      <circle cx="31" cy="9" r="2.75"/>
      <circle cx="39" cy="12" r="2.75"/>
      <path d="M9 26c8.5-8.5 15.5-8.5 27 0l2.5-12.5L31 25l-.3-14.1-8.2 13.4-8.2-13.4L14 25 6.5 13.5 9 26z"/>
      <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4"/>
      <path d="M11 38.5a35 35 1 0 0 23 0" fill="none"/>
    </g>
  </svg>`,

  wR: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
    <g fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5"/>
      <path d="M34 14l-3 3H14l-3-3"/>
      <path d="M31 17v12.5H14V17"/>
      <path d="M31 29.5l1.5 2.5h-19l1.5-2.5"/>
      <path d="M11 14h23"/>
    </g>
  </svg>`,

  wB: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
    <g fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="22.5" cy="8" r="2.5"/>
      <path d="M22.5 10.5c-0.5 0-4.5 2-5.5 6.5C16 20.5 18 24 18 26.5c0 0-4.5 1.5-5 5.5H32c-.5-4-5-5.5-5-5.5 0-2.5 2-6 1-10C27 12.5 23 10.5 22.5 10.5z"/>
      <path d="M17.5 26h10M15 33.5h15"/>
      <path d="M9 39.5h27"/>
    </g>
  </svg>`,

  wN: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
    <g fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"/>
      <path d="M24 18c.38 5.12-9.33 6.99-8.5 16.5"/>
      <path d="M9.5 37.5c4-3.5 6-3 8-3"/>
      <path d="M14.5 29.5c-3-4.5-9.5-10-7.5-16.5s11-4.5 15 4"/>
      <path d="M21.5 9c0 2.5 4 4.5 5 7.5 1 3-1.5 7.5-1.5 7.5" fill="none"/>
      <circle cx="7.5" cy="14.5" r="1.5"/>
    </g>
  </svg>`,

  wP: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
    <g fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03C15.41 27.09 11 31.58 11 39.5H34c0-7.92-4.41-12.41-7.41-13.47A6.99 6.99 0 0 0 29 21c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"/>
    </g>
  </svg>`,

  // ── BLACK PIECES ──

  bK: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
    <g fill="#1a1a20" stroke="#fff" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22.5 11.63V6M20 8h5" stroke="#c9a84c" stroke-width="2"/>
      <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="#2a2a35" stroke="#aaa"/>
      <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V17s-3.5-7.5-12-7c-4.5.5-6.5 3-6.5 3-2 5 1 10.5 8 12.5 0 0 0 6.5 0 7" fill="#2a2a35" stroke="#888"/>
      <path d="M11.5 30c5.5-3 15.5-3 21 0M11.5 33.5c5.5-3 15.5-3 21 0M11.5 37c5.5-3 15.5-3 21 0" stroke="#888"/>
    </g>
  </svg>`,

  bQ: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
    <g fill="#2a2a35" stroke="#888" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="6" cy="12" r="2.75" fill="#1a1a25"/>
      <circle cx="14" cy="9" r="2.75" fill="#1a1a25"/>
      <circle cx="22.5" cy="8" r="2.75" fill="#1a1a25"/>
      <circle cx="31" cy="9" r="2.75" fill="#1a1a25"/>
      <circle cx="39" cy="12" r="2.75" fill="#1a1a25"/>
      <path d="M9 26c8.5-8.5 15.5-8.5 27 0l2.5-12.5L31 25l-.3-14.1-8.2 13.4-8.2-13.4L14 25 6.5 13.5 9 26z"/>
      <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4"/>
      <path d="M11 38.5a35 35 1 0 0 23 0" fill="none" stroke="#aaa"/>
    </g>
  </svg>`,

  bR: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
    <g fill="#2a2a35" stroke="#888" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5"/>
      <path d="M34 14l-3 3H14l-3-3"/>
      <path d="M31 17v12.5H14V17"/>
      <path d="M31 29.5l1.5 2.5h-19l1.5-2.5"/>
      <path d="M11 14h23" stroke="#aaa"/>
    </g>
  </svg>`,

  bB: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
    <g fill="#2a2a35" stroke="#888" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="22.5" cy="8" r="2.5" fill="#1a1a25"/>
      <path d="M22.5 10.5c-0.5 0-4.5 2-5.5 6.5C16 20.5 18 24 18 26.5c0 0-4.5 1.5-5 5.5H32c-.5-4-5-5.5-5-5.5 0-2.5 2-6 1-10C27 12.5 23 10.5 22.5 10.5z"/>
      <path d="M17.5 26h10M15 33.5h15" stroke="#aaa"/>
      <path d="M9 39.5h27" stroke="#aaa"/>
    </g>
  </svg>`,

  bN: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
    <g fill="#2a2a35" stroke="#888" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"/>
      <path d="M24 18c.38 5.12-9.33 6.99-8.5 16.5" stroke="#aaa"/>
      <path d="M9.5 37.5c4-3.5 6-3 8-3"/>
      <path d="M14.5 29.5c-3-4.5-9.5-10-7.5-16.5s11-4.5 15 4"/>
      <path d="M21.5 9c0 2.5 4 4.5 5 7.5 1 3-1.5 7.5-1.5 7.5" fill="none"/>
      <circle cx="7.5" cy="14.5" r="1.5" fill="#aaa"/>
    </g>
  </svg>`,

  bP: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
    <g fill="#2a2a35" stroke="#888" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03C15.41 27.09 11 31.58 11 39.5H34c0-7.92-4.41-12.41-7.41-13.47A6.99 6.99 0 0 0 29 21c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"/>
    </g>
  </svg>`,
};

window.PIECES = PIECES;
