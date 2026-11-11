// ==========================================
// Galaxy Catch Game - DOM Implementation
// Enhanced Wide-Screen, Procedural Audio, Smooth Lerp & LocalStorage Persistence
// ==========================================

// --- Storage Keys ---
const STORAGE_KEYS = {
  HIGH_SCORE: 'galaxy_catch_high_score',
  TOTAL_PLANETS: 'galaxy_catch_total_planets',
  GAMES_PLAYED: 'galaxy_catch_games_played',
  SAVED_SESSION: 'galaxy_catch_saved_session'
};

// --- Game Constants ---
let FIELD_WIDTH = window.innerWidth;
let FIELD_HEIGHT = window.innerHeight;

const PADDLE_WIDTH = 90;
const PADDLE_HEIGHT = 20;
const PADDLE_SPEED = 14;
const LERP_FACTOR = 0.16;

const ITEM_SIZE = 32;
const ITEM_BASE_SPEED = 3.2;
const SPEED_INCREMENT = 0.05;
const GOOD_ITEM_CHANCE = 0.72; // ~72% planets, 28% asteroids
const SCORE_PER_CATCH = 10;
const STARTING_LIVES = 3;

// --- DOM Elements ---
const playArea = document.getElementById('playArea');
const playerEl = document.getElementById('player');
const gameContainer = document.getElementById('gameContainer');
const damageFlashEl = document.getElementById('damageFlash');

// HUD
const scoreValEl = document.getElementById('scoreVal');
const highScoreValEl = document.getElementById('highScoreVal');
const livesValEl = document.getElementById('livesVal');
const pauseBtn = document.getElementById('pauseBtn');

// Start / Main Screen
const startScreen = document.getElementById('startScreen');
const startBtn = document.getElementById('startBtn');
const continueBtn = document.getElementById('continueBtn');
const resetDataBtn = document.getElementById('resetDataBtn');
const menuHighScoreVal = document.getElementById('menuHighScoreVal');
const menuPlanetsCaughtVal = document.getElementById('menuPlanetsCaughtVal');
const menuGamesPlayedVal = document.getElementById('menuGamesPlayedVal');

// Pause Screen
const pauseScreen = document.getElementById('pauseScreen');
const pauseScoreVal = document.getElementById('pauseScoreVal');
const pauseLivesVal = document.getElementById('pauseLivesVal');
const resumeBtn = document.getElementById('resumeBtn');
const abandonBtn = document.getElementById('abandonBtn');

// Game Over Screen
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreValEl = document.getElementById('finalScoreVal');
const gameOverHighScoreVal = document.getElementById('gameOverHighScoreVal');
const newHighScoreAlert = document.getElementById('newHighScoreAlert');
const playAgainBtn = document.getElementById('playAgainBtn');
const gameOverMenuBtn = document.getElementById('gameOverMenuBtn');

// --- Game State Variables ---
let score = 0;
let lives = STARTING_LIVES;
let gameActive = false;
let isPaused = false;
let itemsArray = [];
let particlesArray = [];
let animationFrameId = null;
let spawnTimer = null;
let currentSpawnInterval = 850;
let sessionPlanetsCaught = 0;

// Player paddle & smooth lerp target
const player = {
  x: (FIELD_WIDTH - PADDLE_WIDTH) / 2,
  y: FIELD_HEIGHT - PADDLE_HEIGHT - 24,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT
};
let playerTargetX = player.x;

// Key state tracker
const keysPressed = {
  ArrowLeft: false,
  ArrowRight: false,
  KeyA: false,
  KeyD: false
};

// Pointer tracking
let isDragging = false;
let lastPointerX = 0;

// ==========================================
// LOCAL STORAGE MANAGER
// ==========================================
function getStoredStats() {
  return {
    highScore: parseInt(localStorage.getItem(STORAGE_KEYS.HIGH_SCORE) || '0', 10),
    totalPlanets: parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_PLANETS) || '0', 10),
    gamesPlayed: parseInt(localStorage.getItem(STORAGE_KEYS.GAMES_PLAYED) || '0', 10),
    savedSession: (() => {
      try {
        const item = localStorage.getItem(STORAGE_KEYS.SAVED_SESSION);
        return item ? JSON.parse(item) : null;
      } catch (e) {
        return null;
      }
    })()
  };
}

