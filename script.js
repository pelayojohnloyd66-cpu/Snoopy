
'use strict';

/* ---- Personalize here ---- */
const CONFIG = {
  herName: '', 
  yourName: 'Your favorite person.', 
  music: 'assets/music.mp3', 
  images: {
    welcome: 'assets/snoopy-peep.webp',
    sticker: 'assets/giving-gift-snoopy.webp',
    game: 'assets/amor-love.webp',
    gameWin: 'assets/cheer-snoopy.webp',
    gameLose: 'assets/snoopy-esnupi.webp',
    gameMiss: 'assets/sigh-snoopy.webp',
    stickerTwo: 'assets/cute.webp',
    letter: 'assets/hugging-heart-snoopy.webp',
    final: 'assets/zzz-sleeping.webp',
  },
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rand = (a, b) => a + Math.random() * (b - a);

/* ---- Optional image overrides with graceful fallback ---- */
function setPic(el, key) {
  const url = CONFIG.images[key];
  if (!url || !el) return;
  const img = new Image();
  img.className = 'snoopy-img';
  img.alt = '';
  img.onload = () => el.replaceChildren(img); // only swap on success
  img.src = url;
}
$$('[data-img]').forEach((el) => setPic(el, el.dataset.img));
if (CONFIG.herName) $('#welcomeTitle').textContent = `HEY, ${CONFIG.herName.toUpperCase()}! 💜`;

/* ---- Toast ---- */
let toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ---- Sparkles & bursts ---- */
function burst(x, y, items, n, spread) {
  if (reduced) return;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.className = 'burst';
    s.textContent = items[i % items.length];
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    s.style.fontSize = rand(0.8, 1.6) + 'rem';
    const a = rand(0, Math.PI * 2),
      d = rand(spread * 0.4, spread);
    s.style.setProperty('--dx', Math.cos(a) * d + 'px');
    s.style.setProperty('--dy', Math.sin(a) * d + 'px');
    $('#fx').append(s);
    setTimeout(() => s.remove(), 1100);
  }
}
const sparkle = (x, y) => burst(x, y, ['✦', '✧', '♥'], 7, 60);
document.addEventListener('pointerdown', (e) => {
  if (e.target.closest('.btn, .icon')) sparkle(e.clientX, e.clientY);
});

/* ---- Floating hearts ---- */
if (!reduced)
  setInterval(() => {
    if ($$('.float').length > 12) return;
    const h = document.createElement('span');
    h.className = 'float';
    h.textContent = ['💜', '♡', '✦', '💗'][Math.floor(rand(0, 4))];
    h.style.left = rand(2, 95) + '%';
    h.style.fontSize = rand(0.9, 1.7) + 'rem';
    h.style.animationDuration = rand(7, 12) + 's';
    h.style.setProperty('--sway', rand(-40, 40) + 'px');
    $('#fx').append(h);
    h.addEventListener('animationend', () => h.remove());
  }, 1500);

/* ---- Screen navigation + progress ---- */
let current = 0;
function show(i) {
  current = i;
  $$('.screen').forEach((s, n) => s.classList.toggle('active', n === i));
  $('#bar').style.width = ((i + 1) / 6) * 100 + '%';
  $('.prog').setAttribute('aria-valuenow', i + 1);
  window.scrollTo(0, 0);
  if (i === 2) resetGameUI();
  if (i === 4) resetLetter();
}
$$('[data-next]').forEach((b) => b.addEventListener('click', () => show(current + 1)));
$('#openBtn').addEventListener('click', () => show(1));

/* ---- Music (never autoplays) ---- */
const bgm = $('#bgm');
bgm.src = CONFIG.music;
$('#musicBtn').addEventListener('click', (e) => {
  const btn = e.currentTarget;
  if (bgm.paused) {
    bgm
      .play()
      .then(() => btn.setAttribute('aria-pressed', 'true'))
      .catch(() => toast('Add your song at ' + CONFIG.music + ' 🎵'));
  } else {
    bgm.pause();
    btn.setAttribute('aria-pressed', 'false');
  }
});

