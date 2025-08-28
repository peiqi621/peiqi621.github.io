const pet = document.querySelector('.pet');
const buttons = document.querySelectorAll('.controls button');
const characterSelect = document.getElementById('characterSelect');
const screenEl = document.querySelector('.screen');
const bars = {
  hunger: document.getElementById('bar-hunger'),
  affection: document.getElementById('bar-affection'),
  cleanliness: document.getElementById('bar-cleanliness')
};

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

function setCharacter(key, silent = false) {
  const map = {
    chefPig: { src: './assets/external/imgs/cooking_pig.png', alt: 'Chef Pig', tip: 'Chef Pig joined!' },
    budingPig: { src: './assets/external/imgs/pudding_pig.png', alt: 'Pudding Pig', tip: 'Pudding Pig joined!' },
    mametchi: { src: './assets/external/imgs/mametchi.webp', alt: 'Mametchi', tip: 'Mametchi here!' }
  };
  const cfg = map[key] || map.mametchi;
  pet.src = cfg.src;
  pet.alt = cfg.alt;
  if (!silent) toast(cfg.tip);
}

function toast(text) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = text;
  screenEl.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

characterSelect?.addEventListener('change', (e) => setCharacter(e.target.value));

// default character is mametchi
setCharacter('mametchi', true);

// --- simple stats state ---
const STORAGE_KEY = 'cm_pet_stats_v1';
function loadStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { hunger: 70, affection: 60, cleanliness: 80, lastTs: Date.now() };
}

function saveStats(stats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

function applyDecay(stats) {
  const now = Date.now();
  const hours = (now - (stats.lastTs || now)) / (1000 * 60 * 60);
  if (hours > 0) {
    // hunger goes down，affection & cleanliness slowly down
    stats.hunger = Math.max(0, stats.hunger - hours * 2);
    stats.affection = Math.max(0, stats.affection - hours * 1);
    stats.cleanliness = Math.max(0, stats.cleanliness - hours * 1.5);
    stats.lastTs = now;
  }
}

function clamp(v) { return Math.max(0, Math.min(100, Math.round(v))); }

function renderStats(stats) {
  bars.hunger.style.width = `${clamp(stats.hunger)}%`;
  bars.affection.style.width = `${clamp(stats.affection)}%`;
  bars.cleanliness.style.width = `${clamp(stats.cleanliness)}%`;
}

let stats = loadStats();
applyDecay(stats);
renderStats(stats);
saveStats(stats);

// buttons effect
const effect = {
  feed: s => { s.hunger += 8; toast('Yummy!'); },
  play: s => { s.affection += 6; s.hunger -= 2; toast('Fun!'); },
  clean: s => { s.cleanliness += 10; toast('Sparkly!'); }
};

buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    const act = btn.dataset.action;
    if (effect[act]) {
      effect[act](stats);
      stats.hunger = clamp(stats.hunger);
      stats.affection = clamp(stats.affection);
      stats.cleanliness = clamp(stats.cleanliness);
      stats.lastTs = Date.now();
      renderStats(stats);
      saveStats(stats);
    }
  });
});