function updateStoredStatsDisplay() {
  const stats = getStoredStats();
  highScoreValEl.textContent = stats.highScore;
  menuHighScoreVal.textContent = stats.highScore;
  menuPlanetsCaughtVal.textContent = stats.totalPlanets;
  menuGamesPlayedVal.textContent = stats.gamesPlayed;

  if (stats.savedSession) {
    continueBtn.classList.remove('hidden');
  } else {
    continueBtn.classList.add('hidden');
  }
}

function saveHighScoreIfNeeded(currentScore) {
  const stats = getStoredStats();
  let isNewHigh = false;
  if (currentScore > stats.highScore) {
    localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, currentScore.toString());
    highScoreValEl.textContent = currentScore;
    isNewHigh = true;
  }
  return isNewHigh;
}

function incrementGamesPlayed() {
  const stats = getStoredStats();
  localStorage.setItem(STORAGE_KEYS.GAMES_PLAYED, (stats.gamesPlayed + 1).toString());
}

function incrementTotalPlanets(count = 1) {
  const stats = getStoredStats();
  localStorage.setItem(STORAGE_KEYS.TOTAL_PLANETS, (stats.totalPlanets + count).toString());
}

function saveActiveGameSession() {
  const activeItemsData = itemsArray.map(item => ({
    type: item.type,
    subType: item.subType,
    x: item.x,
    y: item.y,
    speed: item.speed
  }));

  const session = {
    score,
    lives,
    playerX: player.x,
    currentSpawnInterval,
    sessionPlanetsCaught,
    items: activeItemsData
  };

  localStorage.setItem(STORAGE_KEYS.SAVED_SESSION, JSON.stringify(session));
}

function clearSavedSession() {
  localStorage.removeItem(STORAGE_KEYS.SAVED_SESSION);
  continueBtn.classList.add('hidden');
}

function resetAllData() {
  if (window.confirm("Are you sure you want to reset all high scores, stats, and saved games?")) {
    localStorage.removeItem(STORAGE_KEYS.HIGH_SCORE);
    localStorage.removeItem(STORAGE_KEYS.TOTAL_PLANETS);
    localStorage.removeItem(STORAGE_KEYS.GAMES_PLAYED);
    localStorage.removeItem(STORAGE_KEYS.SAVED_SESSION);
    updateStoredStatsDisplay();
  }
}

// ==========================================
// PROCEDURAL AUDIO ENGINE (WEB AUDIO API)
// ==========================================
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// Planet Catch Sound — Ascending Chime Sweep (Sine 440 -> 880 Hz)
function playPlanetSound() {
  if (!audioCtx) return;
  try {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.16);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch (e) {
    // Graceful fallback
  }
}

// Asteroid Explosion Sound — Low Frequency Drop & Filtered Noise Burst
function playAsteroidSound() {
  if (!audioCtx) return;
  try {
    const now = audioCtx.currentTime;

    // Filtered noise burst
    const bufferSize = Math.floor(audioCtx.sampleRate * 0.3);
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(160, now);
    filter.frequency.exponentialRampToValueAtTime(25, now + 0.28);

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);

    // Deep sub-bass thud (Sawtooth pitch drop)
    const subOsc = audioCtx.createOscillator();
    const subGain = audioCtx.createGain();

    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(28, now + 0.28);

    subGain.gain.setValueAtTime(0.4, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    subOsc.connect(subGain);
    subGain.connect(audioCtx.destination);

    noise.start(now);
    subOsc.start(now);

    noise.stop(now + 0.3);
    subOsc.stop(now + 0.3);
  } catch (e) {
    // Graceful fallback
  }
}

// ==========================================
// RESIZE & BOUNDARY CLAMPING
// ==========================================
function updateViewportDimensions() {
  FIELD_WIDTH = window.innerWidth;
  FIELD_HEIGHT = window.innerHeight;
  player.y = FIELD_HEIGHT - PADDLE_HEIGHT - 24;

  // Re-clamp player inside viewport boundaries
  clampPlayerTarget();
  player.x = playerTargetX;
  renderPlayerPosition();
}

window.addEventListener('resize', updateViewportDimensions);

function clampPlayerTarget() {
  const minX = 0;
  const maxX = FIELD_WIDTH - PADDLE_WIDTH;
  playerTargetX = Math.max(minX, Math.min(playerTargetX, maxX));
}

// ==========================================
// INPUT HANDLING (KEYBOARD, MOUSE, TOUCH)
// ==========================================
window.addEventListener('keydown', (e) => {
  if (e.code === 'Escape') {
    if (gameActive && !isPaused) {
      pauseGame();
    } else if (gameActive && isPaused) {
      resumeGame();
    }
    return;
  }

  if (e.code in keysPressed) {
    keysPressed[e.code] = true;
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code in keysPressed) {
    keysPressed[e.code] = false;
  }
});