/* ===== MINI-GAME ===== */
const G = {
  score: 0,
  time: 25,
  target: 20,
  run: false,
  tick: null,
  spawnT: null,
  misses: 0,
  said: new Set(),
};
const arena = $('#arena'),
  overlay = $('#overlay');
const MILESTONES = [
  [3, 'LOVE DELIVERY IN PROGRESS...'],
  [6, 'WOODSTOCK, WE NEED BACKUP!'],
  [10, 'OMG, THAT WAS FAST!'],
  [13, 'Snoopy approves of your dedication.'],
];
let best = 0;
try {
  best = +localStorage.getItem('lavender-best') || 0;
} catch (e) {}
$('#best').textContent = best;
$('#target').textContent = G.target;

const say = (m) => ($('#say').textContent = m);
function hud() {
  $('#score').textContent = G.score;
  $('#time').textContent = G.time;
}
function stopGame() {
  G.run = false;
  clearInterval(G.tick);
  clearTimeout(G.spawnT);
  $$('.drop', arena).forEach((d) => d.remove());
}

function resetGameUI() {
  stopGame();
  G.score = 0;
  G.time = 25;
  hud();
  say('Tap the falling hearts!');
  $('#ovTitle').textContent = 'Help Snoopy!';
  $('#ovText').textContent = 'Collect 20 hearts in 25 seconds. 💖 bonus hearts count triple!';
  setPic($('#ovSnoopy'), 'game');
  $('#react').hidden = true;
  $('#playBtn').textContent = 'START';
  $('#playBtn').hidden = false;
  $('#claimBtn').hidden = true;
  overlay.hidden = false;
}
function startGame() {
  stopGame();
  G.score = 0;
  G.time = 25;
  G.misses = 0;
  G.said.clear();
  G.run = true;
  overlay.hidden = true;
  hud();
  say('Snoopy is counting on you!');
  G.tick = setInterval(() => {
    G.time--;
    hud();
    if (G.time <= 0) endGame(false);
  }, 1000);
  spawn();
}
function spawn() {
  if (!G.run) return;
  const bonus = Math.random() < 0.18,
    el = document.createElement('button');
  el.className = 'drop' + (bonus ? ' gold' : '');
  el.textContent = bonus ? '💖' : '💜';
  el.setAttribute('aria-label', bonus ? 'Bonus heart' : 'Heart');
  const elapsed = 25 - G.time;
  el.style.left = rand(4, Math.max(10, arena.clientWidth - 60)) + 'px';
  el.style.animationDuration = Math.max(2.2, 3.7 - elapsed * 0.05) + 's';
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (!G.run || el.dataset.done) return;
    el.dataset.done = 1;
    G.score += bonus ? 3 : 1;
    sparkle(e.clientX, e.clientY);
    el.remove();
    hud();
    for (const [n, m] of MILESTONES)
      if (G.score >= n && !G.said.has(n)) {
        G.said.add(n);
        say(m);
      }
    if (G.score >= G.target) endGame(true);
  });
  el.addEventListener('animationend', () => {
    if (el.dataset.done) return;
    el.remove();
    G.misses++;
    if (G.run && G.misses % 3 === 1) {
      say('You missed one! Even Snoopy is disappointed. 😭');
      setPic($('#react'), 'gameMiss');
      $('#react').hidden = false;
      clearTimeout(G.reactT);
      G.reactT = setTimeout(() => ($('#react').hidden = true), 2200);
    }
  });
  arena.append(el);
  G.spawnT = setTimeout(spawn, Math.max(380, 800 - elapsed * 16));
}
function endGame(win) {
  stopGame();
  if (G.score > best) {
    best = G.score;
    $('#best').textContent = best;
    try {
      localStorage.setItem('lavender-best', best);
    } catch (e) {}
  }
  overlay.hidden = false;
  $('#ovTitle').textContent = win ? 'CONGRATULATIONS, BEBII GIRL! 💜' : 'So close, bebii!';
  $('#ovText').textContent = win
    ? "You officially have Snoopy's approval!"
    : `You got ${G.score} hearts. Snoopy believes in you!`;
  setPic($('#ovSnoopy'), win ? 'gameWin' : 'gameLose');
  $('#react').hidden = true;
  $('#claimBtn').hidden = !win;
  $('#playBtn').textContent = win ? 'PLAY AGAIN' : 'TRY AGAIN';
  if (win) burst(innerWidth / 2, innerHeight / 2, ['💜', '✦', '💗'], 24, 160);
}
$('#playBtn').addEventListener('click', startGame);
$('#restartBtn').addEventListener('click', () => {
  resetGameUI();
  startGame();
});

