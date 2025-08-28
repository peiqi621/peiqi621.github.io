const pet = document.querySelector('.pet');
const buttons = document.querySelectorAll('.controls button');
const characterSelect = document.getElementById('characterSelect');
const screenEl = document.querySelector('.screen');
const bars = {
  hunger: document.getElementById('bar-hunger'),
  affection: document.getElementById('bar-affection'),
  cleanliness: document.getElementById('bar-cleanliness')
};
// chat modal elements
const chatModal = document.getElementById('chatModal');
const chatTitle = document.getElementById('chatTitle');
const chatClose = document.getElementById('chatClose');
const chatLog = document.getElementById('chatLog');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');

const classForAction = {
  feed: 'bounce',
  play: 'spin',
  clean: 'shake'
};

function animate(action) {
  const cls = classForAction[action] || 'bounce';
  pet.classList.remove('bounce', 'spin', 'shake');
  // force reflow to restart animation
  void pet.offsetWidth;
  pet.classList.add(cls);
  setTimeout(() => {
    pet.classList.remove(cls);
  }, 260);
}

buttons.forEach(btn => {
  btn.addEventListener('click', () => animate(btn.dataset.action));
});

const CHARACTER_MAP = {
  chefPig: { src: './assets/external/imgs/cooking_pig.png', alt: 'Chef Pig', tip: 'Chef Pig joined!' },
  budingPig: { src: './assets/external/imgs/pudding_pig.png', alt: 'Pudding Pig', tip: 'Pudding Pig joined!' },
  mametchi: { src: './assets/external/imgs/mametchi.webp', alt: 'Mametchi', tip: 'Mametchi here!' }
};
let currentCharKey = 'mametchi';

function setCharacter(key, silent = false) {
  const cfg = CHARACTER_MAP[key] || CHARACTER_MAP.mametchi;
  pet.src = cfg.src;
  pet.alt = cfg.alt;
  if (!silent) toast(cfg.tip);
  currentCharKey = key in CHARACTER_MAP ? key : 'mametchi';
}

function toast(text) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = text;
  screenEl.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

// open chat when clicking the pet
document.querySelector('.pet')?.addEventListener('click', () => openChat());

function openChat() {
  chatTitle.textContent = `Chat · ${CHARACTER_MAP[currentCharKey]?.alt || 'Pet'}`;
  renderChat();
  chatModal.classList.remove('hidden');
  chatModal.setAttribute('aria-hidden', 'false');
  chatInput.focus();
}

function closeChat() {
  chatModal.classList.add('hidden');
  chatModal.setAttribute('aria-hidden', 'true');
}

chatClose?.addEventListener('click', closeChat);
chatModal?.addEventListener('click', (e) => {
  if (e.target === chatModal || e.target.classList.contains('modal-backdrop')) closeChat();
});

const CHAT_STORAGE_KEY = 'cm_pet_chats_v1';
function loadChats() {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}
function saveChats(map) { localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(map)); }

let chatMap = loadChats();

function renderChat() {
  const list = chatMap[currentCharKey] || [];
  chatLog.innerHTML = '';
  list.forEach(m => {
    const div = document.createElement('div');
    div.className = `msg ${m.role}`;
    div.textContent = m.text;
    chatLog.appendChild(div);
  });
  chatLog.scrollTop = chatLog.scrollHeight;
}

function replyFor(input, stats) {
  const mood = stats.affection > 70 ? 'happy' : stats.hunger < 30 ? 'hungry' : stats.cleanliness < 40 ? 'messy' : 'okay';
  const templates = {
    happy: ["Yay! Let's play!", 'I adore you!', 'Best day ever!'],
    hungry: ['So hungry...', 'Feed me please?', 'Yummy time?'],
    messy: ['I need cleaning...', 'Sparkle time?', 'Feeling a bit dusty'],
    okay: ['Nice to see you!', 'Hello there!', 'How are you today?']
  };
  const pool = templates[mood];
  const t = pool[Math.floor(Math.random() * pool.length)];
  if (/feed|food|eat/i.test(input)) return 'Nom nom! Thank you!';
  if (/play|game/i.test(input)) return "Let's play!";
  if (/clean|wash/i.test(input)) return 'Shiny!';
  return t;
}

chatForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  const list = chatMap[currentCharKey] || (chatMap[currentCharKey] = []);
  list.push({ role: 'me', text });
  const s = statsMap[currentCharKey];
  const bot = replyFor(text, s);
  list.push({ role: 'npc', text: bot });
  saveChats(chatMap);
  chatInput.value = '';
  renderChat();
});
characterSelect?.addEventListener('change', (e) => {
  setCharacter(e.target.value);
  refreshActiveStats();
});

// default character is mametchi
setCharacter('mametchi', true);

// --- per-character stats state ---
const STORAGE_KEY = 'cm_pet_stats_v2_per_char';
const INIT_INTERVAL_HOURS = 6;

function loadStatsMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveStatsMap(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function randomInit() {
  const now = Date.now();
  return {
    hunger: Math.floor(40 + Math.random() * 50), // 40-90
    affection: Math.floor(30 + Math.random() * 60), // 30-90
    cleanliness: Math.floor(50 + Math.random() * 50), // 50-100
    lastTs: now,
    lastInitTs: now
  };
}

function ensureStatsFor(charKey, statsMap) {
  if (!statsMap[charKey]) {
    statsMap[charKey] = randomInit();
    return;
  }
  const s = statsMap[charKey];
  const now = Date.now();
  const hoursSinceInit = (now - (s.lastInitTs || 0)) / (1000 * 60 * 60);
  if (hoursSinceInit >= INIT_INTERVAL_HOURS) {
    statsMap[charKey] = randomInit();
  }
}

function applyDecay(stats) {
  const now = Date.now();
  const hours = (now - (stats.lastTs || now)) / (1000 * 60 * 60);
  if (hours > 0) {
    stats.hunger = Math.max(0, stats.hunger - hours * 2);
    stats.affection = Math.max(0, stats.affection - hours * 1);
    stats.cleanliness = Math.max(0, stats.cleanliness - hours * 1.5);
    stats.lastTs = now;
  }
}

function clamp(v) { return Math.max(0, Math.min(100, Math.round(v))); }

function renderStats(stats) {
  if (!bars.hunger) return;
  bars.hunger.style.width = `${clamp(stats.hunger)}%`;
  bars.affection.style.width = `${clamp(stats.affection)}%`;
  bars.cleanliness.style.width = `${clamp(stats.cleanliness)}%`;
}

let statsMap = loadStatsMap();

function refreshActiveStats() {
  ensureStatsFor(currentCharKey, statsMap);
  const s = statsMap[currentCharKey];
  applyDecay(s);
  renderStats(s);
  saveStatsMap(statsMap);
}

refreshActiveStats();

// buttons effect
const effect = {
  feed: s => { s.hunger += 8; toast('Yummy!'); },
  play: s => { s.affection += 6; s.hunger -= 2; toast('Fun!'); },
  clean: s => { s.cleanliness += 10; toast('Sparkly!'); }
};

buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    const act = btn.dataset.action;
    const s = statsMap[currentCharKey];
    if (effect[act] && s) {
      effect[act](s);
      s.hunger = clamp(s.hunger);
      s.affection = clamp(s.affection);
      s.cleanliness = clamp(s.cleanliness);
      s.lastTs = Date.now();
      renderStats(s);
      saveStatsMap(statsMap);
    }
  });
});

// periodic check for 6-hour reinit and decay
setInterval(() => {
  refreshActiveStats();
}, 60 * 1000);