window.addEventListener('blur', () => {
  keysPressed.ArrowLeft = false;
  keysPressed.ArrowRight = false;
  keysPressed.KeyA = false;
  keysPressed.KeyD = false;
  isDragging = false;
});

// Mouse dragging & movement
window.addEventListener('mousedown', (e) => {
  if (!gameActive || isPaused) return;
  // Ignore clicks on HUD interactive buttons
  if (e.target && e.target.closest && e.target.closest('.hud-btn, button, .overlay')) return;
  isDragging = true;
  lastPointerX = e.clientX;
  playerTargetX = e.clientX - PADDLE_WIDTH / 2;
  clampPlayerTarget();
});

window.addEventListener('mousemove', (e) => {
  if (!gameActive || isPaused) return;
  playerTargetX = e.clientX - PADDLE_WIDTH / 2;
  clampPlayerTarget();
});

window.addEventListener('mouseup', () => {
  isDragging = false;
});

// Touch controls for mobile / touchscreen
window.addEventListener('touchstart', (e) => {
  if (!gameActive || isPaused) return;
  if (e.target && e.target.closest && e.target.closest('.hud-btn, button, .overlay')) return;
  if (e.touches.length > 0) {
    isDragging = true;
    const touchX = e.touches[0].clientX;
    playerTargetX = touchX - PADDLE_WIDTH / 2;
    clampPlayerTarget();
  }
}, { passive: true });

window.addEventListener('touchmove', (e) => {
  if (!gameActive || isPaused) return;
  if (e.touches.length > 0) {
    const touchX = e.touches[0].clientX;
    playerTargetX = touchX - PADDLE_WIDTH / 2;
    clampPlayerTarget();
  }
}, { passive: true });

window.addEventListener('touchend', () => {
  isDragging = false;
});

// ==========================================
// MOVEMENT & SMOOTH LERP
// ==========================================
function updatePlayerPosition() {
  // Keyboard navigation
  if (keysPressed.ArrowLeft || keysPressed.KeyA) {
    playerTargetX -= PADDLE_SPEED;
  }
  if (keysPressed.ArrowRight || keysPressed.KeyD) {
    playerTargetX += PADDLE_SPEED;
  }

  clampPlayerTarget();

  // Linear Interpolation: lerp(current, target, factor)
  player.x += (playerTargetX - player.x) * LERP_FACTOR;
  renderPlayerPosition();
}

function renderPlayerPosition() {
  playerEl.style.transform = `translate3d(${player.x}px, ${player.y}px, 0)`;
}

// ==========================================
// SPAWN & FALLING ITEMS LOGIC
// ==========================================
function createItemElement(type, subType, x, y) {
  const el = document.createElement('div');
  el.classList.add('item');

  if (type === 'planet') {
    el.classList.add(subType === 1 ? 'item-planet-1' : 'item-planet-2');
  } else {
    el.classList.add('item-asteroid');
  }

  const inner = document.createElement('div');
  inner.classList.add('item-inner');
  el.appendChild(inner);

  el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  playArea.appendChild(el);
  return el;
}

function spawnItem(itemData = null) {
  if (!gameActive || isPaused) return;

  let type, subType, x, y, speed;

  if (itemData) {
    // Restore saved item
    type = itemData.type;
    subType = itemData.subType;
    x = itemData.x;
    y = itemData.y;
    speed = itemData.speed;
  } else {
    const isPlanet = Math.random() < GOOD_ITEM_CHANCE;
    type = isPlanet ? 'planet' : 'asteroid';
    subType = isPlanet ? (Math.random() < 0.5 ? 1 : 2) : 0;
    x = Math.random() * (FIELD_WIDTH - ITEM_SIZE);
    y = -ITEM_SIZE;
    speed = ITEM_BASE_SPEED + (score / SCORE_PER_CATCH) * SPEED_INCREMENT + (Math.random() * 0.8);
  }

  const el = createItemElement(type, subType, x, y);

  itemsArray.push({
    el,
    type,
    subType,
    x,
    y,
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    speed
  });
}

function startSpawning() {
  if (spawnTimer) clearInterval(spawnTimer);
  spawnTimer = setInterval(() => {
    if (gameActive && !isPaused) {
      spawnItem();
    }
  }, currentSpawnInterval);
}

function removeItem(index) {
  const item = itemsArray[index];
  if (item && item.el && item.el.parentNode) {
    item.el.parentNode.removeChild(item.el);
  }
  itemsArray.splice(index, 1);
}

