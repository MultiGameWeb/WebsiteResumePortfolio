(() => {
  'use strict';
  const CSS = '.sc-pg-section{position:relative;isolation:isolate;overflow:hidden;padding:clamp(48px,7vw,82px) clamp(18px,4vw,30px);background:radial-gradient(ellipse at 12% 0%,rgba(139,92,246,.2),transparent 36%),radial-gradient(ellipse at 88% 85%,rgba(236,72,153,.14),transparent 34%),#11101b;color:#fbf9ff;color-scheme:dark;font-family:Inter,system-ui,sans-serif}' +
    '.sc-pg-section *{box-sizing:border-box}.sc-pg-inner{width:min(100%,1000px);margin:0 auto}' +
    '.sc-pg-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:25px}' +
    '.sc-pg-kicker{color:#d8b4fe;font-size:10px;font-weight:850;letter-spacing:.16em;text-transform:uppercase}' +
    '.sc-pg-head h2{margin:11px 0 9px;color:#fff;font-size:clamp(29px,4.3vw,45px);font-weight:850;line-height:1.05;letter-spacing:-.055em}' +
    '.sc-pg-head p{max-width:580px;margin:0;color:#bdb6ce;font-size:13px;line-height:1.75}' +
    '.sc-pg-brand{flex:0 0 auto;padding:8px 12px;border:1px solid rgba(255,255,255,.14);border-radius:999px;background:rgba(255,255,255,.05);color:#ded6eb;font-size:10px;font-weight:750}' +
    '.sc-pg-tabs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}' +
    '.sc-pg-tab{min-height:42px;padding:0 15px;border:1px solid rgba(255,255,255,.14);border-radius:12px;background:rgba(255,255,255,.045);color:#ddd5e9;font:750 11px Inter,system-ui,sans-serif;cursor:pointer}' +
    '.sc-pg-tab[aria-selected=true]{border-color:transparent;background:linear-gradient(110deg,#7c3aed,#db2777 65%,#ea580c);color:#fff}' +
    '.sc-pg-panel{min-height:320px;padding:clamp(16px,3vw,26px);border:1px solid rgba(255,255,255,.14);border-radius:20px;background:linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.025));box-shadow:0 18px 55px rgba(0,0,0,.2)}' +
    '.sc-pg-gamehead{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:12px}' +
    '.sc-pg-gamehead small{display:block;margin-bottom:6px;color:#d8b4fe;font-size:9px;font-weight:850;letter-spacing:.13em;text-transform:uppercase}' +
    '.sc-pg-gamehead h3{margin:0;color:#fff;font-size:clamp(18px,2.5vw,22px);font-weight:800}' +
    '.sc-pg-status{min-height:22px;margin:0 0 17px;color:#c9c1d7;font-size:12px;line-height:1.6}' +
    '.sc-pg-reset{min-height:35px;padding:0 12px;border:1px solid rgba(255,255,255,.14);border-radius:10px;background:rgba(255,255,255,.055);color:#f4effb;font:750 10px Inter,system-ui,sans-serif;cursor:pointer}' +
    '.sc-pg-memory{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;width:min(100%,420px);margin:0 auto}' +
    '.sc-pg-memory button{display:grid;place-items:center;aspect-ratio:1;border:1px solid rgba(216,180,254,.22);border-radius:12px;background:linear-gradient(145deg,#30213f,#211c31);color:#fff;font-size:clamp(20px,4vw,32px);cursor:pointer}' +
    '.sc-pg-memory button.open{background:linear-gradient(145deg,#4c2870,#342044);border-color:rgba(216,180,254,.7)}.sc-pg-memory button.matched{background:rgba(34,197,94,.14);border-color:rgba(74,222,128,.4);cursor:default}' +
    '.sc-pg-score{display:flex;justify-content:center;gap:23px;margin-top:15px;color:#aaa1bd;font-size:10px}.sc-pg-score strong{margin-left:5px;color:#fff;font-size:12px}' +
    '.sc-pg-ttt{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;width:min(100%,315px);margin:0 auto}' +
    '.sc-pg-ttt button{display:grid;place-items:center;aspect-ratio:1;border:1px solid rgba(255,255,255,.14);border-radius:13px;background:rgba(255,255,255,.045);color:#fff;font-size:clamp(30px,7vw,45px);font-weight:850;cursor:pointer}' +
    '.sc-pg-ttt button:disabled{cursor:default}.sc-pg-ttt .x{color:#c4b5fd}.sc-pg-ttt .o{color:#f9a8d4}' +
    '.sc-pg-rps-choices{display:flex;justify-content:center;flex-wrap:wrap;gap:10px;margin:20px auto}' +
    '.sc-pg-rps-choices button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;width:clamp(92px,18vw,125px);min-height:105px;border:1px solid rgba(255,255,255,.14);border-radius:15px;background:rgba(255,255,255,.045);color:#fff;font:750 11px Inter,system-ui,sans-serif;cursor:pointer}' +
    '.sc-pg-rps-choices button:hover{border-color:rgba(216,180,254,.65);background:rgba(139,92,246,.12)}.sc-pg-rps-choices span{font-size:30px}' +
    '.sc-pg-rps-result{display:flex;justify-content:center;align-items:center;gap:18px;flex-wrap:wrap;color:#d9d2e6;text-align:center;font-size:12px}.sc-pg-rps-result strong{display:block;margin-top:5px;color:#fff;font-size:19px}' +
    '.sc-pg-section button:focus-visible{outline:3px solid #f0abfc;outline-offset:3px}' +
    '@media(max-width:620px){.sc-pg-head{display:block}.sc-pg-brand{display:inline-flex;margin-top:14px}.sc-pg-tabs{display:grid;grid-template-columns:1fr}.sc-pg-tab{text-align:left}.sc-pg-panel{padding:14px;border-radius:16px}.sc-pg-memory{gap:6px}.sc-pg-memory button{border-radius:9px}.sc-pg-rps-choices button{width:calc(33.333% - 8px);min-height:92px}}' +
    '@media(prefers-reduced-motion:reduce){.sc-pg-section *{transition:none!important}}';

  const symbols = ['🍋','🍓','🍉','🍇','🍒','🥝','🍍','🥑'];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const shuffle = values => {
    const result = values.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  function append(root, brandName) {
    if (!root) return null;
    const host = root.querySelector && root.querySelector('.site-preview') || root;
    let section = host.querySelector && host.querySelector('.sc-pg-section');
    if (section) { init(section); return section; }

    const style = document.createElement('style');
    style.dataset.scPgStyle = 'true';
    style.textContent = CSS;
    section = document.createElement('section');
    section.className = 'sc-pg-section';
    section.id = 'play-games';
    section.setAttribute('aria-labelledby', 'sc-pg-title');
    section.innerHTML =
      '<div class="sc-pg-inner">' +
        '<div class="sc-pg-head"><div><span class="sc-pg-kicker">A LITTLE FUN</span>' +
        '<h2 id="sc-pg-title">Take a break. Play a game.</h2>' +
        '<p>Give your visitors a fun reason to stay a little longer. Pick a game below and enjoy a quick round—right here on this website.</p></div>' +
        (brandName ? '<span class="sc-pg-brand">' + esc(brandName) + '</span>' : '') +
        '</div>' +
        '<div class="sc-pg-tabs" role="tablist" aria-label="Choose a game">' +
          '<button class="sc-pg-tab" type="button" role="tab" aria-selected="true" data-pg-tab="memory">🧠 Memory Match</button>' +
          '<button class="sc-pg-tab" type="button" role="tab" aria-selected="false" data-pg-tab="ttt">⭕ Tic-Tac-Toe</button>' +
          '<button class="sc-pg-tab" type="button" role="tab" aria-selected="false" data-pg-tab="rps">✊ Rock Paper Scissors</button>' +
        '</div><div class="sc-pg-panel" data-pg-panel aria-live="polite"></div>' +
      '</div>';

    const footer = host.querySelector && host.querySelector('footer');
    if (footer) {
      host.insertBefore(style, footer);
      host.insertBefore(section, footer);
    } else {
      host.appendChild(style);
      host.appendChild(section);
    }
    init(section);
    return section;
  }

  function init(section) {
    if (!section || section.dataset.pgReady === 'true') return;
    section.dataset.pgReady = 'true';
    const panel = section.querySelector('[data-pg-panel]');
    const tabs = Array.from(section.querySelectorAll('[data-pg-tab]'));
    let game = 'memory';
    let deck = [], opened = [], matched = new Set(), moves = 0, locked = false;
    let board = Array(9).fill(''), turn = 'X', ended = false;
    let you = 0, computer = 0, youPicked = '—', computerPicked = '—';

    function header(label, title, resetLabel) {
      return '<div class="sc-pg-gamehead"><div><small>' + label + '</small><h3>' + title + '</h3></div>' +
        '<button class="sc-pg-reset" type="button" data-pg-reset>' + resetLabel + '</button></div>';
    }
    function score(label, value) { return '<span>' + label + '<strong>' + value + '</strong></span>'; }
    function paintMemory(message) {
      panel.innerHTML = header('MEMORY MATCH · 4 × 4','Find all eight matching pairs','↻ Restart') +
        '<p class="sc-pg-status">' + esc(message) + '</p><div class="sc-pg-memory">' +
        deck.map((symbol, i) => {
          const visible = matched.has(i) || opened.includes(i);
          return '<button type="button" data-pg-card="' + i + '" class="' +
            (matched.has(i) ? 'matched' : visible ? 'open' : '') + '"' +
            (matched.has(i) ? ' disabled' : '') + ' aria-label="' +
            (visible ? esc(symbol) : 'Reveal card ' + (i + 1)) + '">' +
            (visible ? symbol : '?') + '</button>';
        }).join('') + '</div><div class="sc-pg-score">' +
        score('Moves', moves) + score('Pairs', matched.size / 2 + '/8') + '</div>';
    }
    function resetMemory() {
      deck = shuffle(symbols.concat(symbols));
      opened = []; matched = new Set(); moves = 0; locked = false;
      paintMemory('Flip two cards and find the matching pairs.');
    }
    function paintTtt(message) {
      panel.innerHTML = header('TIC-TAC-TOE · TWO PLAYERS','A quick classic','↻ New game') +
        '<p class="sc-pg-status">' + esc(message || ('Player ' + turn + ', your turn.')) + '</p><div class="sc-pg-ttt">' +
        board.map((value, i) => '<button type="button" data-pg-cell="' + i + '" class="' +
          (value ? value.toLowerCase() : '') + '"' + (value || ended ? ' disabled' : '') + ' aria-label="Cell ' +
          (i + 1) + (value ? ': ' + value : ': empty') + '">' + value + '</button>').join('') + '</div>';
    }
    function resetTtt() { board = Array(9).fill(''); turn = 'X'; ended = false; paintTtt('Player X, your turn.'); }
    function paintRps(message) {
      const options = [{id:'rock',label:'Rock',emoji:'✊'},{id:'paper',label:'Paper',emoji:'✋'},{id:'scissors',label:'Scissors',emoji:'✌️'}];
      panel.innerHTML = header('ROCK PAPER SCISSORS · VS COMPUTER','Can you beat the computer?','↻ Reset score') +
        '<p class="sc-pg-status" data-pg-rps-status>' + esc(message || 'Choose rock, paper or scissors to play.') + '</p>' +
        '<div class="sc-pg-rps-result"><span>You<strong data-pg-you-pick>' + esc(youPicked) +
        '</strong></span><span>VS</span><span>Computer<strong data-pg-computer-pick>' + esc(computerPicked) +
        '</strong></span></div><div class="sc-pg-rps-choices">' +
        options.map(o => '<button type="button" data-pg-choice="' + o.id + '"><span>' + o.emoji +
          '</span>' + o.label + '</button>').join('') + '</div><div class="sc-pg-score">' +
        score('You', you) + score('Computer', computer) + '</div>';
    }

    function switchGame(next) {
      game = next;
      tabs.forEach(tab => tab.setAttribute('aria-selected', String(tab.dataset.pgTab === game)));
      if (game === 'memory') resetMemory();
      else if (game === 'ttt') resetTtt();
      else paintRps();
    }
    tabs.forEach(tab => tab.addEventListener('click', () => switchGame(tab.dataset.pgTab)));
    panel.addEventListener('click', event => {
      if (event.target.closest('[data-pg-reset]')) {
        if (game === 'memory') resetMemory();
        else if (game === 'ttt') resetTtt();
        else { you = 0; computer = 0; youPicked = '—'; computerPicked = '—'; paintRps('Score reset. Your move!'); }
        return;
      }
      if (game === 'memory') {
        const card = event.target.closest('[data-pg-card]');
        if (!card || locked) return;
        const index = Number(card.dataset.pgCard);
        if (!Number.isInteger(index) || matched.has(index) || opened.includes(index)) return;
        opened.push(index);
        if (opened.length === 1) { paintMemory('Good start. Find the matching symbol.'); return; }
        moves++;
        const first = opened[0], second = opened[1];
        if (deck[first] === deck[second]) {
          matched.add(first); matched.add(second); opened = [];
          paintMemory(matched.size === deck.length ? 'Perfect! You found every pair. 🎉' : 'A match! Keep going.');
        } else {
          locked = true;
          paintMemory('Not a match. Take another look…');
          window.setTimeout(() => {
            if (game !== 'memory') return;
            opened = []; locked = false; paintMemory('Try another pair.');
          }, 720);
        }
        return;
      }
      if (game === 'ttt') {
        const cell = event.target.closest('[data-pg-cell]');
        if (!cell || ended) return;
        const index = Number(cell.dataset.pgCell);
        if (!Number.isInteger(index) || board[index]) return;
        board[index] = turn;
        const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        const won = lines.some(line => line.every(i => board[i] === turn));
        if (won) { ended = true; paintTtt('Player ' + turn + ' wins! 🎉'); }
        else if (board.every(Boolean)) { ended = true; paintTtt('It is a draw. Start another round!'); }
        else { turn = turn === 'X' ? 'O' : 'X'; paintTtt(); }
        return;
      }
      if (game === 'rps') {
        const button = event.target.closest('[data-pg-choice]');
        if (!button) return;
        const choices = [{id:'rock',label:'Rock',emoji:'✊'},{id:'paper',label:'Paper',emoji:'✋'},{id:'scissors',label:'Scissors',emoji:'✌️'}];
        const player = choices.find(item => item.id === button.dataset.pgChoice);
        const rival = choices[Math.floor(Math.random() * choices.length)];
        youPicked = player.emoji + ' ' + player.label;
        computerPicked = rival.emoji + ' ' + rival.label;
        let message;
        if (player.id === rival.id) message = 'It’s a draw. Try again!';
        else if ((player.id === 'rock' && rival.id === 'scissors') ||
                 (player.id === 'paper' && rival.id === 'rock') ||
                 (player.id === 'scissors' && rival.id === 'paper')) { you++; message = 'You win this round! 🎉'; }
        else { computer++; message = 'Computer wins this round. Go again!'; }
        paintRps(message);
      }
    });
    switchGame('memory');
  }

  window.SiteCraftPlayGames = { append: append, init: init };
})();