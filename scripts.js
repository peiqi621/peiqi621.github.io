const pet = document.querySelector('.pet');
const buttons = document.querySelectorAll('.controls button');
const characterSelect = document.getElementById('characterSelect');
const screenEl = document.querySelector('.screen');

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