// ==========================================
// VISUAL FX: PARTICLES, SCREEN SHAKE & FLASH
// ==========================================
function spawnCatchParticles(x, y, color) {
  const particleCount = 12;
  for (let i = 0; i < particleCount; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');
    p.style.width = '6px';
    p.style.height = '6px';
    p.style.backgroundColor = color;
    p.style.boxShadow = `0 0 8px ${color}`;

    const angle = (Math.PI * 2 * i) / particleCount + (Math.random() * 0.5);
    const velocity = 2.5 + Math.random() * 3.5;
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity;

    playArea.appendChild(p);

    particlesArray.push({
      el: p,
      x: x + ITEM_SIZE / 2,
      y: y + ITEM_SIZE / 2,
      vx,
      vy,
      opacity: 1,
      decay: 0.035 + Math.random() * 0.025
    });
  }
}

function updateParticles() {
  for (let i = particlesArray.length - 1; i >= 0; i--) {
    const p = particlesArray[i];
    p.x += p.vx;
    p.y += p.vy;
    p.opacity -= p.decay;

    if (p.opacity <= 0) {
      if (p.el.parentNode) p.el.parentNode.removeChild(p.el);
      particlesArray.splice(i, 1);
    } else {
      p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      p.el.style.opacity = p.opacity;
    }
  }
}

function triggerDamageVisuals() {
  // Red Flash
  damageFlashEl.classList.add('active');
  setTimeout(() => {
    damageFlashEl.classList.remove('active');
  }, 140);

  // Screen Shake
  gameContainer.classList.remove('shake');
  void gameContainer.offsetWidth; // Force reflow
  gameContainer.classList.add('shake');
  setTimeout(() => {
    gameContainer.classList.remove('shake');
  }, 280);
}

// ==========================================
// AABB COLLISION DETECTION & UPDATES
// ==========================================
function checkAABBCollision(box1, box2) {
  return (
    box1.x < box2.x + box2.width &&
    box1.x + box1.width > box2.x &&
    box1.y < box2.y + box2.height &&
    box1.y + box1.height > box2.y
  );
}

function updateItemsAndCheckCollisions() {
  for (let i = itemsArray.length - 1; i >= 0; i--) {
    const item = itemsArray[i];
    item.y += item.speed;
    item.el.style.transform = `translate3d(${item.x}px, ${item.y}px, 0)`;

    // Check collision with player paddle
    if (checkAABBCollision(item, player)) {
      if (item.type === 'planet') {
        score += SCORE_PER_CATCH;
        sessionPlanetsCaught++;
        playPlanetSound();
        saveHighScoreIfNeeded(score);

        const particleColor = item.subType === 1 ? '#e365c1' : '#b9d6f2';
        spawnCatchParticles(item.x, item.y, particleColor);

        // Dynamic difficulty ramping
        if (score % 60 === 0 && currentSpawnInterval > 380) {
          currentSpawnInterval -= 35;
          startSpawning();
        }
      } else {
        lives--;
        playAsteroidSound();
        triggerDamageVisuals();
        spawnCatchParticles(item.x, item.y, '#631d76');
      }

      removeItem(i);

      if (lives <= 0) {
        gameOver();
        return;
      }
      continue;
    }

    // Despawn off-screen items
    if (item.y > FIELD_HEIGHT + 20) {
      removeItem(i);
    }
  }
}

function renderHUD() {
  scoreValEl.textContent = score;
  let hearts = '';
  for (let i = 0; i < lives; i++) {
    hearts += '❤';
  }
  livesValEl.textContent = hearts || '0';
}

function cleanupAllEntities() {
  itemsArray.forEach(item => {
    if (item.el && item.el.parentNode) {
      item.el.parentNode.removeChild(item.el);
    }
  });
  itemsArray = [];

  particlesArray.forEach(p => {
    if (p.el && p.el.parentNode) {
      p.el.parentNode.removeChild(p.el);
    }
  });
  particlesArray = [];
}

// ==========================================
// MAIN GAME LOOP
// ==========================================
function gameLoop() {
  if (!gameActive || isPaused) return;

  updatePlayerPosition();
  updateItemsAndCheckCollisions();
  updateParticles();
  renderHUD();

  animationFrameId = requestAnimationFrame(gameLoop);
}