/* ===== REASON CARDS ===== */
const REASONS = [
  'Your smile makes even ordinary moments feel special.',
  'The way you make me happy without even trying.',
  'How you make distance feel a little less heavy.',
  "The little things about you that you probably don't even notice.",
  'The happiness I feel whenever I get to talk to you.',
  'The fact that I get to call someone like you mine.',
];
$('#cards').innerHTML = REASONS.map(
  (r, i) => `
  <button class="flip" aria-pressed="false" aria-label="Card ${i + 1}, tap to reveal">
    <span class="inner"><span class="face front">♡</span><span class="face back">${r}</span></span>
  </button>`,
).join('');
$$('.flip').forEach((c) =>
  c.addEventListener('click', () => {
    const on = c.classList.toggle('on');
    c.setAttribute('aria-pressed', on);
    if (on) {
      const r = c.getBoundingClientRect();
      sparkle(r.left + r.width / 2, r.top + r.height / 2);
    }
  }),
);

/* ===== LOVE LETTER ===== */
const LETTER = [
  ['h', 'To My Favorite Person, 💜'],
  ['', 'Hi, bebii.'],
  [
    '',
    "I don't really know where to begin, because sometimes words just don't seem enough to explain how much someone means to you. But today, I wanted to try. I wanted to make something that isn't just another message on your screen, but something you can come back to whenever you need a reminder of how loved and appreciated you are.",
  ],
  [
    '',
    "First of all, thank you. Thank you for being you. Thank you for all the little conversations, the random moments, the laughter, and even the ordinary days that somehow become special just because you're part of them.",
  ],
  [
    '',
    "I know we're miles apart, and sometimes I wish I could do more than just send messages through a screen. I wish I could be beside you when you're tired, make you laugh when you're having a bad day, hold your hand, and remind you in person that everything is going to be okay.",
  ],
  [
    '',
    'But even with the distance between us, please know that what I feel for you is something I genuinely treasure. I may not always have the perfect words, and I may not always know the perfect thing to do, but I hope you never doubt how much you matter to me.',
  ],
  [
    '',
    'I love the little things about you. The way you talk, the way you make me smile, the little things you share with me, and even the things you probably think nobody notices. I want to keep learning about you, understanding you, and discovering all the beautiful little pieces that make you who you are.',
  ],
  [
    '',
    "I don't want to promise you a perfect relationship, because I know we're both human. There will be difficult days, misunderstandings, and moments when things aren't easy. But I hope we continue choosing to understand each other, communicate honestly, and grow together.",
  ],
  [
    '',
    'I want to be someone you can laugh with, someone you can tell your random thoughts to, someone you can be silly around, and someone you can run to when life gets a little too heavy.',
  ],
  [
    '',
    "You don't have to be happy all the time. You don't have to pretend that everything is okay around me. You're allowed to have bad days, be quiet, feel tired, and just be yourself. I want you to know that you are appreciated not just on your happiest days, but on your ordinary and difficult ones, too.",
  ],
  [
    '',
    'And lastly, I hope this little website reminds you of something: even from a distance, someone is genuinely happy that you exist. Someone is grateful that you came into their life. Someone looks forward to talking to you, hearing about your day, and making more memories with you.',
  ],
  ['', 'That someone is me.'],
  [
    '',
    'So, please keep smiling, my bebii girl. Take care of yourself, eat properly, get enough rest, and never forget that you deserve all the beautiful things life has to offer.',
  ],
  [
    '',
    "If I could send you one thing through this screen, it wouldn't just be a gift. It would be a hug that lasts a little longer, a kiss on your forehead, and a reminder that you're precious to me.",
  ],
  ['', 'I love you, more than this little website could ever explain.'],
  ['b', 'Always rooting for you, always choosing you, and always grateful for you.'],
  ['', 'With all my love,'],
  ['b', CONFIG.yourName + ' 💜'],
  [
    '',
    "P.S. Snoopy and I agreed that you deserve unlimited hugs, forehead kisses, and happiness. Unfortunately, Snoopy couldn't fit all of them inside this website. 😭💜",
  ],
];
const body = $('#letterBody');
let typeT = null,
  finished = false;

