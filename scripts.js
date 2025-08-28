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
  chefPig: {
    src: './assets/external/imgs/cooking_pig.png',
    alt: 'Chef Pig',
    tip: 'Chef Pig joined!',
    persona:
      'Name: Chef Pig. Personality: foodie, enthusiastic little chef, upbeat, a bit clumsy but caring. Loves cooking, snacks, and praising your dishes. Says "nom" and "yummy" often.'
  },
  budingPig: {
    src: './assets/external/imgs/pudding_pig.png',
    alt: 'Pudding Pig',
    tip: 'Pudding Pig joined!',
    persona:
      'Name: Pudding Pig. Personality: soft and sweet, lazy-cute, loves naps and cuddles, timid at first but warms quickly. Speaks gently and uses cozy words.'
  },
  mametchi: {
    src: './assets/external/imgs/mametchi.webp',
    alt: 'Mametchi',
    tip: 'Mametchi here!',
    persona:
      'Name: Mametchi. Personality: curious, polite, optimistic, tidy. Loves learning, mini games, and encouraging words. Friendly and supportive tone.'
  }
};
let currentCharKey = 'mametchi';
// Backend configuration (can be overridden by a global var from HTML)
const API_BASE = window.CM_API_BASE || 'http://127.0.0.1:5057';
const USE_BACKEND = true; // set false to force local-only
const DEBUG = true;
if (DEBUG) console.debug('[CM] API_BASE =', API_BASE, 'USE_BACKEND =', USE_BACKEND);
// set debug indicator initial state
const debugBtn = document.getElementById('debugIndicator');
function setDebugState(enabled, label) {
  if (!debugBtn) return;
  debugBtn.classList.toggle('debug-enabled', !!enabled);
  debugBtn.classList.toggle('debug-disabled', !enabled);
  debugBtn.title = `Backend: ${enabled ? 'enabled' : 'disabled'}`;
  const l = debugBtn.querySelector('.debug-label');
  if (l) l.textContent = label || 'API';
}
setDebugState(USE_BACKEND, 'API');

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

// Clear chats on each page load (keep stats intact)
try { localStorage.removeItem(CHAT_STORAGE_KEY); } catch {}
let chatMap = loadChats();

function renderChat() {
  const list = chatMap[currentCharKey] || [];
  chatLog.innerHTML = '';
  list.forEach(m => {
    const div = document.createElement('div');
    div.className = `msg ${m.role}`;
    const textEl = document.createElement('div');
    textEl.textContent = m.text;
    div.appendChild(textEl);
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
  if (USE_BACKEND) {
    // try backend first
    const t0 = performance.now();
    fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        characterKey: currentCharKey,
        name: CHARACTER_MAP[currentCharKey]?.alt,
        persona: CHARACTER_MAP[currentCharKey]?.persona,
        message: text,
        stats: s,
        history: list
      })
    }).then(r => r.json()).then(data => {
      const dt = Math.round(performance.now() - t0);
      if (DEBUG) console.debug('[CM] chat response', {data, dt});
      const botText = (data && data.reply) || replyFor(text, s);
      const source = (data && data.source) || 'local';
      if (source !== 'deepseek' && data && data.error && DEBUG) {
        console.warn('[CM] deepseek fallback:', data.error);
      }
      list.push({ role: 'npc', text: botText, source, error: data && data.error });
      setDebugState(source === 'deepseek', source === 'deepseek' ? 'DeepSeek' : 'LOCAL');
      saveChats(chatMap);
      chatInput.value = '';
      renderChat();
    }).catch((err) => {
      if (DEBUG) console.error('[CM] chat error, fallback to local', err);
      const botText = replyFor(text, s);
      list.push({ role: 'npc', text: botText, source: 'local' });
      setDebugState(false, 'LOCAL');
      saveChats(chatMap);
      chatInput.value = '';
      renderChat();
    });
  } else {
    const bot = replyFor(text, s);
    list.push({ role: 'npc', text: bot, source: 'local' });
    saveChats(chatMap);
    chatInput.value = '';
    renderChat();
  }
});
characterSelect?.addEventListener('change', (e) => {
  setCharacter(e.target.value);
  refreshActiveStats();
});

// default character is mametchi
setCharacter('mametchi', true);

// --- per-character stats state ---
const STORAGE_KEY = 'cm_pet_stats_v2_per_char';

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
  // No periodic random re-initialization; values only decay over time
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
  if (USE_BACKEND) {
    fetch(`${API_BASE}/api/stats/${currentCharKey}`).then(r => r.json()).then(data => {
      setDebugState(true, 'API');
      if (DEBUG) console.debug('[CM] stats get', data);
      const s = data && data.stats ? data.stats : (ensureStatsFor(currentCharKey, statsMap), statsMap[currentCharKey]);
      applyDecay(s);
      renderStats(s);
      // persist back
      return fetch(`${API_BASE}/api/stats/${currentCharKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stats: s })
      }).catch(() => {});
    }).catch((err) => {
      if (DEBUG) console.warn('[CM] stats backend unavailable, using local store', err);
      setDebugState(false, 'LOCAL');
      // fallback to local
      ensureStatsFor(currentCharKey, statsMap);
      const s = statsMap[currentCharKey];
      applyDecay(s);
      renderStats(s);
      saveStatsMap(statsMap);
    });
  } else {
    ensureStatsFor(currentCharKey, statsMap);
    const s = statsMap[currentCharKey];
    applyDecay(s);
    renderStats(s);
    saveStatsMap(statsMap);
  }
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
      if (USE_BACKEND) {
        fetch(`${API_BASE}/api/stats/${currentCharKey}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stats: s })
        }).catch(() => {});
      } else {
        saveStatsMap(statsMap);
      }
    }
  });
});

// periodic check for 6-hour reinit and decay
setInterval(() => {
  refreshActiveStats();
}, 60 * 1000);
