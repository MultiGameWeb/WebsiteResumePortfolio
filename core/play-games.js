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
    '.sc-pg-snake-shell{overflow:hidden;border:1px solid rgba(255,255,255,.14);border-radius:14px;background:#070a10}' +
    '.sc-pg-snake-frame{display:block;width:100%;height:clamp(560px,76vh,780px);min-height:560px;border:0;background:#070a10}' +
    '@media(max-width:620px){.sc-pg-snake-frame{height:720px;min-height:650px}}' +
    '.sc-pg-section button:focus-visible{outline:3px solid #f0abfc;outline-offset:3px}' +
    '@media(max-width:620px){.sc-pg-head{display:block}.sc-pg-brand{display:inline-flex;margin-top:14px}.sc-pg-tabs{display:grid;grid-template-columns:1fr}.sc-pg-tab{text-align:left}.sc-pg-panel{padding:14px;border-radius:16px}.sc-pg-memory{gap:6px}.sc-pg-memory button{border-radius:9px}.sc-pg-rps-choices button{width:calc(33.333% - 8px);min-height:92px}}' +
    '.sc-pg-game-tools{display:flex;align-items:center;justify-content:flex-end;gap:7px;flex-wrap:wrap;margin:-2px 0 13px}' +
    '.sc-pg-help{position:relative;max-width:100%;color:#e9e3f3;font-size:11px}' +
    '.sc-pg-help summary{cursor:pointer;list-style:none;min-height:35px;padding:9px 12px;border:1px solid rgba(255,255,255,.17);border-radius:10px;background:rgba(255,255,255,.055);font-weight:750}' +
    '.sc-pg-help summary::-webkit-details-marker{display:none}.sc-pg-help summary:after{content:"⌄";margin-left:8px;color:#d8b4fe}' +
    '.sc-pg-help[open] summary:after{content:"⌃"}' +
    '.sc-pg-help-body{position:absolute;right:0;top:calc(100% + 7px);z-index:30;width:min(360px,calc(100vw - 48px));padding:13px 15px;border:1px solid rgba(255,255,255,.16);border-radius:12px;background:#211b30;box-shadow:0 18px 45px rgba(0,0,0,.4);color:#d7cee4;line-height:1.7}' +
    '.sc-pg-fullscreen{min-height:35px;padding:0 11px;border:1px solid rgba(255,255,255,.17);border-radius:10px;background:rgba(255,255,255,.055);color:#f4effb;font:750 10px Inter,system-ui,sans-serif;cursor:pointer}' +
    '.sc-pg-panel:fullscreen{width:100vw;height:100vh;max-height:100vh;overflow:auto;border:0;border-radius:0;padding:clamp(16px,3vw,36px);background:#11101b}' +
    '.sc-pg-panel:fullscreen .sc-pg-snake-frame{height:calc(100vh - 190px);min-height:420px}' +
    '.sc-pg-memory-meta{margin:-7px 0 13px;color:#aaa1bd;text-align:center;font-size:10px}' +
    '.sc-pg-memory button:disabled{cursor:default}.sc-pg-ttt button:disabled{opacity:.85}' +
    '@media(max-width:620px){.sc-pg-game-tools{justify-content:flex-start}.sc-pg-help-body{left:0;right:auto}.sc-pg-panel:fullscreen{padding:12px}.sc-pg-panel:fullscreen .sc-pg-snake-frame{height:calc(100vh - 210px);min-height:360px}}' +
    '@media(prefers-reduced-motion:reduce){.sc-pg-section *{transition:none!important}}';

  const memoryThemes = [
    { name:'Wild Animals', items:['🦁','🐯','🐘','🦒','🦓','🐼','🦊','🐵','🦏','🦛','🐻','🐨'] },
    { name:'Ocean Life', items:['🐬','🐳','🦈','🐙','🦀','🦞','🐠','🐢','🪼','🦭','🦑','🐚'] },
    { name:'Space', items:['🚀','🪐','🌎','🌙','⭐','☄️','👽','🛰️','🌌','🛸','🌞','🌠'] },
    { name:'Sports', items:['⚽','🏀','🏈','⚾','🎾','🏐','🎱','🥊','🏓','🏸','🥇','🏆'] },
    { name:'Vehicles', items:['🚗','🚕','🚌','🚑','🚒','🚜','🚲','🏍️','🚀','🚁','🚂','🚢'] },
    { name:'Nature', items:['🌵','🌴','🌻','🌈','🍀','🌳','🌋','🏔️','🌊','🌸','🍄','🌼'] },
    { name:'Music & Art', items:['🎸','🎹','🥁','🎺','🎻','🎧','🎤','🎨','🎬','🎼','🪇','🪈'] },
    { name:'Food & Treats', items:['🍕','🍔','🍟','🌮','🍩','🍪','🍿','🍦','🍉','🥑','🍜','🧁'] },
    { name:'Travel', items:['🗼','🗽','🏰','⛩️','🗿','🏝️','🏕️','🎡','🚠','🛶','🧳','🗺️'] },
    { name:'Everyday Things', items:['⌚','📷','🎒','🔑','💡','📚','🎁','☎️','🧸','🪁','🕹️','🪄'] }
  ];
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
          '<button class="sc-pg-tab" type="button" role="tab" aria-selected="false" data-pg-tab="snake">🐍 3D Snake Ultimate</button>' +
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

    let memoryTheme = '';
    let memoryTurn = 'you', youPairs = 0, computerPairs = 0;
    let computerMemory = new Map();
    let currentTttTurn = 'you';

    function helpText(instructions) {
      return '<div class="sc-pg-game-tools">' +
        '<details class="sc-pg-help"><summary>How to Play</summary><div class="sc-pg-help-body">' + instructions + '</div></details>' +
        '<button class="sc-pg-fullscreen" type="button" data-pg-fullscreen>⛶ Full Screen</button>' +
      '</div>';
    }
    function header(label, title, resetLabel, instructions) {
      return '<div class="sc-pg-gamehead"><div><small>' + label + '</small><h3>' + title + '</h3></div>' +
        '<button class="sc-pg-reset" type="button" data-pg-reset>' + resetLabel + '</button></div>' +
        helpText(instructions);
    }
    function score(label, value) { return '<span>' + label + '<strong>' + value + '</strong></span>'; }

    function paintMemory(message) {
      const turnName = memoryTurn === 'you' ? 'Your turn' : 'Computer is playing';
      panel.innerHTML = header('MEMORY MATCH · PLAYER VS COMPUTER', 'Beat the computer by finding more pairs.', '↻ New round',
        '<b>Goal:</b> Collect more matching pairs than the computer. <b>How:</b> On your turn, tap any two hidden cards. A match earns one pair and lets you play again. If they do not match, the cards turn back over and the computer takes its turn. The computer remembers cards it has seen. <b>Win:</b> The player with the most pairs after all 8 pairs are found wins.') +
        '<p class="sc-pg-status">' + esc(message || turnName) + '</p>' +
        '<p class="sc-pg-memory-meta">Theme this round: ' + esc(memoryTheme) + ' · ' + turnName + '</p>' +
        '<div class="sc-pg-memory">' +
        deck.map((symbol, i) => {
          const visible = matched.has(i) || opened.includes(i);
          return '<button type="button" data-pg-card="' + i + '" class="' +
            (matched.has(i) ? 'matched' : visible ? 'open' : '') + '"' +
            ((!visible && (locked || memoryTurn !== 'you')) || matched.has(i) ? ' disabled' : '') +
            ' aria-label="' + (visible ? esc(symbol) : 'Reveal card ' + (i + 1)) + '">' +
            (visible ? symbol : '?') + '</button>';
        }).join('') + '</div><div class="sc-pg-score">' +
        score('You', youPairs) + score('Computer', computerPairs) + score('Pairs found', matched.size / 2 + '/8') +
        '</div>';
    }
    function resetMemory() {
      const theme = shuffle(memoryThemes)[0];
      memoryTheme = theme.name;
      const picks = shuffle(theme.items).slice(0, 8);
      deck = shuffle(picks.concat(picks));
      opened = []; matched = new Set(); moves = 0; locked = false;
      memoryTurn = 'you'; youPairs = 0; computerPairs = 0; computerMemory = new Map();
      paintMemory('New ' + memoryTheme + ' cards! You start. Find a matching pair.');
    }
    function memoryRemember(index) {
      if (!matched.has(index)) computerMemory.set(index, deck[index]);
    }
    function finishMemoryIfDone() {
      if (matched.size !== deck.length) return false;
      locked = true;
      const result = youPairs > computerPairs ? 'You win! 🎉' : youPairs < computerPairs ? 'Computer wins this round. Try again!' : 'It is a tie!';
      paintMemory(result + ' Final score — You ' + youPairs + ', Computer ' + computerPairs + '.');
      return true;
    }
    function resolveMemoryPair(who) {
      moves++;
      const [first, second] = opened;
      const isMatch = deck[first] === deck[second];
      if (isMatch) {
        matched.add(first); matched.add(second);
        computerMemory.delete(first); computerMemory.delete(second);
        if (who === 'you') youPairs++; else computerPairs++;
        opened = [];
        if (finishMemoryIfDone()) return;
        locked = false;
        memoryTurn = who;
        paintMemory(who === 'you' ? 'Nice match! You get another turn.' : 'Computer found a pair and gets another turn.');
        if (memoryTurn === 'computer') window.setTimeout(runComputerMemoryTurn, 700);
      } else {
        window.setTimeout(() => {
          if (game !== 'memory') return;
          opened = []; locked = false;
          memoryTurn = who === 'you' ? 'computer' : 'you';
          paintMemory(who === 'you' ? 'No match. Computer turn.' : 'Computer missed. Your turn!');
          if (memoryTurn === 'computer') window.setTimeout(runComputerMemoryTurn, 550);
        }, 850);
      }
    }
    function runComputerMemoryTurn() {
      if (game !== 'memory' || memoryTurn !== 'computer' || matched.size === deck.length) return;
      locked = true;
      const known = [...computerMemory.entries()].filter(([index]) => !matched.has(index));
      let first = -1, second = -1;
      outer: for (let i = 0; i < known.length; i++) {
        for (let j = i + 1; j < known.length; j++) {
          if (known[i][1] === known[j][1]) { first = known[i][0]; second = known[j][0]; break outer; }
        }
      }
      if (first < 0) {
        const unknown = deck.map((_, i) => i).filter(i => !matched.has(i) && !computerMemory.has(i));
        const fallback = deck.map((_, i) => i).filter(i => !matched.has(i));
        const choices = unknown.length ? unknown : fallback;
        first = shuffle(choices)[0];
      }
      opened = [first]; memoryRemember(first); paintMemory('Computer reveals a card…');
      window.setTimeout(() => {
        if (game !== 'memory' || memoryTurn !== 'computer') return;
        if (second < 0 || matched.has(second) || second === first) {
          const available = deck.map((_, i) => i).filter(i => !matched.has(i) && i !== first);
          if (computerMemory.has(first)) {
            const pair = available.find(i => computerMemory.get(i) === computerMemory.get(first));
            second = pair ?? -1;
          }
          if (second < 0) {
            const unknown = available.filter(i => !computerMemory.has(i));
            second = shuffle(unknown.length ? unknown : available)[0];
          }
        }
        if (second == null || second < 0) { opened = []; locked = false; memoryTurn = 'you'; paintMemory('Your turn.'); return; }
        opened.push(second); memoryRemember(second);
        paintMemory('Computer reveals its second card…');
        window.setTimeout(() => {
          if (game !== 'memory' || memoryTurn !== 'computer') return;
          resolveMemoryPair('computer');
        }, 650);
      }, 650);
    }
    function paintTtt(message) {
      panel.innerHTML = header('TIC-TAC-TOE · YOU VS COMPUTER', 'Can you beat the computer?', '↻ New game',
        '<b>Goal:</b> Get three of your X marks in a row, column or diagonal before the computer gets three O marks. <b>How:</b> Tap any empty square. You play X first; the computer replies with O. <b>Win:</b> Make a line of three. The computer blocks winning moves and looks for its own winning line.') +
        '<p class="sc-pg-status">' + esc(message || (currentTttTurn === 'you' ? 'Your turn — you are X.' : 'Computer is thinking…')) + '</p><div class="sc-pg-ttt">' +
        board.map((value, i) => '<button type="button" data-pg-cell="' + i + '" class="' +
          (value ? value.toLowerCase() : '') + '"' + (value || ended || currentTttTurn !== 'you' ? ' disabled' : '') + ' aria-label="Cell ' +
          (i + 1) + (value ? ': ' + value : ': empty') + '">' + value + '</button>').join('') + '</div>';
    }
    function tttWinner(state, mark) {
      const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
      return lines.some(line => line.every(i => state[i] === mark));
    }
    function computerTttMove() {
      let bestScore = -Infinity, bestMoves = [];
      function minimax(state, maximizing, depth) {
        if (tttWinner(state, 'O')) return 10 - depth;
        if (tttWinner(state, 'X')) return depth - 10;
        const empty = state.map((value, i) => value ? -1 : i).filter(i => i >= 0);
        if (!empty.length) return 0;
        if (maximizing) {
          let best = -Infinity;
          empty.forEach(i => { state[i] = 'O'; best = Math.max(best, minimax(state, false, depth + 1)); state[i] = ''; });
          return best;
        }
        let best = Infinity;
        empty.forEach(i => { state[i] = 'X'; best = Math.min(best, minimax(state, true, depth + 1)); state[i] = ''; });
        return best;
      }
      board.forEach((value, i) => {
        if (value) return;
        board[i] = 'O';
        const valueScore = minimax(board, false, 1);
        board[i] = '';
        if (valueScore > bestScore) { bestScore = valueScore; bestMoves = [i]; }
        else if (valueScore === bestScore) bestMoves.push(i);
      });
      return bestMoves.length ? shuffle(bestMoves)[0] : -1;
    }
    function runComputerTtt() {
      if (game !== 'ttt' || currentTttTurn !== 'computer' || ended) return;
      const index = computerTttMove();
      if (index >= 0) board[index] = 'O';
      if (tttWinner(board, 'O')) { ended = true; currentTttTurn = 'done'; paintTtt('Computer wins this round. 🤖'); }
      else if (board.every(Boolean)) { ended = true; currentTttTurn = 'done'; paintTtt('It is a draw. Well played!'); }
      else { currentTttTurn = 'you'; paintTtt('Computer played O. Your turn!'); }
    }
    function resetTtt() { board = Array(9).fill(''); currentTttTurn = 'you'; ended = false; paintTtt('Your turn — you are X.'); }
    function paintRps(message) {
      const options = [{id:'rock',label:'Rock',emoji:'✊'},{id:'paper',label:'Paper',emoji:'✋'},{id:'scissors',label:'Scissors',emoji:'✌️'}];
      panel.innerHTML = header('ROCK PAPER SCISSORS · VS COMPUTER','Can you beat the computer?','↻ Reset score',
        '<b>Goal:</b> Beat the computer. <b>How:</b> Choose Rock, Paper or Scissors. The computer picks one too. Rock beats Scissors, Scissors beats Paper, and Paper beats Rock. <b>Win:</b> The round winner gets one point. Keep playing and try to get the higher score.') +
        '<p class="sc-pg-status" data-pg-rps-status>' + esc(message || 'Choose rock, paper or scissors to play.') + '</p>' +
        '<div class="sc-pg-rps-result"><span>You<strong data-pg-you-pick>' + esc(youPicked) +
        '</strong></span><span>VS</span><span>Computer<strong data-pg-computer-pick>' + esc(computerPicked) +
        '</strong></span></div><div class="sc-pg-rps-choices">' +
        options.map(o => '<button type="button" data-pg-choice="' + o.id + '"><span>' + o.emoji +
          '</span>' + o.label + '</button>').join('') + '</div><div class="sc-pg-score">' +
        score('You', you) + score('Computer', computer) + '</div>';
    }

    function paintSnake() {
      panel.innerHTML = header('3D SNAKE ULTIMATE · ARCADE', 'Choose your theme. Chase your high score.', '↻ Restart snake',
        '<b>Goal:</b> Collect eggs, grow your snake and beat your personal best. <b>How:</b> Use Arrow Keys or WASD on a keyboard, swipe on mobile, or use the on-screen arrow controls. Avoid hitting your own tail and the walls. Collect normal and golden eggs, catch the moving Mega Frog, and use power-up eggs wisely. Choose a board theme and snake skin from the selectors. <b>Win:</b> Keep playing and set a new high score.') +
        '<p class="sc-pg-status">Single-player arcade · 3 lives · 4 board themes · 6 snake skins · 8 egg types · moving portals. No login or account needed; your personal best stays in this browser.</p>' +
        '<div class="sc-pg-snake-shell"><iframe class="sc-pg-snake-frame" data-pg-snake-frame src="games/snake-ultimate.html" title="3D Snake Ultimate solo game" loading="lazy" referrerpolicy="no-referrer" allow="fullscreen" allowfullscreen></iframe></div>';
    }

    function switchGame(next) {
      game = next;
      tabs.forEach(tab => tab.setAttribute('aria-selected', String(tab.dataset.pgTab === game)));
      if (game === 'memory') resetMemory();
      else if (game === 'ttt') resetTtt();
      else if (game === 'snake') paintSnake();
      else paintRps();
    }
    tabs.forEach(tab => tab.addEventListener('click', () => switchGame(tab.dataset.pgTab)));
    panel.addEventListener('click', event => {
      if (event.target.closest('[data-pg-fullscreen]')) {
        const active = document.fullscreenElement || document.webkitFullscreenElement;
        if (active === panel) {
          const leave = document.exitFullscreen || document.webkitExitFullscreen;
          if (leave) leave.call(document);
        } else {
          const enter = panel.requestFullscreen || panel.webkitRequestFullscreen;
          if (enter) {
            const result = enter.call(panel);
            if (result && typeof result.catch === 'function') result.catch(() => {});
          }
        }
        return;
      }
      if (event.target.closest('[data-pg-reset]')) {
        if (game === 'memory') resetMemory();
        else if (game === 'ttt') resetTtt();
        else if (game === 'snake') {
          const frame = panel.querySelector('[data-pg-snake-frame]');
          if (frame) frame.src = frame.getAttribute('src');
        } else {
          you = 0; computer = 0; youPicked = '—'; computerPicked = '—';
          paintRps('Score reset. Your move!');
        }
        return;
      }
      if (game === 'memory') {
        const card = event.target.closest('[data-pg-card]');
        if (!card || locked || memoryTurn !== 'you') return;
        const index = Number(card.dataset.pgCard);
        if (!Number.isInteger(index) || matched.has(index) || opened.includes(index)) return;
        opened.push(index);
        memoryRemember(index);
        if (opened.length === 1) {
          paintMemory('Choose one more card.');
          return;
        }
        locked = true;
        paintMemory('Checking your pair…');
        window.setTimeout(() => {
          if (game === 'memory' && memoryTurn === 'you') resolveMemoryPair('you');
        }, 550);
        return;
      }
      if (game === 'ttt') {
        const cell = event.target.closest('[data-pg-cell]');
        if (!cell || ended || currentTttTurn !== 'you') return;
        const index = Number(cell.dataset.pgCell);
        if (!Number.isInteger(index) || board[index]) return;
        board[index] = 'X';
        if (tttWinner(board, 'X')) {
          ended = true; currentTttTurn = 'done'; paintTtt('You win! 🎉 Three X marks in a row.');
        } else if (board.every(Boolean)) {
          ended = true; currentTttTurn = 'done'; paintTtt('It is a draw. Well played!');
        } else {
          currentTttTurn = 'computer';
          paintTtt('Your move is in. Computer is thinking…');
          window.setTimeout(runComputerTtt, 360);
        }
        return;
      }
      if (game === 'rps') {
        const button = event.target.closest('[data-pg-choice]');
        if (!button) return;
        const choices = [{id:'rock',label:'Rock',emoji:'✊'},{id:'paper',label:'Paper',emoji:'✋'},{id:'scissors',label:'Scissors',emoji:'✌️'}];
        const player = choices.find(item => item.id === button.dataset.pgChoice);
        if (!player) return;
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
    function updateFullscreenLabel() {
      const active = document.fullscreenElement || document.webkitFullscreenElement;
      const button = panel.querySelector('[data-pg-fullscreen]');
      if (button) button.textContent = active === panel ? '⤢ Exit Full Screen' : '⛶ Full Screen';
    }
    document.addEventListener('fullscreenchange', updateFullscreenLabel);
    document.addEventListener('webkitfullscreenchange', updateFullscreenLabel);
    switchGame('memory');
  }

  window.SiteCraftPlayGames = { append: append, init: init };
})();