function resetLetter() {
  clearTimeout(typeT);
  finished = false;
  body.innerHTML = '';
  $('#envBtn').classList.remove('open');
  $('#envWrap').hidden = false;
  $('#paper').hidden = true;
  $('#skipBtn').hidden = false;
  $('#afterLetter').hidden = true;
}
function finishLetter() {
  finished = true;
  clearTimeout(typeT);
  $$('p', body).forEach((p, i) => (p.textContent = LETTER[i][1]));
  $('#skipBtn').hidden = true;
  $('#afterLetter').hidden = false;
}
function typeLetter() {
  const ps = LETTER.map(([c, t]) => {
    const p = document.createElement('p');
    if (c) p.className = c;
    p.innerHTML = '<span></span><span class="off"></span>';
    p.lastChild.textContent = t;
    body.append(p);
    return p;
  });
  if (reduced) return finishLetter();
  let pi = 0,
    ci = 0;
  (function tick() {
    if (finished) return;
    const txt = LETTER[pi][1],
      p = ps[pi];
    ci += 4;
    p.firstChild.textContent = txt.slice(0, ci);
    p.lastChild.textContent = txt.slice(ci);
    if (ci >= txt.length) {
      pi++;
      ci = 0;
      if (pi >= LETTER.length) return finishLetter();
      typeT = setTimeout(tick, 200);
    } else typeT = setTimeout(tick, 20);
  })();
}
$('#envBtn').addEventListener('click', (e) => {
  const env = e.currentTarget;
  if (env.classList.contains('open')) return;
  env.classList.add('open');
  setTimeout(
    () => {
      $('#envWrap').hidden = true;
      $('#paper').hidden = false;
      typeLetter();
    },
    reduced ? 0 : 900,
  );
});
$('#skipBtn').addEventListener('click', finishLetter);

/* ===== FINAL SCREEN ===== */
$('#giftBtn').addEventListener('click', (e) => {
  e.currentTarget.hidden = true;
  $('#finalMsg').hidden = false;
  burst(
    innerWidth / 2,
    innerHeight / 2,
    ['💜', '💗', '✦', '♡', '✧'],
    40,
    Math.min(innerWidth, 420) * 0.8,
  );
  toast('You made it to the end, love 💜');
});

/* ===== REPLAY ===== */
$('#replayBtn').addEventListener('click', () => {
  stopGame();
  $('#giftBtn').hidden = false;
  $('#finalMsg').hidden = true;
  $$('.flip').forEach((c) => {
    c.classList.remove('on');
    c.setAttribute('aria-pressed', 'false');
  });
  try {
    localStorage.removeItem('lavender-best');
  } catch (e) {}
  best = 0;
  $('#best').textContent = 0;
  show(0);
});

show(0);