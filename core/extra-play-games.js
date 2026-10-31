(() => {
  'use strict';

  const CSS = [
    '.sc-pg-section .sc-extra-gamehead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}',
    '.sc-pg-section .sc-extra-gamehead small{display:block;margin-bottom:5px;color:#d8b4fe;font-size:9px;font-weight:850;letter-spacing:.13em;text-transform:uppercase}',
    '.sc-pg-section .sc-extra-gamehead h3{margin:0;color:#fff;font-size:clamp(18px,2.8vw,23px);font-weight:850}',
    '.sc-pg-section .sc-extra-actions{display:flex;justify-content:flex-end;gap:7px;flex-wrap:wrap;margin:0 0 13px}',
    '.sc-pg-section .sc-extra-btn{min-height:35px;padding:0 12px;border:1px solid rgba(255,255,255,.16);border-radius:10px;background:rgba(255,255,255,.055);color:#f4effb;font:750 10px Inter,system-ui,sans-serif;cursor:pointer}',
    '.sc-pg-section .sc-extra-btn.primary{border-color:transparent;background:linear-gradient(110deg,#7c3aed,#db2777);color:#fff}',
    '.sc-pg-section .sc-extra-status{min-height:22px;margin:0 0 14px;color:#c9c1d7;font-size:12px;line-height:1.6}',
    '.sc-pg-section .sc-extra-stats{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin:12px 0;color:#aaa1bd;font-size:10px;text-align:center}',
    '.sc-pg-section .sc-extra-stats strong{display:block;margin-top:4px;color:#fff;font-size:17px;font-variant-numeric:tabular-nums}',
    '.sc-pg-section .sc-extra-timer{width:min(100%,720px);margin:14px auto 10px;padding:12px 15px;border:1px solid rgba(216,180,254,.22);border-radius:12px;background:rgba(124,58,237,.1)}',
    '.sc-pg-section .sc-extra-timer>div:first-child{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:9px}',
    '.sc-pg-section .sc-extra-timer span{color:#c4b5fd;font-size:10px;font-weight:850;letter-spacing:.1em}',
    '.sc-pg-section .sc-extra-timer strong{color:#fff;font-size:22px;font-variant-numeric:tabular-nums}',
    '.sc-pg-section .sc-extra-timer-track{height:7px;overflow:hidden;border-radius:99px;background:rgba(255,255,255,.12)}',
    '.sc-pg-section .sc-extra-timer-track i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#8b5cf6,#ec4899,#fb923c);transition:width .2s linear}',
    '.sc-pg-section .sc-extra-typing-prompt{min-height:105px;max-height:170px;overflow:hidden}',
    '.sc-pg-section .sc-extra-typing-prompt .typing-next{border-bottom:2px solid #f0abfc;color:#fff}',
    '.sc-pg-section .sc-extra-muted{color:#aaa1bd;font-size:10px;line-height:1.6}.sc-pg-section .sc-extra-center{text-align:center}',
    '.sc-pg-section .sc-extra-word-input{display:block;width:min(100%,330px);height:48px;margin:16px auto 9px;padding:0 14px;border:1px solid rgba(216,180,254,.38);border-radius:12px;background:#191526;color:#fff;font:750 18px Inter,system-ui,sans-serif;text-align:center;letter-spacing:.12em;outline:none}',
    '.sc-pg-section .sc-extra-word-input:focus,.sc-pg-section .sc-extra-typing-input:focus{border-color:#c4b5fd;box-shadow:0 0 0 3px rgba(196,181,253,.12)}',
    '.sc-pg-section .sc-extra-tiles{display:flex;justify-content:center;gap:6px;margin:7px auto;flex-wrap:nowrap}',
    '.sc-pg-section .sc-extra-tile{display:grid;place-items:center;width:48px;height:48px;border:1px solid rgba(255,255,255,.2);border-radius:8px;background:rgba(255,255,255,.05);color:#fff;font-size:18px;font-weight:850}',
    '.sc-pg-section .sc-extra-tile.exact{background:#16845b;border-color:#16845b}.sc-pg-section .sc-extra-tile.present{background:#a87519;border-color:#a87519}.sc-pg-section .sc-extra-tile.absent{background:#393445;border-color:#393445}',
    '.sc-pg-section .sc-extra-toggle{display:flex;justify-content:center;gap:7px;margin:12px 0}.sc-pg-section .sc-extra-toggle button{min-height:34px;padding:0 13px;border:1px solid rgba(255,255,255,.16);border-radius:9px;background:rgba(255,255,255,.04);color:#ddd5e9;font:750 10px Inter,system-ui,sans-serif;cursor:pointer}.sc-pg-section .sc-extra-toggle button[aria-pressed=true]{background:rgba(124,58,237,.25);border-color:#a78bfa;color:#fff}',
    '.sc-pg-section .sc-extra-board2048{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;width:min(100%,390px);aspect-ratio:1;margin:14px auto;padding:9px;border-radius:14px;background:#342d40;touch-action:none}',
    '.sc-pg-section .sc-extra-2048-cell{display:grid;place-items:center;min-width:0;border-radius:9px;background:rgba(255,255,255,.08);color:#352b42;font-size:clamp(17px,4vw,27px);font-weight:900;font-variant-numeric:tabular-nums}',
    '.sc-pg-section .sc-extra-2048-cell[data-v="2"]{background:#eee4da}.sc-pg-section .sc-extra-2048-cell[data-v="4"]{background:#ede0c8}.sc-pg-section .sc-extra-2048-cell[data-v="8"]{background:#f2b179;color:#fff}.sc-pg-section .sc-extra-2048-cell[data-v="16"]{background:#f59563;color:#fff}.sc-pg-section .sc-extra-2048-cell[data-v="32"]{background:#f67c5f;color:#fff}.sc-pg-section .sc-extra-2048-cell[data-v="64"]{background:#f65e3b;color:#fff}.sc-pg-section .sc-extra-2048-cell[data-v="128"],.sc-pg-section .sc-extra-2048-cell[data-v="256"],.sc-pg-section .sc-extra-2048-cell[data-v="512"],.sc-pg-section .sc-extra-2048-cell[data-v="1024"],.sc-pg-section .sc-extra-2048-cell[data-v="2048"]{background:#edc850;color:#fff;font-size:clamp(14px,3.4vw,23px)}',
    '.sc-pg-section .sc-extra-block-wrap{display:grid;grid-template-columns:minmax(0,1fr) 150px;gap:14px;align-items:start}',
    '.sc-pg-section .sc-extra-block-board{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:3px;width:100%;max-width:470px;aspect-ratio:1;margin:0 auto;padding:7px;border-radius:12px;background:#282337;touch-action:manipulation}',
    '.sc-pg-section .sc-extra-block-cell{min-width:0;padding:0;border:0;border-radius:3px;background:rgba(255,255,255,.055)}.sc-pg-section .sc-extra-block-cell.filled{background:linear-gradient(145deg,#a78bfa,#7c3aed)}',
    '.sc-pg-section .sc-extra-pieces{display:grid;gap:9px}.sc-pg-section .sc-extra-piece{min-height:70px;padding:8px;border:1px solid rgba(255,255,255,.13);border-radius:11px;background:rgba(255,255,255,.04);cursor:pointer}.sc-pg-section .sc-extra-piece.selected{border-color:#c4b5fd;background:rgba(124,58,237,.2)}.sc-pg-section .sc-extra-piece:disabled{opacity:.25;cursor:default}',
    '.sc-pg-section .sc-extra-piece-grid{display:grid;grid-template-columns:repeat(4,13px);grid-template-rows:repeat(4,13px);gap:2px;justify-content:center}.sc-pg-section .sc-extra-piece-grid i{border-radius:2px;background:#a78bfa}.sc-pg-section .sc-extra-piece-grid i.empty{background:transparent}',
    '.sc-pg-section .sc-extra-typing-prompt{max-width:720px;margin:14px auto;padding:16px;border:1px solid rgba(255,255,255,.1);border-radius:12px;background:rgba(0,0,0,.16);color:#e5def0;font-size:15px;line-height:1.9;white-space:pre-wrap}',
    '.sc-pg-section .sc-extra-typing-prompt .typed-ok{color:#86efac}.sc-pg-section .sc-extra-typing-prompt .typed-bad{color:#fca5a5;text-decoration:underline}.sc-pg-section .sc-extra-typing-input{display:block;width:min(100%,720px);min-height:100px;margin:0 auto;padding:12px;border:1px solid rgba(255,255,255,.18);border-radius:12px;background:#191526;color:#fff;font:14px/1.7 Inter,system-ui,sans-serif;resize:vertical;outline:none}',
    '.sc-pg-section .sc-extra-sudoku{display:grid;grid-template-columns:repeat(9,minmax(0,1fr));width:min(100%,450px);margin:14px auto;border:2px solid #a78bfa;border-radius:7px;overflow:hidden;aspect-ratio:1}',
    '.sc-pg-section .sc-extra-sudoku-cell{display:grid;place-items:center;min-width:0;padding:0;border:0;border-right:1px solid rgba(255,255,255,.13);border-bottom:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.035);color:#f8f5ff;font-size:clamp(13px,3vw,20px);font-weight:650;cursor:pointer}',
    '.sc-pg-section .sc-extra-sudoku-cell:nth-child(3n){border-right:2px solid rgba(196,181,253,.75)}.sc-pg-section .sc-extra-sudoku-cell:nth-child(n+19):nth-child(-n+27),.sc-pg-section .sc-extra-sudoku-cell:nth-child(n+46):nth-child(-n+54){border-bottom:2px solid rgba(196,181,253,.75)}',
    '.sc-pg-section .sc-extra-sudoku-cell.given{color:#aaa1bd;font-weight:900}.sc-pg-section .sc-extra-sudoku-cell.selected{background:rgba(124,58,237,.42)}.sc-pg-section .sc-extra-sudoku-cell.related{background:rgba(255,255,255,.085)}.sc-pg-section .sc-extra-sudoku-cell.conflict{background:rgba(239,68,68,.28);color:#fecaca}',
    '.sc-pg-section .sc-extra-numberpad{display:flex;justify-content:center;gap:6px;flex-wrap:wrap;margin:12px auto}.sc-pg-section .sc-extra-numberpad button{width:38px;height:39px;border:1px solid rgba(255,255,255,.15);border-radius:9px;background:rgba(255,255,255,.05);color:#fff;font-weight:800;cursor:pointer}',
    '.sc-pg-section .sc-extra-connect{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:7px;width:min(100%,490px);margin:14px auto;padding:10px;border-radius:16px;background:#2455a3}',
    '.sc-pg-section .sc-extra-connect button{display:grid;place-items:center;min-width:0;padding:0;aspect-ratio:1;border:0;border-radius:50%;background:#111b35;cursor:pointer}.sc-pg-section .sc-extra-connect .red:after,.sc-pg-section .sc-extra-connect .yellow:after{content:"";display:block;width:82%;height:82%;border-radius:50%;background:#f87171}.sc-pg-section .sc-extra-connect .yellow:after{background:#facc15}',
    '.sc-pg-section .sc-extra-connect button:disabled{cursor:default;opacity:.65}',
    '@media(max-width:720px){.sc-pg-section .sc-extra-block-wrap{grid-template-columns:1fr}.sc-pg-section .sc-extra-pieces{grid-template-columns:repeat(3,minmax(0,1fr))}.sc-pg-section .sc-extra-piece{min-height:62px}.sc-pg-section .sc-extra-connect{gap:4px;padding:6px}.sc-pg-section .sc-extra-typing-prompt{font-size:13px;padding:12px}}',
    '@media(max-width:390px){.sc-pg-section .sc-extra-tile{width:42px;height:44px}.sc-pg-section .sc-extra-connect{gap:3px;padding:5px}}',
    '@media(prefers-reduced-motion:reduce){.sc-pg-section .sc-extra-btn,.sc-pg-section .sc-extra-toggle button{transition:none!important}}'
  ].join('');


  const $ = (root, selector) => root.querySelector(selector);
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function safeGet(key, fallback) {
    try { const value = localStorage.getItem(key); return value == null ? fallback : JSON.parse(value); }
    catch (_) { return fallback; }
  }
  function safeSet(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
  function best(key, score) {
    const old = Number(safeGet('sitecraft-game-best-' + key, 0)) || 0;
    if (score > old) safeSet('sitecraft-game-best-' + key, score);
    return Math.max(old, score);
  }
  function shuffle(list, random) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor((random ? random() : Math.random()) * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  function seeded(seed) {
    let value = seed >>> 0;
    return function() {
      value = (value * 1664525 + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }
  function dateKey() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function dayNumber() {
    const parts = dateKey().split('-').map(Number);
    return Math.floor(Date.UTC(parts[0], parts[1] - 1, parts[2]) / 86400000);
  }
  function segmentText(value) {
    if (window.Intl && Intl.Segmenter) {
      return Array.from(new Intl.Segmenter('te', {granularity:'grapheme'}).segment(value), part => part.segment);
    }
    return Array.from(value.normalize('NFC'));
  }

  function append(root) {
    if (!root || !root.querySelector) return null;
    const section = root.querySelector('.sc-pg-section');
    if (!section) return null;
    if (section.dataset.extraGamesReady === 'true') return section;
    const tabs = $(section, '.sc-pg-tabs');
    const panel = $(section, '[data-pg-panel]');
    if (!tabs || !panel) return null;

    const style = document.createElement('style');
    style.dataset.scExtraStyle = 'true';
    style.textContent = CSS;
    section.appendChild(style);

    tabs.insertAdjacentHTML('beforeend',
      '<button class="sc-pg-tab" type="button" role="tab" aria-selected="false" data-extra-tab="word">🟩 Daily Word</button>' +
      '<button class="sc-pg-tab" type="button" role="tab" aria-selected="false" data-extra-tab="2048">🔢 2048</button>' +
      '<button class="sc-pg-tab" type="button" role="tab" aria-selected="false" data-extra-tab="blocks">🧩 Block Puzzle</button>' +
      '<button class="sc-pg-tab" type="button" role="tab" aria-selected="false" data-extra-tab="typing">⌨️ Typing Test</button>' +
      '<button class="sc-pg-tab" type="button" role="tab" aria-selected="false" data-extra-tab="sudoku">🔢 Sudoku</button>' +
      '<button class="sc-pg-tab" type="button" role="tab" aria-selected="false" data-extra-tab="connect">🔴 Connect Four</button>' +
      '<button class="sc-pg-tab" type="button" role="tab" aria-selected="false" data-gk-pending disabled title="GK Quiz will be enabled after secure question API integration">🇮🇳 GK Quiz · Soon</button>'
    );

    bind(section, tabs, panel);
    section.dataset.extraGamesReady = 'true';
    return section;
  }

  function bind(section, tabs, view) {
    if (section.dataset.ready === 'true') return;
    section.dataset.ready = 'true';
    let active = '';
    let word = null, puzzle2048 = null, blocks = null, typing = null, sudoku = null, connect = null;
    let typingTimer = 0;

    function commonHead(label, title, resetText) {
      return '<div class="sc-extra-gamehead"><div><small>' + label + '</small><h3>' + title + '</h3></div>' +
        '<button class="sc-extra-btn" type="button" data-extra-reset>' + resetText + '</button></div>' +
        '<div class="sc-extra-actions"><button class="sc-extra-btn" type="button" data-extra-fullscreen>⛶ Full Screen</button></div>';
    }
    function start(id) {
      active = id;
      clearInterval(typingTimer);
      typingTimer = 0;
      view.dataset.extraGameActive = 'true';
      section.querySelectorAll('.sc-pg-tab').forEach(tab => {
        tab.setAttribute('aria-selected', String(tab.dataset.extraTab === id));
      });
      if (id === 'word') initWord();
      if (id === '2048') init2048();
      if (id === 'blocks') initBlocks();
      if (id === 'typing') initTyping();
      if (id === 'sudoku') initSudoku('medium');
      if (id === 'connect') initConnect();
    }
    tabs.querySelectorAll('[data-extra-tab]').forEach(tab => {
      tab.addEventListener('click', () => start(tab.dataset.extraTab));
    });
    document.addEventListener('fullscreenchange', () => {
      const button = $(view, '[data-extra-fullscreen]');
      if (button) button.textContent = document.fullscreenElement === view ? '⤢ Exit Full Screen' : '⛶ Full Screen';
    });

    const englishWords = ['APPLE','BRAVE','CLOUD','DREAM','EARTH','FLAME','GRAPE','HEART','JUICE','KNIFE','LEMON','MUSIC','NIGHT','OCEAN','PEACE','QUEEN','RIVER','SMILE','TRAIN','WATER','YOUTH','BREAD','CHAIR','DANCE','LIGHT','PLANT','SHINE','SPACE','STONE','TIGER','WORLD','MANGO','GREEN','HAPPY','STARS','SWEET','CANDY','BLOOM','CROWN','MAGIC','SOUND','SLEEP','STORM','TRUCK','VOICE','BEACH','CHESS','FRUIT','HORSE','MONEY','ROBOT','SNAKE','TABLE','ZEBRA'];
    const teluguWords = ['తెలుగు','మనసు','కలలు','వెలుగు','విజయం','ప్రకృతి','నగరం','గెలుపు','చదువు','దేవుడు','పండుగ','కవిత','మాటలు','పాటలు','సమయం','వానలు','మేఘాలు','పుస్తకం','సహాయం','గురువు','బంగారం','తారలు','చెలిమి','హాయిగా','ఆకాశం','ఆశయం','ప్రయాణం','నవోదయం','పరిచయం','కరుణ'];
    const wordGuesses = [];
    function initWord() {
      const lang = safeGet('sitecraft-word-lang', 'en') === 'te' ? 'te' : 'en';
      word = {lang:lang, attempts:[], over:false, won:false, guess:'', day:dateKey()};
      const pool = lang === 'te' ? teluguWords : englishWords;
      const rng = seeded(dayNumber() + (lang === 'te' ? 271 : 0));
      word.answer = pool[Math.floor(rng() * pool.length)];
      word.limit = lang === 'te' ? segmentText(word.answer).length : 5;
      paintWord('Guess the hidden word in six tries.');
    }
    function wordParts(value) { return word.lang === 'te' ? segmentText(value.normalize('NFC')) : Array.from(value.toUpperCase()); }
    function paintWord(message) {
      const pool = word.lang === 'te' ? teluguWords : englishWords;
      const length = word.limit;
      let rows = '';
      for (let r = 0; r < 6; r++) {
        const attempt = word.attempts[r];
        let marks = [];
        if (attempt) {
          const target = wordParts(word.answer);
          const guess = wordParts(attempt);
          const result = Array(length).fill('absent');
          const remaining = {};
          target.forEach((v,i) => { if (guess[i] !== v) remaining[v] = (remaining[v] || 0) + 1; });
          guess.forEach((v,i) => { if (v === target[i]) result[i] = 'exact'; });
          guess.forEach((v,i) => {
            if (result[i] === 'exact') return;
            if (remaining[v] > 0) { result[i] = 'present'; remaining[v]--; }
          });
          marks = result;
        }
        const parts = attempt ? wordParts(attempt) : (r === word.attempts.length && !word.over ? wordParts(word.guess || '') : []);
        rows += '<div class="sc-extra-tiles">' + Array.from({length:length}, (_,i) => {
          const value = parts[i] || '';
          return '<span class="sc-extra-tile ' + (attempt ? marks[i] : '') + '">' + esc(value) + '</span>';
        }).join('') + '</div>';
      }
      view.innerHTML = commonHead('DAILY WORD CHALLENGE · ' + (word.lang === 'te' ? 'తెలుగు' : 'ENGLISH'), 'Find today’s word.', '↻ New day') +
        '<div class="sc-extra-toggle"><button type="button" data-word-lang="en" aria-pressed="' + (word.lang === 'en') + '">English</button><button type="button" data-word-lang="te" aria-pressed="' + (word.lang === 'te') + '">తెలుగు</button></div>' +
        '<p class="sc-extra-status sc-extra-center" data-word-status>' + esc(message) + '</p>' +
        rows +
        '<input class="sc-extra-word-input" data-word-input type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="' + (word.lang === 'te' ? 32 : 5) + '" placeholder="' + (word.lang === 'te' ? 'తెలుగు పదం టైప్ చేయండి' : 'TYPE 5 LETTERS') + '"' + (word.over ? ' disabled' : '') + '>' +
        '<div class="sc-extra-center"><button class="sc-extra-btn primary" type="button" data-word-submit' + (word.over ? ' disabled' : '') + '>Submit Guess</button></div>' +
        '<div class="sc-extra-stats"><span>Attempts<strong>' + word.attempts.length + ' / 6</strong></span><span>Challenge<strong>' + esc(word.day) + '</strong></span></div>' +
        '<p class="sc-extra-muted sc-extra-center">Green = correct place · Amber = in the word, different place · Grey = not in the word. New puzzle each day.</p>' +
        (word.over ? '<div class="sc-extra-center"><button class="sc-extra-btn" type="button" data-word-share>Share result</button></div>' : '');
      const input = $(view, '[data-word-input]');
      if (input && !word.over) input.focus({preventScroll:true});
    }
    function submitWord() {
      if (!word || word.over) return;
      const input = $(view, '[data-word-input]');
      const guess = String(input ? input.value : word.guess).trim().normalize('NFC');
      const parts = wordParts(guess);
      if (parts.length !== word.limit) {
        const status = $(view, '[data-word-status]');
        if (status) status.textContent = word.lang === 'te' ? 'సరైన అక్షరాల సంఖ్యతో పదం టైప్ చేయండి.' : 'Enter exactly ' + word.limit + ' letters.';
        return;
      }
      word.attempts.push(guess);
      word.guess = '';
      word.won = guess.toLocaleUpperCase() === word.answer.toLocaleUpperCase();
      word.over = word.won || word.attempts.length >= 6;
      const message = word.won ? 'You found it! 🎉' : word.over ? 'Today’s word was ' + word.answer + '. Try again tomorrow!' : 'Good try. Check the colours and guess again.';
      paintWord(message);
    }

    function init2048() {
      puzzle2048 = {board:Array(16).fill(0),score:0,over:false,won:false};
      addTile2048(); addTile2048(); paint2048('Use arrow keys, swipe or the buttons to move tiles.');
    }
    function addTile2048() {
      const empty = puzzle2048.board.map((v,i) => v ? -1 : i).filter(i => i >= 0);
      if (!empty.length) return;
      const index = empty[Math.floor(Math.random() * empty.length)];
      puzzle2048.board[index] = Math.random() < .9 ? 2 : 4;
    }
    function paint2048(message) {
      view.innerHTML = commonHead('2048 · NUMBER PUZZLE', 'Join the numbers. Reach 2048.', '↻ New game') +
        '<p class="sc-extra-status sc-extra-center" data-2048-status>' + esc(message) + '</p>' +
        '<div class="sc-extra-stats"><span>Score<strong>' + puzzle2048.score + '</strong></span><span>Best<strong>' + best('2048',puzzle2048.score) + '</strong></span></div>' +
        '<div class="sc-extra-board2048" data-2048-board tabindex="0" aria-label="2048 game board">' +
        puzzle2048.board.map(v => '<div class="sc-extra-2048-cell" data-v="' + (v || '') + '">' + (v || '') + '</div>').join('') +
        '</div><div class="sc-extra-toggle">' +
        '<button type="button" data-2048-move="up">↑ Up</button><button type="button" data-2048-move="left">← Left</button><button type="button" data-2048-move="down">↓ Down</button><button type="button" data-2048-move="right">Right →</button></div>' +
        '<p class="sc-extra-muted sc-extra-center">Combine matching tiles. Each move slides all tiles in one direction. Your best score is saved on this device.</p>';
      const focusBoard = $(view, '[data-2048-board]');
      if (focusBoard) focusBoard.focus({preventScroll:true});
      if (puzzle2048.over) {
        const status = $(view, '[data-2048-status]');
        if (status) status.textContent = message + ' Start a new game to play again.';
      }
    }
    function move2048(direction) {
      if (!puzzle2048 || puzzle2048.over) return;
      const old = puzzle2048.board.slice();
      let gained = 0;
      for (let line = 0; line < 4; line++) {
        let indices = [];
        for (let p = 0; p < 4; p++) {
          if (direction === 'left') indices.push(line * 4 + p);
          if (direction === 'right') indices.push(line * 4 + (3-p));
          if (direction === 'up') indices.push(p * 4 + line);
          if (direction === 'down') indices.push((3-p) * 4 + line);
        }
        const values = indices.map(i => puzzle2048.board[i]).filter(Boolean);
        const merged = [];
        for (let i = 0; i < values.length; i++) {
          if (values[i] === values[i+1]) { merged.push(values[i] * 2); gained += values[i] * 2; i++; }
          else merged.push(values[i]);
        }
        while (merged.length < 4) merged.push(0);
        indices.forEach((index,i) => puzzle2048.board[index] = merged[i]);
      }
      if (old.every((v,i) => v === puzzle2048.board[i])) return;
      puzzle2048.score += gained;
      addTile2048();
      if (puzzle2048.board.includes(2048)) puzzle2048.won = true;
      const canMove = puzzle2048.board.some(v => !v) || puzzle2048.board.some((v,i) => i%4<3 && v===puzzle2048.board[i+1]) || puzzle2048.board.some((v,i) => i<12 && v===puzzle2048.board[i+4]);
      puzzle2048.over = !canMove;
      paint2048(puzzle2048.over ? 'Game over. No more moves.' : puzzle2048.won ? '2048 reached! Amazing! You can keep playing.' : '');
    }

    const blockShapes = [
      [[0,0]], [[0,0],[0,1]], [[0,0],[0,1],[0,2]], [[0,0],[1,0],[1,1]], [[0,0],[1,0],[2,0],[2,1]],
      [[0,0],[0,1],[1,0],[1,1]], [[0,0],[0,1],[0,2],[1,1]], [[0,0],[1,0],[2,0]], [[0,0],[1,0],[1,1],[2,1]],
      [[0,1],[1,0],[1,1],[1,2]], [[0,0],[0,1],[1,1],[1,2]], [[0,0],[1,0],[2,0],[3,0]], [[0,0],[0,1],[0,2],[0,3]]
    ];
    function randomPiece() { return {shape:blockShapes[Math.floor(Math.random()*blockShapes.length)].map(p=>p.slice())}; }
    function initBlocks() {
      blocks = {board:Array.from({length:10},()=>Array(10).fill(0)),pieces:[randomPiece(),randomPiece(),randomPiece()],selected:0,score:0,over:false};
      paintBlocks('Select a piece, then tap a position on the board.');
    }
    function canPlaceBlock(shape,row,col) {
      return shape.every(([r,c]) => row+r>=0 && row+r<10 && col+c>=0 && col+c<10 && !blocks.board[row+r][col+c]);
    }
    function anyBlockFit() {
      return blocks.pieces.some(piece => piece && blocks.board.some((row,r) => row.some((_,c) => canPlaceBlock(piece.shape,r,c))));
    }
    function paintBlocks(message) {
      const selected = blocks.pieces[blocks.selected];
      view.innerHTML = commonHead('BLOCK PUZZLE · 10 × 10', 'Fit the pieces. Clear the board.', '↻ New game') +
        '<p class="sc-extra-status sc-extra-center" data-block-status>' + esc(message) + '</p>' +
        '<div class="sc-extra-stats"><span>Score<strong>' + blocks.score + '</strong></span><span>Best<strong>' + best('blocks',blocks.score) + '</strong></span></div>' +
        '<div class="sc-extra-block-wrap"><div class="sc-extra-block-board" data-block-board>' +
        blocks.board.map((row,r)=>row.map((v,c)=>'<button class="sc-extra-block-cell ' + (v?'filled':'') + '" type="button" data-block-cell="' + r + ',' + c + '" aria-label="Row ' + (r+1) + ', column ' + (c+1) + '"></button>').join('')).join('') +
        '</div><div><p class="sc-extra-muted sc-extra-center">Choose a piece</p><div class="sc-extra-pieces">' +
        blocks.pieces.map((piece,i)=>'<button class="sc-extra-piece ' + (blocks.selected===i?'selected':'') + '" type="button" data-block-piece="' + i + '"' + (!piece?' disabled':'') + ' aria-label="Select piece ' + (i+1) + '">' +
          (piece?'<span class="sc-extra-piece-grid">' + Array.from({length:16},(_,n)=>'<i class="' + (piece.shape.some(([r,c])=>r*4+c===n)?'':'empty') + '"></i>').join('') + '</span>':'<span class="sc-extra-muted">Used</span>') +
        '</button>').join('') + '</div></div></div>' +
        '<p class="sc-extra-muted sc-extra-center">Complete a full row or column to clear it. Clear multiple lines at once for a bigger score. No rotation required.</p>';
    }
    function placeBlock(row,col) {
      if (blocks.over || !blocks.pieces[blocks.selected]) return;
      const shape = blocks.pieces[blocks.selected].shape;
      if (!canPlaceBlock(shape,row,col)) { paintBlocks('That piece does not fit there. Try another position.'); return; }
      shape.forEach(([r,c])=>blocks.board[row+r][col+c]=1);
      blocks.score += shape.length * 10;
      const rows = blocks.board.map((line,i)=>line.every(Boolean)?i:-1).filter(i=>i>=0);
      const cols = Array.from({length:10},(_,c)=>blocks.board.every(row=>row[c])?c:-1).filter(i=>i>=0);
      rows.forEach(r=>blocks.board[r].fill(0));
      cols.forEach(c=>blocks.board.forEach(row=>row[c]=0));
      blocks.score += (rows.length + cols.length) * 100;
      blocks.pieces[blocks.selected] = null;
      if (blocks.pieces.every(p=>!p)) { blocks.pieces=[randomPiece(),randomPiece(),randomPiece()]; blocks.selected=0; }
      if (!anyBlockFit()) blocks.over=true;
      paintBlocks(blocks.over?'No more pieces fit. Game over!':(rows.length+cols.length?'Great! Cleared ' + (rows.length+cols.length) + ' line(s).':'Nice placement. Choose your next piece.'));
    }

    const typingSamples = {
      en: [
        'The morning light slowly fills the quiet streets.',
        'A good idea becomes stronger when we put it into action.',
        'Learning something new keeps the mind active and curious.',
        'Take a short pause, breathe deeply, and begin again.',
        'Small improvements can create a meaningful change over time.',
        'A clear plan makes difficult tasks easier to complete.',
        'Practice brings confidence even when progress feels slow.',
        'Every place has a story waiting for someone to discover it.',
        'Kind words can make an ordinary day feel special.',
        'Technology is useful when it solves real problems for people.',
        'A simple habit can become a powerful routine.',
        'Focus on the next step instead of worrying about the whole journey.',
        'Fresh air and a little movement can refresh your attention.',
        'Good teamwork begins with listening and sharing ideas.',
        'Books open doors to places we have never visited.',
        'Curiosity helps us ask better questions and find better answers.',
        'A steady effort is often more useful than a perfect start.',
        'Choose your words carefully and make every message clear.',
        'Creative thinking turns everyday challenges into opportunities.',
        'Make time to learn, build, explore, and enjoy the process.',
        'The best way to improve is to keep showing up.',
        'A thoughtful decision can save time and prevent confusion.',
        'Beautiful things often grow from patience and care.',
        'Stay open to feedback and use it to become better.',
        'A calm mind can notice details that hurry might miss.',
        'Share useful knowledge and help someone take a first step.',
        'Simple solutions are powerful when they are easy to use.',
        'A little progress today is still progress worth celebrating.',
        'Try a different path when the first idea does not work.',
        'Finish one task well before moving on to the next.'
      ],
      te: [
        'ప్రతి రోజు కొత్త విషయాన్ని నేర్చుకోవడానికి మంచి అవకాశం.',
        'చిన్న ప్రయత్నాలు కూడా పెద్ద మార్పుకు దారి చూపిస్తాయి.',
        'మన లక్ష్యాన్ని చేరుకోవడానికి క్రమశిక్షణ అవసరం.',
        'కొత్త ఆలోచనలు మన జీవితాన్ని మరింత ఆసక్తికరంగా చేస్తాయి.',
        'సమయాన్ని సరిగ్గా ఉపయోగిస్తే మంచి ఫలితాలు వస్తాయి.',
        'పుస్తకాలు మనకు ఎన్నో కొత్త ప్రపంచాలను పరిచయం చేస్తాయి.',
        'ఆరోగ్యంగా ఉండటానికి తగిన విశ్రాంతి కూడా ముఖ్యం.',
        'మంచి మాట ఇతరులకు ధైర్యాన్ని అందిస్తుంది.',
        'ప్రకృతిని గమనిస్తే ఎన్నో విషయాలు అర్థమవుతాయి.',
        'మన పని మీద శ్రద్ధ పెడితే నైపుణ్యం మెరుగుపడుతుంది.',
        'సహనం ఉంటే కష్టమైన పనిని కూడా పూర్తి చేయవచ్చు.',
        'ప్రతి సమస్యలో ఒక కొత్త పరిష్కారం దాగి ఉంటుంది.',
        'కలిసి పనిచేస్తే మంచి ఆలోచనలు పంచుకోవచ్చు.',
        'రోజువారీ సాధన మనలో ఆత్మవిశ్వాసాన్ని పెంచుతుంది.',
        'స్పష్టమైన లక్ష్యం మన ప్రయాణానికి దిశ చూపిస్తుంది.',
        'ఇతరుల అభిప్రాయాలను గౌరవంగా వినడం మంచి అలవాటు.',
        'చిన్న సహాయం కూడా ఒకరి రోజును ఆనందంగా మార్చగలదు.',
        'కొత్త ప్రదేశాలను చూడటం వల్ల మన అనుభవం పెరుగుతుంది.',
        'ప్రశాంతంగా ఆలోచిస్తే సరైన నిర్ణయం తీసుకోవచ్చు.',
        'మన సమయాన్ని విలువైన పనులకు కేటాయించాలి.',
        'ప్రయత్నం కొనసాగిస్తే నైపుణ్యం తప్పకుండా పెరుగుతుంది.',
        'మన చుట్టూ ఉన్న విషయాలను ఆసక్తిగా గమనించాలి.',
        'మంచి అలవాట్లు జీవితాన్ని సులభంగా మారుస్తాయి.',
        'ఒక అడుగు ముందుకు వేయడం కూడా విజయమే.',
        'నేర్చుకున్న విషయాలను ఆచరణలో పెట్టినప్పుడే ప్రయోజనం.',
        'సహకారం వల్ల పెద్ద పనులు కూడా సులభంగా పూర్తవుతాయి.',
        'ప్రతి ఉదయం కొత్త ఉత్సాహంతో పనిని ప్రారంభించండి.',
        'సరళమైన పరిష్కారం అందరికీ ఉపయోగపడుతుంది.',
        'ఆలోచించి మాట్లాడితే అపార్థాలు తగ్గుతాయి.',
        'నిరంతర సాధన మన ప్రయత్నానికి మంచి ఫలితాన్ని ఇస్తుంది.'
      ]
    };
    function typingChars(value, lang) {
      return lang === 'te' ? segmentText(String(value).normalize('NFC')) : Array.from(String(value));
    }
    function initTyping(lang) {
      clearInterval(typingTimer);
      typingTimer = 0;
      lang = lang || 'en';
      const sentences = shuffle(typingSamples[lang]);
      typing = {
        lang:lang,
        text:sentences.slice(0,8).join('  '),
        remaining:sentences.slice(8),
        sentenceCount:sentences.length,
        value:'',
        seconds:60,
        started:false,
        done:false,
        startAt:0,
        wpm:0,
        accuracy:100
      };
      paintTyping();
    }
    function extendTypingText() {
      if (!typing || !typing.remaining.length) return;
      const typedCount = typingChars(typing.value, typing.lang).length;
      const targetCount = typingChars(typing.text, typing.lang).length;
      if (targetCount - typedCount < 180) {
        const nextSentences = typing.remaining.splice(0,5);
        typing.text += '  ' + nextSentences.join('  ');
      }
    }
    function typingStats() {
      const typed = typingChars(typing.value, typing.lang);
      const target = typingChars(typing.text, typing.lang);
      let correct = 0;
      typed.forEach((ch,i)=>{if(ch===target[i])correct++;});
      const elapsed = typing.started ? Math.max(1,(Date.now()-typing.startAt)/1000) : 1;
      typing.accuracy = typed.length ? Math.round(correct/typed.length*100) : 100;
      typing.wpm = Math.round((correct/5)/(elapsed/60));
      return {typed:typed,correct:correct,target:target};
    }
    function typingPromptHtml(stats) {
      const start = Math.max(0, stats.typed.length - 28);
      const end = Math.min(stats.target.length, Math.max(start + 180, stats.typed.length + 145));
      return stats.target.slice(start,end).map((ch,offset)=>{
        const index = start + offset;
        const entered = stats.typed[index];
        const className = entered == null ? (index===stats.typed.length?'typing-next':'') :
          entered===ch ? 'typed-ok' : 'typed-bad';
        const visible = ch === ' ' ? '&nbsp;' : esc(ch);
        return '<span class="' + className + '">' + visible + '</span>';
      }).join('');
    }
    function paintTyping() {
      const stats = typingStats();
      const progress = Math.max(0,Math.min(100,(typing.seconds/60)*100));
      view.innerHTML = commonHead('TYPING SPEED TEST · 60 SECONDS', 'How fast and accurately can you type?', '↻ Restart test') +
        '<div class="sc-extra-toggle"><button type="button" data-typing-lang="en" aria-pressed="' + (typing.lang==='en') + '">English</button><button type="button" data-typing-lang="te" aria-pressed="' + (typing.lang==='te') + '">తెలుగు</button></div>' +
        '<p class="sc-extra-status sc-extra-center" data-typing-status>' + (typing.done?'Time is up! Your result is ready.':typing.started?'Keep going — the clock is running.':'The 60-second timer starts with your first keystroke.') + '</p>' +
        '<div class="sc-extra-timer"><div><span>TIME REMAINING</span><strong data-typing-time>' + typing.seconds + 's</strong></div><div class="sc-extra-timer-track"><i data-typing-progress style="width:' + progress + '%"></i></div></div>' +
        '<div class="sc-extra-stats"><span>Speed<strong data-typing-wpm>' + typing.wpm + ' WPM</strong></span><span>Accuracy<strong data-typing-accuracy>' + typing.accuracy + '%</strong></span><span>Best<strong>' + best('typing-'+typing.lang,typing.wpm) + ' WPM</strong></span><span>Sentences<strong>' + typing.sentenceCount + ' unique</strong></span></div>' +
        '<div class="sc-extra-typing-prompt" aria-label="Text to type" data-typing-prompt>' + typingPromptHtml(stats) + '</div>' +
        '<textarea class="sc-extra-typing-input" data-typing-input rows="3" placeholder="' + (typing.lang==='te'?'ఇక్కడ టైప్ చేయండి…':'Start typing here…') + '" autocapitalize="off" autocomplete="off" spellcheck="false"' + (typing.done?' disabled':'') + '>' + esc(typing.value) + '</textarea>' +
        '<p class="sc-extra-muted sc-extra-center">Type continuously until the timer ends. Every round uses a shuffled set of unique sentences, so a sentence will not repeat during that test. Telugu typing works with your device’s Telugu keyboard / input method.</p>';
      const input = $(view,'[data-typing-input]');
      if (input && !typing.done) input.focus({preventScroll:true});
    }
    function updateTypingLive() {
      const input = $(view,'[data-typing-input]');
      if (!input || typing.done) return;
      typing.value = input.value;
      extendTypingText();
      if (!typing.started && typing.value.length) {
        typing.started = true;
        typing.startAt = Date.now();
        typingTimer = window.setInterval(()=>{
          if (!typing || active!=='typing' || typing.done) { clearInterval(typingTimer); return; }
          typing.seconds = Math.max(0,60-Math.floor((Date.now()-typing.startAt)/1000));
          const time = $(view,'[data-typing-time]');
          if (time) time.textContent = typing.seconds + 's';
          const progress = $(view,'[data-typing-progress]');
          if (progress) progress.style.width = (typing.seconds/60*100) + '%';
          const stats = typingStats();
          const wpm = $(view,'[data-typing-wpm]');
          const acc = $(view,'[data-typing-accuracy]');
          if (wpm) wpm.textContent = stats.wpm + ' WPM';
          if (acc) acc.textContent = typing.accuracy + '%';
          if (typing.seconds <= 0) finishTyping();
        },200);
      }
      const stats = typingStats();
      const prompt = $(view,'[data-typing-prompt]');
      if (prompt) prompt.innerHTML = typingPromptHtml(stats);
      const wpm = $(view,'[data-typing-wpm]');
      const acc = $(view,'[data-typing-accuracy]');
      if (wpm) wpm.textContent = stats.wpm + ' WPM';
      if (acc) acc.textContent = typing.accuracy + '%';
    }
    function finishTyping() {
      if (!typing || typing.done) return;
      typing.done = true;
      clearInterval(typingTimer);
      typingTimer = 0;
      const stats = typingStats();
      best('typing-'+typing.lang,stats.wpm);
      paintTyping();
    }

    function pattern(r,c) { return (r*3 + Math.floor(r/3) + c) % 9; }
    function countSolutions(grid, limit) {
      const rows=Array(9).fill(0),cols=Array(9).fill(0),boxes=Array(9).fill(0);
      for(let r=0;r<9;r++)for(let c=0;c<9;c++){const v=grid[r][c];if(v){const bit=1<<v;rows[r]|=bit;cols[c]|=bit;boxes[Math.floor(r/3)*3+Math.floor(c/3)]|=bit;}}
      let count=0;
      function solve(){
        if(count>=limit)return;
        let bestR=-1,bestC=-1,bestMask=0,bestN=10;
        for(let r=0;r<9;r++)for(let c=0;c<9;c++)if(!grid[r][c]){
          const b=Math.floor(r/3)*3+Math.floor(c/3);
          const mask=1022 & ~(rows[r]|cols[c]|boxes[b]);
          const n=bitCount(mask);
          if(n===0)return;
          if(n<bestN){bestN=n;bestR=r;bestC=c;bestMask=mask;if(n===1)break;}
        }
        if(bestR<0){count++;return;}
        const b=Math.floor(bestR/3)*3+Math.floor(bestC/3);
        for(let v=1;v<=9;v++){const bit=1<<v;if(bestMask&bit){grid[bestR][bestC]=v;rows[bestR]|=bit;cols[bestC]|=bit;boxes[b]|=bit;solve();grid[bestR][bestC]=0;rows[bestR]^=bit;cols[bestC]^=bit;boxes[b]^=bit;if(count>=limit)return;}}
      }
      solve();return count;
    }
    function bitCount(n){let count=0;while(n){n&=n-1;count++;}return count;}
    function createSudoku(level) {
      const rng=seeded(dayNumber()*31 + ({easy:1,medium:2,hard:3}[level]||2)*7919);
      let bands=shuffle([0,1,2],rng),stacks=shuffle([0,1,2],rng);
      let rowOrder=bands.flatMap(b=>shuffle([0,1,2],rng).map(r=>b*3+r));
      let colOrder=stacks.flatMap(b=>shuffle([0,1,2],rng).map(c=>b*3+c));
      const digits=shuffle([1,2,3,4,5,6,7,8,9],rng);
      const solution=rowOrder.map(r=>colOrder.map(c=>digits[pattern(r,c)]));
      const puzzle=solution.map(row=>row.slice());
      const target={easy:34,medium:42,hard:48}[level];
      const cells=shuffle(Array.from({length:81},(_,i)=>i),rng);
      let removed=0;
      for(const index of cells){
        if(removed>=target)break;
        const r=Math.floor(index/9),c=index%9,old=puzzle[r][c];
        puzzle[r][c]=0;
        if(countSolutions(puzzle,2)===1)removed++;
        else puzzle[r][c]=old;
      }
      return {puzzle:puzzle,solution:solution};
    }
    function initSudoku(level) {
      clearInterval(typingTimer);
      const generated=createSudoku(level||'medium');
      sudoku={level:level||'medium',board:generated.puzzle.map(r=>r.slice()),solution:generated.solution,givens:generated.puzzle.map(r=>r.slice()),selected:[0,0],mistakes:0,won:false};
      paintSudoku('Select an empty cell, then choose a number.');
    }
    function sudokuConflict(r,c,v) {
      if(!v)return false;
      for(let i=0;i<9;i++){if(i!==c&&sudoku.board[r][i]===v)return true;if(i!==r&&sudoku.board[i][c]===v)return true;}
      const br=Math.floor(r/3)*3,bc=Math.floor(c/3)*3;
      for(let y=br;y<br+3;y++)for(let x=bc;x<bc+3;x++)if((y!==r||x!==c)&&sudoku.board[y][x]===v)return true;
      return false;
    }
    function paintSudoku(message) {
      const r0=sudoku.selected[0],c0=sudoku.selected[1];
      const cells=sudoku.board.map((row,r)=>row.map((v,c)=>{
        const given=!!sudoku.givens[r][c],related=r===r0||c===c0||Math.floor(r/3)===Math.floor(r0/3)&&Math.floor(c/3)===Math.floor(c0/3);
        const classes=['sc-extra-sudoku-cell',given?'given':'',r===r0&&c===c0?'selected':'',related?'related':'',sudokuConflict(r,c,v)?'conflict':''].filter(Boolean).join(' ');
        return '<button type="button" class="' + classes + '" data-sudoku-cell="' + r + ',' + c + '" aria-label="Row ' + (r+1) + ', column ' + (c+1) + ', ' + (v||'empty') + '"' + (given?' disabled':'') + '>' + (v||'') + '</button>';
      }).join('')).join('');
      view.innerHTML=commonHead('SUDOKU · DAILY NUMBER PUZZLE','Fill every row, column and 3 × 3 box.','↻ New puzzle') +
        '<div class="sc-extra-toggle">' + ['easy','medium','hard'].map(l=>'<button type="button" data-sudoku-level="' + l + '" aria-pressed="' + (sudoku.level===l) + '">' + l[0].toUpperCase()+l.slice(1) + '</button>').join('') + '</div>' +
        '<p class="sc-extra-status sc-extra-center" data-sudoku-status>' + esc(message) + '</p>' +
        '<div class="sc-extra-sudoku">' + cells + '</div>' +
        '<div class="sc-extra-numberpad">' + [1,2,3,4,5,6,7,8,9].map(n=>'<button type="button" data-sudoku-number="' + n + '">' + n + '</button>').join('') + '<button type="button" data-sudoku-number="0">⌫</button></div>' +
        '<div class="sc-extra-stats"><span>Difficulty<strong>' + sudoku.level.toUpperCase() + '</strong></span><span>Mistakes<strong>' + sudoku.mistakes + '</strong></span><span>Filled<strong>' + sudoku.board.flat().filter(Boolean).length + ' / 81</strong></span></div>' +
        '<p class="sc-extra-muted sc-extra-center">Today’s puzzle stays the same on this device for each difficulty. Red cells show a number conflict. Use Backspace or Delete to clear a selected cell.</p>';
      const keypadFocus = $(view, '[data-sudoku-number="1"]');
      if (keypadFocus) keypadFocus.focus({preventScroll:true});
    }
    function setSudokuNumber(value) {
      if(sudoku.won)return;
      const [r,c]=sudoku.selected;
      if(sudoku.givens[r][c])return;
      sudoku.board[r][c]=value;
      if(value && sudokuConflict(r,c,value))sudoku.mistakes++;
      if(sudoku.board.every((row,y)=>row.every((v,x)=>v===sudoku.solution[y][x]))) {
        sudoku.won=true;paintSudoku('Puzzle solved! Excellent work! 🎉');
      } else paintSudoku(value?'Number placed. Keep going.':'Cell cleared.');
    }

    function emptyConnectBoard(){return Array.from({length:6},()=>Array(7).fill(''));}
    function connectDrop(board,col,mark) {
      for(let r=5;r>=0;r--)if(!board[r][col]){board[r][col]=mark;return r;}
      return -1;
    }
    function connectWin(board,r,c,mark) {
      const dirs=[[0,1],[1,0],[1,1],[1,-1]];
      return dirs.some(([dr,dc])=>{
        let total=1;
        for(const sign of [-1,1]){let y=r+dr*sign,x=c+dc*sign;while(y>=0&&y<6&&x>=0&&x<7&&board[y][x]===mark){total++;y+=dr*sign;x+=dc*sign;}}
        return total>=4;
      });
    }
    function initConnect() {
      connect={board:emptyConnectBoard(),over:false,turn:'you',you:'R',computer:'Y'};
      paintConnect('Your turn. Choose a column to drop a red disc.');
    }
    function connectScore(board,mark) {
      const other=mark==='Y'?'R':'Y';let score=0;
      for(let r=0;r<6;r++)for(let c=0;c<7;c++)if(c<=3){
        const w=[board[r][c],board[r][c+1],board[r][c+2],board[r][c+3]];
        const own=w.filter(v=>v===mark).length,opp=w.filter(v=>v===other).length,empty=w.filter(v=>!v).length;
        if(own===4)score+=100000;else if(own===3&&empty===1)score+=80;else if(own===2&&empty===2)score+=8;
        if(opp===3&&empty===1)score-=95;else if(opp===4)score-=100000;
      }
      for(let c=0;c<7;c++)for(let r=0;r<=2;r++){
        const w=[board[r][c],board[r+1][c],board[r+2][c],board[r+3][c]];
        const own=w.filter(v=>v===mark).length,opp=w.filter(v=>v===other).length,empty=w.filter(v=>!v).length;
        if(own===4)score+=100000;else if(own===3&&empty===1)score+=80;else if(own===2&&empty===2)score+=8;
        if(opp===3&&empty===1)score-=95;else if(opp===4)score-=100000;
      }
      for(let r=0;r<=2;r++)for(let c=0;c<=3;c++){
        const w=[board[r][c],board[r+1][c+1],board[r+2][c+2],board[r+3][c+3]];
        const own=w.filter(v=>v===mark).length,opp=w.filter(v=>v===other).length,empty=w.filter(v=>!v).length;
        if(own===4)score+=100000;else if(own===3&&empty===1)score+=80;else if(own===2&&empty===2)score+=8;
        if(opp===3&&empty===1)score-=95;else if(opp===4)score-=100000;
      }
      for(let r=0;r<=2;r++)for(let c=3;c<7;c++){
        const w=[board[r][c],board[r+1][c-1],board[r+2][c-2],board[r+3][c-3]];
        const own=w.filter(v=>v===mark).length,opp=w.filter(v=>v===other).length,empty=w.filter(v=>!v).length;
        if(own===4)score+=100000;else if(own===3&&empty===1)score+=80;else if(own===2&&empty===2)score+=8;
        if(opp===3&&empty===1)score-=95;else if(opp===4)score-=100000;
      }
      return score;
    }
    function connectMoveOptions(board){return [3,2,4,1,5,0,6].filter(c=>!board[0][c]);}
    function connectMinimax(board,depth,alpha,beta,maximizing) {
      if(depth===0||board[0].every(Boolean))return connectScore(board,'Y');
      const options=connectMoveOptions(board);
      if(maximizing){
        let value=-Infinity;
        for(const col of options){const copy=board.map(row=>row.slice());connectDrop(copy,col,'Y');value=Math.max(value,connectMinimax(copy,depth-1,alpha,beta,false));alpha=Math.max(alpha,value);if(alpha>=beta)break;}
        return value;
      }
      let value=Infinity;
      for(const col of options){const copy=board.map(row=>row.slice());connectDrop(copy,col,'R');value=Math.min(value,connectMinimax(copy,depth-1,alpha,beta,true));beta=Math.min(beta,value);if(alpha>=beta)break;}
      return value;
    }
    function chooseConnectMove() {
      const options=connectMoveOptions(connect.board);
      for(const col of options){const copy=connect.board.map(row=>row.slice());const r=connectDrop(copy,col,'Y');if(connectWin(copy,r,col,'Y'))return col;}
      for(const col of options){const copy=connect.board.map(row=>row.slice());const r=connectDrop(copy,col,'R');if(connectWin(copy,r,col,'R'))return col;}
      let bestCol=options[0],bestScore=-Infinity;
      for(const col of options){const copy=connect.board.map(row=>row.slice());connectDrop(copy,col,'Y');const score=connectMinimax(copy,4,-Infinity,Infinity,false);if(score>bestScore){bestScore=score;bestCol=col;}}
      return bestCol;
    }
    function paintConnect(message) {
      view.innerHTML=commonHead('CONNECT FOUR · YOU VS COMPUTER','Get four discs in a line before the computer.','↻ New match') +
        '<p class="sc-extra-status sc-extra-center" data-connect-status>' + esc(message) + '</p>' +
        '<div class="sc-extra-connect">' + connect.board.map((row,r)=>row.map((value,c)=>'<button type="button" class="' + (value==='R'?'red':value==='Y'?'yellow':'') + '" data-connect-col="' + c + '" aria-label="Row ' + (r+1) + ', column ' + (c+1) + '"></button>').join('')).join('') + '</div>' +
        '<div class="sc-extra-stats"><span>You<strong>🔴 Red</strong></span><span>Computer<strong>🟡 Yellow</strong></span></div>' +
        '<p class="sc-extra-muted sc-extra-center">Tap a column to drop your disc. The computer looks for winning moves and blocks your winning line.</p>';
    }
    function playConnect(col) {
      if(connect.over||connect.turn!=='you'||col<0||col>6)return;
      const row=connectDrop(connect.board,col,'R');
      if(row<0)return;
      if(connectWin(connect.board,row,col,'R')){connect.over=true;paintConnect('You win! Four in a row! 🎉');return;}
      if(connect.board[0].every(Boolean)){connect.over=true;paintConnect('It’s a draw. Well played!');return;}
      connect.turn='computer';paintConnect('Computer is thinking…');
      window.setTimeout(()=>{
        if(active!=='connect'||connect.over)return;
        const compCol=chooseConnectMove(),compRow=connectDrop(connect.board,compCol,'Y');
        if(compRow>=0&&connectWin(connect.board,compRow,compCol,'Y')){connect.over=true;connect.turn='done';paintConnect('Computer wins this match. Try again!');}
        else if(connect.board[0].every(Boolean)){connect.over=true;paintConnect('It’s a draw. Well played!');}
        else{connect.turn='you';paintConnect('Your turn. Choose a column.');}
      },350);
    }

    section.addEventListener('click', event => {
      const target = event.target;
      if (target.closest('[data-extra-fullscreen]')) {
        const full = document.fullscreenElement || document.webkitFullscreenElement;
        if (full === view) {
          const exit = document.exitFullscreen || document.webkitExitFullscreen;
          if (exit) exit.call(document);
        } else {
          const enter = view.requestFullscreen || view.webkitRequestFullscreen;
          if (enter) { const result = enter.call(view); if(result&&result.catch)result.catch(()=>{}); }
        }
        return;
      }
      if (target.closest('[data-extra-reset]')) {
        if(active==='word')initWord();
        if(active==='2048')init2048();
        if(active==='blocks')initBlocks();
        if(active==='typing')initTyping(typing.lang);
        if(active==='sudoku')initSudoku(sudoku.level);
        if(active==='connect')initConnect();
        return;
      }
      const wordLang=target.closest('[data-word-lang]');
      if(wordLang){safeSet('sitecraft-word-lang',wordLang.dataset.wordLang);initWord();return;}
      if(target.closest('[data-word-submit]')){submitWord();return;}
      if(target.closest('[data-word-share]')) {
        const text='SiteCraft Daily Word Challenge · '+word.day+' · '+(word.lang==='te'?'తెలుగు':'English')+' · '+(word.won?word.attempts.length+'/6':'X/6')+' guesses';
        if(navigator.share)navigator.share({title:'Daily Word Challenge',text:text}).catch(()=>{});
        else if(navigator.clipboard)navigator.clipboard.writeText(text).then(()=>{const b=$(view,'[data-word-share]');if(b)b.textContent='Copied!';}).catch(()=>{});
        return;
      }
      const move=target.closest('[data-2048-move]');
      if(move){move2048(move.dataset['2048Move']);return;}
      const piece=target.closest('[data-block-piece]');
      if(piece&&!piece.disabled){blocks.selected=Number(piece.dataset.blockPiece);paintBlocks('Piece selected. Tap where its top-left corner should go.');return;}
      const blockCell=target.closest('[data-block-cell]');
      if(blockCell){const parts=blockCell.dataset.blockCell.split(',').map(Number);placeBlock(parts[0],parts[1]);return;}
      const typingLang=target.closest('[data-typing-lang]');
      if(typingLang){initTyping(typingLang.dataset.typingLang);return;}
      const sudokuLevel=target.closest('[data-sudoku-level]');
      if(sudokuLevel){initSudoku(sudokuLevel.dataset.sudokuLevel);return;}
      const sudokuCell=target.closest('[data-sudoku-cell]');
      if(sudokuCell){sudoku.selected=sudokuCell.dataset.sudokuCell.split(',').map(Number);paintSudoku('Cell selected. Choose a number.');return;}
      const sudokuNum=target.closest('[data-sudoku-number]');
      if(sudokuNum){setSudokuNumber(Number(sudokuNum.dataset.sudokuNumber));return;}
      const connectCol=target.closest('[data-connect-col]');
      if(connectCol){playConnect(Number(connectCol.dataset.connectCol));return;}
    });

    section.addEventListener('input', event => {
      if(active==='word' && event.target.matches('[data-word-input]') && !event.isComposing) {
        word.guess=event.target.value;
      }
      if(active==='typing' && event.target.matches('[data-typing-input]') && !event.isComposing)updateTypingLive();
    });
    section.addEventListener('keydown', event => {
      if(active==='word' && event.target.matches('[data-word-input]') && event.key==='Enter') {event.preventDefault();submitWord();return;}
      if(active==='2048' && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key) && !event.target.matches('input,textarea')) {
        event.preventDefault();move2048(event.key.replace('Arrow','').toLowerCase());return;
      }
      if(active==='sudoku' && !event.target.matches('input,textarea')) {
        if(/^[1-9]$/.test(event.key)){event.preventDefault();setSudokuNumber(Number(event.key));}
        else if(event.key==='Backspace'||event.key==='Delete'){event.preventDefault();setSudokuNumber(0);}
        else if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)){
          event.preventDefault();const r=Math.max(0,Math.min(8,sudoku.selected[0]+(event.key==='ArrowUp'?-1:event.key==='ArrowDown'?1:0)));const c=Math.max(0,Math.min(8,sudoku.selected[1]+(event.key==='ArrowLeft'?-1:event.key==='ArrowRight'?1:0)));sudoku.selected=[r,c];paintSudoku('Cell selected.');
        }
      }
    });
    let touchStart=null;
    section.addEventListener('touchstart',event=>{
      if(active==='2048'&&event.target.closest('[data-2048-board]')&&event.touches.length===1)touchStart=[event.touches[0].clientX,event.touches[0].clientY];
    },{passive:true});
    section.addEventListener('touchend',event=>{
      if(active!=='2048'||!touchStart)return;
      const end=event.changedTouches[0],dx=end.clientX-touchStart[0],dy=end.clientY-touchStart[1];
      touchStart=null;
      if(Math.max(Math.abs(dx),Math.abs(dy))<25)return;
      move2048(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));
    },{passive:true});
  }

  window.SiteCraftExtraGames = {append:append};
})();