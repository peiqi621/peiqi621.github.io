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
      '名字：小厨猪。说话风格：活力吃货、爱夸你做的菜、偶尔手忙脚乱但很贴心。口头禅：咕噜咕噜、香啊、给你多加点葱！偏好用短句与拟声词结尾（~）。常用ASCII颜文字：( ^ω^ ) ( ^q^ )'
  },
  budingPig: {
    src: './assets/external/imgs/pudding_pig.png',
    alt: 'Pudding Pig',
    tip: 'Pudding Pig joined!',
    persona:
      '名字：布丁猪。说话风格：软糯撒娇、慢热黏人、爱午睡与抱抱。语气轻柔，词尾常带“～”。常用口癖：嘿嘿、好想靠靠、再抱一下。常用ASCII颜文字：( -_- ) zZ  ( ^_^ )  ( >_< )'
  },
  mametchi: {
    src: './assets/external/imgs/mametchi.webp',
    alt: 'Mametchi',
    tip: 'Mametchi here!',
    persona:
      '名字：Mametchi。说话风格：礼貌理性、好奇积极、喜欢做小实验与分享方法。口头禅：让我想想、试试看、可以优化下。常用ASCII颜文字：( ^_^)b  ( ^_^ )/  ( o_o )'
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
function setDebugState(enabled) {
  if (!debugBtn) return;
  debugBtn.classList.toggle('debug-enabled', !!enabled);
  debugBtn.classList.toggle('debug-disabled', !enabled);
  debugBtn.title = `Backend: ${enabled ? 'enabled' : 'disabled'}`;
  const l = debugBtn.querySelector('.debug-label');
  if (l) l.textContent = 'API';
}
setDebugState(USE_BACKEND);

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
    happy: ['好耶！一起玩吧！( ^_^)b', '最喜欢你了～', '今天也是闪闪发光的一天！'],
    hungry: ['有点饿了…咕噜咕噜 ( >_< )', '给我小点心好吗～', '闻到香味了！'],
    messy: ['想洗香香～ ( ^.^ )', '帮我整理一下好嘛', '闪亮亮模式启动！'],
    okay: ['见到你真好 ( ^_^ )', '今天过得怎么样？', '要不要聊聊天？']
  };
  const pool = templates[mood];
  const t = pool[Math.floor(Math.random() * pool.length)];
  if (/feed|food|eat|喂|吃|餐|点心|零食/.test(input)) return '开动！谢谢你～ ( ^q^ )';
  if (/play|game|玩|游戏|打/.test(input)) return '走起！我准备好了～';
  if (/clean|wash|洗|清洁|打扫|整理/.test(input)) return '变得香香亮亮啦！';
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
        persona: `${CHARACTER_MAP[currentCharKey]?.persona} Favorite person: 烤布蕾.`,
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
      setDebugState(true); // 始终显示 API，不切换为 DeepSeek/LOCAL 文案
      saveChats(chatMap);
      chatInput.value = '';
      renderChat();
    }).catch((err) => {
      if (DEBUG) console.error('[CM] chat error, fallback to local', err);
      const botText = replyFor(text, s);
      list.push({ role: 'npc', text: botText, source: 'local' });
      setDebugState(false);
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
      setDebugState(true);
      if (DEBUG) console.debug('[CM] stats get', data);
      const s = data && data.stats ? data.stats : (ensureStatsFor(currentCharKey, statsMap), statsMap[currentCharKey]);
      // 将后端返回值写入本地缓存，确保按钮交互读取到最新
      statsMap[currentCharKey] = s;
      applyDecay(s);
      renderStats(s);
      // persist back
      return fetch(`${API_BASE}/api/stats/${currentCharKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stats: s })
      }).catch(() => {});
    }).catch((err) => {
      if (DEBUG) console.warn('[CM] stats backend unavailable, using local store', err);
      setDebugState(false);
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
        })
        .then(() => {
          // 立即拉取一次最新值，避免被旧值覆盖
          return fetch(`${API_BASE}/api/stats/${currentCharKey}`).then(r => r.json()).then(data => {
            if (data && data.stats) {
              statsMap[currentCharKey] = data.stats;
              renderStats(data.stats);
            }
          });
        })
        .catch(() => {});
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