// ==========================================
// GAME STATE MANAGEMENT (START, PAUSE, CONTINUE, GAME OVER)
// ==========================================
function startGame(isResumeSaved = false) {
  initAudio();
  cleanupAllEntities();

  if (isResumeSaved) {
    const stats = getStoredStats();
    const session = stats.savedSession;
    if (session) {
      score = session.score || 0;
      lives = session.lives || STARTING_LIVES;
      currentSpawnInterval = session.currentSpawnInterval || 850;
      sessionPlanetsCaught = session.sessionPlanetsCaught || 0;
      player.x = session.playerX || (FIELD_WIDTH - PADDLE_WIDTH) / 2;
      playerTargetX = player.x;

      if (session.items && Array.isArray(session.items)) {
        session.items.forEach(it => spawnItem(it));
      }
    }
  } else {
    // Brand new mission
    score = 0;
    lives = STARTING_LIVES;
    currentSpawnInterval = 850;
    sessionPlanetsCaught = 0;
    FIELD_WIDTH = window.innerWidth;
    FIELD_HEIGHT = window.innerHeight;
    player.y = FIELD_HEIGHT - PADDLE_HEIGHT - 24;
    player.x = (FIELD_WIDTH - PADDLE_WIDTH) / 2;
    playerTargetX = player.x;
    incrementGamesPlayed();
    clearSavedSession();
  }

  isPaused = false;
  gameActive = true;

  renderPlayerPosition();
  renderHUD();
  updateStoredStatsDisplay();

  // Hide Overlays
  startScreen.classList.add('hidden');
  pauseScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');

  startSpawning();
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = requestAnimationFrame(gameLoop);
}

function pauseGame() {
  if (!gameActive || isPaused) return;
  isPaused = true;

  // Release held input states
  keysPressed.ArrowLeft = false;
  keysPressed.ArrowRight = false;
  keysPressed.KeyA = false;
  keysPressed.KeyD = false;
  isDragging = false;

  if (spawnTimer) {
    clearInterval(spawnTimer);
    spawnTimer = null;
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  // Save session state to localStorage
  saveActiveGameSession();

  // Show Pause Overlay
  pauseScoreVal.textContent = score;
  pauseLivesVal.textContent = lives;
  pauseScreen.classList.remove('hidden');
}

function resumeGame() {
  if (!gameActive || !isPaused) return;
  initAudio();
  isPaused = false;
  pauseScreen.classList.add('hidden');

  startSpawning();
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = requestAnimationFrame(gameLoop);
}

function abandonToMenu() {
  // Keep saved session in localStorage so the player can continue later
  saveActiveGameSession();
  gameActive = false;
  isPaused = false;

  cleanupAllEntities();
  pauseScreen.classList.add('hidden');
  startScreen.classList.remove('hidden');
  updateStoredStatsDisplay();
}

function gameOver() {
  gameActive = false;
  isPaused = false;

  // Release held input states
  keysPressed.ArrowLeft = false;
  keysPressed.ArrowRight = false;
  keysPressed.KeyA = false;
  keysPressed.KeyD = false;
  isDragging = false;

  if (spawnTimer) {
    clearInterval(spawnTimer);
    spawnTimer = null;
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  // Record stats to localStorage
  if (sessionPlanetsCaught > 0) {
    incrementTotalPlanets(sessionPlanetsCaught);
    sessionPlanetsCaught = 0;
  }
  const isNewRecord = saveHighScoreIfNeeded(score);
  clearSavedSession();

  // Update Game Over UI
  finalScoreValEl.textContent = score;
  const stats = getStoredStats();
  gameOverHighScoreVal.textContent = stats.highScore;

  if (isNewRecord && score > 0) {
    newHighScoreAlert.classList.remove('hidden');
  } else {
    newHighScoreAlert.classList.add('hidden');
  }

  gameOverScreen.classList.remove('hidden');
  gameContainer.classList.remove('shake');
  updateStoredStatsDisplay();
}

// ==========================================
// EVENT LISTENERS
// ==========================================
startBtn.addEventListener('click', () => startGame(false));
continueBtn.addEventListener('click', () => startGame(true));
pauseBtn.addEventListener('click', pauseGame);
resumeBtn.addEventListener('click', resumeGame);
abandonBtn.addEventListener('click', abandonToMenu);
playAgainBtn.addEventListener('click', () => startGame(false));
gameOverMenuBtn.addEventListener('click', () => {
  gameOverScreen.classList.add('hidden');
  startScreen.classList.remove('hidden');
  updateStoredStatsDisplay();
});
resetDataBtn.addEventListener('click', resetAllData);

// Initial setup
playerEl.style.left = '0px';
renderPlayerPosition();
renderHUD();
updateStoredStatsDisplay();
