/**
 * ELDRITCH-CYBER ARCADE HUD ENGINE (Vanilla JS & Web Audio API)
 * Portfolio Owner: Muhammad Bilal Qadri (MBilal09-may)
 * 5-Color Dark Fantasy Palette: Midnight Violet, Deep Forest, Grey Olive, Frozen Water, Classic Crimson
 */

const CONFIG = {
  owner: "Muhammad Bilal Qadri",
  handle: "MBilal09-may",
  tagline: "FULL-STACK & MACHINE LEARNING DEVELOPER",
  profilePhoto: "profile-photo.jpg",
  projects: [
    {
      id: "node-01",
      code: "NODE-01",
      title: "Homework 6",
      badge: "HERO APP",
      role: "Interactive Canvas & Audio Web Application",
      description: "Hero project (Homework 6) featuring custom interactive graphics canvas, dynamic reactive audio, and full GitHub Pages live deployment.",
      github: "https://mbilal09-may.github.io/Heuser/CS_CRP/Homework_6/",
      live: "https://mbilal09-may.github.io/Heuser/CS_CRP/Homework_6/",
      stack: ["JavaScript", "HTML5 Canvas", "CSS3", "Web Audio"],
      status: "ONLINE // LIVE"
    },
    {
      id: "node-02",
      code: "NODE-02",
      title: "Optimized Crop Yield Classifier",
      badge: "ENSEMBLE ML",
      role: "Predictive Crop Recommendation & Agro-Telemetry",
      description: "Machine learning classifier deploying tuned Random Forest & Gradient Boosting models via Streamlit to predict optimal crops based on soil nutrients and atmospheric telemetry.",
      github: "https://github.com/MBilal09-may/Week5-Curriculam",
      stack: ["Python", "Scikit-Learn", "Streamlit", "Ensemble ML"],
      status: "CLASSIFIER // ONLINE"
    },
    {
      id: "node-03",
      code: "NODE-03",
      title: "Week3-Regression-Dashboard",
      badge: "ML TELEMETRY",
      role: "Machine Learning Regression Dashboard",
      description: "Predictive analysis dashboard implementing linear and polynomial regression models with statistical telemetry and visual evaluation.",
      github: "https://github.com/MBilal09-may/Week3-Regression-Dashboard",
      stack: ["Python", "Jupyter", "Scikit-Learn", "Matplotlib"],
      status: "ANALYSIS // READY"
    },
    {
      id: "node-04",
      code: "NODE-04",
      title: "Week2-Data-Analysis-Dashboard",
      badge: "DATA PIPELINE",
      role: "Statistical Analysis & Visual Exploration",
      description: "Exploratory data analysis dashboard featuring automated processing pipelines, distribution metrics, and multi-variable visualization.",
      github: "https://github.com/MBilal09-may/Week2-Data-Analysis-Dashboard",
      stack: ["Python", "Pandas", "Matplotlib", "Seaborn"],
      status: "PIPELINE // ACTIVE"
    }
  ]
};

// ==========================================
// 1. SOUND SYNTHESIZER (Web Audio API)
// Eldritch-Cyber sound effects
// ==========================================
class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // Eldritch radar blip
  playBlip() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(620, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1100, this.ctx.currentTime + 0.045);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.045);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  // Resonant dark-synth energy chord on activation
  playConfirm() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      // Minor resonant chord: A4, C5, E5, A5
      const notes = [440.0, 523.25, 659.25, 880.0];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        const startTime = this.ctx.currentTime + idx * 0.035;
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.06, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.25);
      });
    } catch (e) {}
  }
}

const sfx = new SoundFX();

// ==========================================
// 2. BACKGROUND CANVAS ANIMATION & RADAR
// Procedural embers & coordinate lattice
// ==========================================
class BackgroundVisuals {
  constructor() {
    this.bgCanvas = document.getElementById('bg-canvas');
    this.bgCtx = this.bgCanvas ? this.bgCanvas.getContext('2d') : null;
    
    this.radarCanvas = document.getElementById('radar-canvas');
    this.radarCtx = this.radarCanvas ? this.radarCanvas.getContext('2d') : null;

    this.particles = [];
    this.radarAngle = 0;
    this.radarPings = [
      { r: 35, a: 0.8, x: 0.35, y: -0.45, label: "NODE-01" },
      { r: 55, a: 1.2, x: -0.52, y: 0.25, label: "NODE-02" },
      { r: 28, a: 2.1, x: 0.58, y: 0.48, label: "NODE-03" },
      { r: 48, a: 2.9, x: -0.28, y: -0.55, label: "NODE-04" }
    ];

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Generate floating eldritch embers (crimson, frozen-water, deep-forest mist)
    for (let i = 0; i < 75; i++) {
      const isCrimson = Math.random() > 0.65;
      this.particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -Math.random() * 0.45 - 0.05, // Subtle upward ember drift
        size: Math.random() * 2.2 + 1,
        color: isCrimson ? '#da1e37' : '#dff2fd',
        alpha: Math.random() * 0.5 + 0.25
      });
    }
  }

  resize() {
    if (!this.bgCanvas) return;
    this.bgCanvas.width = window.innerWidth;
    this.bgCanvas.height = window.innerHeight;
  }

  drawGrid() {
    if (!this.bgCtx) return;
    const ctx = this.bgCtx;
    const w = this.bgCanvas.width;
    const h = this.bgCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Coordinate grid lines (deep-forest / grey-olive tint)
    ctx.strokeStyle = 'rgba(122, 130, 116, 0.05)';
    ctx.lineWidth = 1;
    const step = 60;

    for (let x = 0; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    for (let y = 0; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Eldritch Embers animation & lattice connection
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fillRect(p.x, p.y, p.size, p.size);

      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 85) {
          ctx.strokeStyle = 'rgba(223, 242, 253, 0.08)';
          ctx.globalAlpha = (1 - dist / 85) * 0.1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1.0;
  }

  drawRadar() {
    if (!this.radarCtx) return;
    const ctx = this.radarCtx;
    const cx = 80;
    const cy = 80;
    const radius = 70;

    ctx.clearRect(0, 0, 160, 160);

    // Concentric rings (grey-olive & frozen-water)
    ctx.strokeStyle = 'rgba(122, 130, 116, 0.4)';
    ctx.lineWidth = 1;

    [20, 45, 70].forEach(r => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(cx - radius, cy);
    ctx.lineTo(cx + radius, cy);
    ctx.moveTo(cx, cy - radius);
    ctx.lineTo(cx, cy + radius);
    ctx.stroke();

    // Sweep line (Deep Forest to Classic Crimson sector)
    this.radarAngle += 0.035;

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, 'rgba(218, 30, 55, 0.25)');
    grad.addColorStop(1, 'transparent');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, this.radarAngle - 0.4, this.radarAngle);
    ctx.closePath();
    ctx.fill();

    // Radar blip targets for each node
    this.radarPings.forEach((ping, idx) => {
      const px = cx + ping.x * 55;
      const py = cy + ping.y * 55;
      
      const isSelected = window.engineInstance && window.engineInstance.selectedIndex === idx;
      ctx.fillStyle = isSelected ? '#da1e37' : '#dff2fd';
      ctx.beginPath();
      ctx.arc(px, py, isSelected ? 3.5 : 2.5, 0, Math.PI * 2);
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#da1e37';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  }

  render() {
    this.drawGrid();
    this.drawRadar();
  }
}

// ==========================================
// 3. MAIN GAME & HUD INTERFACE CONTROLLER
// ==========================================
class PortfolioGameEngine {
  constructor() {
    window.engineInstance = this;
    this.selectedIndex = 0;
    this.state = 'IDLE'; // IDLE, SELECTED, LAUNCHING
    this.cards = [];
    this.visuals = new BackgroundVisuals();
    this.typewriterInterval = null;

    // Performance telemetry
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.fps = 60;

    this.initUI();
    this.bindEvents();
    this.startGameLoop();
  }

  initUI() {
    // Populate Pilot Profile & Avatar
    const ownerEl = document.getElementById('owner-name');
    const taglineEl = document.getElementById('owner-tagline');
    const avatarImg = document.getElementById('pilot-avatar-img');

    if (ownerEl) {
      ownerEl.textContent = CONFIG.owner;
      ownerEl.setAttribute('data-text', CONFIG.owner);
    }
    if (taglineEl) {
      taglineEl.textContent = `${CONFIG.handle} // ${CONFIG.tagline}`;
    }
    if (avatarImg && CONFIG.profilePhoto) {
      avatarImg.src = CONFIG.profilePhoto;
    }

    // Populate Mission Matrix Nodes
    const grid = document.getElementById('nodes-grid');
    if (!grid) return;
    grid.innerHTML = '';

    CONFIG.projects.forEach((proj, idx) => {
      const card = document.createElement('article');
      card.className = 'node-card';
      card.dataset.index = idx;
      card.innerHTML = `
        <div class="node-top">
          <span class="node-index">${proj.code}</span>
          <span class="node-status-tag">${proj.badge}</span>
        </div>
        <div class="node-title">${proj.title}</div>
        <div class="node-desc">${proj.description}</div>
        <div class="node-footer">
          <span>${proj.status}</span>
          <span class="node-action-prompt">&gt; [ENGAGE]</span>
        </div>
      `;

      card.addEventListener('mouseenter', () => {
        this.selectNode(idx, false);
      });

      card.addEventListener('click', () => {
        this.selectNode(idx, false);
        this.launchSelected();
      });

      grid.appendChild(card);
      this.cards.push(card);
    });

    this.updateSelectionView();
    this.logTerminal(`SYS_BOOT: VERIFIED PILOT [${CONFIG.owner}]`);
    this.logTerminal(`TACTICAL_NODES: 4 ACTIVE MODULES ONLINE`);
  }

  selectNode(index, playAudio = true) {
    if (index < 0) index = this.cards.length - 1;
    if (index >= this.cards.length) index = 0;

    if (this.selectedIndex !== index && playAudio) {
      sfx.playBlip();
    }

    this.selectedIndex = index;
    this.state = 'SELECTED';
    this.updateSelectionView();
  }

  updateSelectionView() {
    this.cards.forEach((card, idx) => {
      if (idx === this.selectedIndex) {
        card.classList.add('selected');
        // Check if card is out of visible view before smooth scrolling to avoid unnecessary viewport jumps
        const rect = card.getBoundingClientRect();
        const inViewport = (
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
          rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
        if (!inViewport) {
          card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      } else {
        card.classList.remove('selected');
      }
    });

    const currentProj = CONFIG.projects[this.selectedIndex];
    if (!currentProj) return;

    // Update Right Inspector / Dossier
    const idEl = document.getElementById('dossier-id');
    const titleEl = document.getElementById('dossier-title');
    const descEl = document.getElementById('dossier-desc');
    const tagsEl = document.getElementById('dossier-tags');
    const bannerEl = document.getElementById('hud-status-banner');

    if (idEl) idEl.textContent = `TARGET IDENT: [${currentProj.code}]`;
    if (titleEl) titleEl.textContent = currentProj.title;
    if (bannerEl) bannerEl.textContent = `TARGET LOCKED // ${currentProj.code} [${currentProj.title}] — PRESS ENTER TO ACCESS`;

    // Render stack tags
    if (tagsEl && currentProj.stack) {
      tagsEl.innerHTML = currentProj.stack.map(tag => `<span class="tag">${tag}</span>`).join('');
    }

    // Typewriter effect on project desc + role
    if (descEl) {
      const fullText = `${currentProj.role.toUpperCase()}\n\n${currentProj.description}`;
      this.typewrite(descEl, fullText);
    }
  }

  typewrite(element, text) {
    if (this.typewriterTimer) {
      clearTimeout(this.typewriterTimer);
      this.typewriterTimer = null;
    }
    element.textContent = '';
    let i = 0;
    const speed = 12;

    const step = () => {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        this.typewriterTimer = setTimeout(step, speed);
      } else {
        this.typewriterTimer = null;
      }
    };
    step();
  }

  launchSelected() {
    const currentProj = CONFIG.projects[this.selectedIndex];
    if (!currentProj) return;

    this.state = 'LAUNCHING';
    sfx.playConfirm();

    const bannerEl = document.getElementById('hud-status-banner');
    if (bannerEl) {
      bannerEl.textContent = `>>> INITIALIZING DEPLOYMENT: ${currentProj.title} <<<`;
    }

    const card = this.cards[this.selectedIndex];
    if (card) {
      card.classList.add('active-launch');
      setTimeout(() => card.classList.remove('active-launch'), 400);
    }

    this.logTerminal(`DEPLOY: window.open("${currentProj.github}")`);
    if (currentProj.live) {
      this.logTerminal(`DEPLOY_LIVE: ${currentProj.live}`);
    }

    setTimeout(() => {
      window.open(currentProj.github, '_blank');
      this.state = 'IDLE';
    }, 320);
  }

  logTerminal(message) {
    const logBox = document.getElementById('terminal-log');
    if (!logBox) return;

    const time = new Date().toTimeString().split(' ')[0];
    const line = document.createElement('div');
    line.className = 'log-line';
    if (message.includes('DEPLOY')) line.className += ' crimson';
    line.textContent = `[${time}] > ${message}`;
    logBox.appendChild(line);
    logBox.scrollTop = logBox.scrollHeight;
  }

  // Keyboard navigation & audio triggers
  bindEvents() {
    window.addEventListener('keydown', (e) => {
      // First key interaction triggers audio context resume
      sfx.init();

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          this.selectNode(this.selectedIndex - 2);
          break;

        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          this.selectNode(this.selectedIndex + 2);
          break;

        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          this.selectNode(this.selectedIndex - 1);
          break;

        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          this.selectNode(this.selectedIndex + 1);
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          this.launchSelected();
          break;

        case 'm':
        case 'M':
          e.preventDefault();
          const isMuted = sfx.toggleMute();
          this.logTerminal(`AUDIO: ${isMuted ? 'MUTED' : 'SYNTH_ONLINE'}`);
          const audioStatusText = document.getElementById('audio-status-text');
          if (audioStatusText) {
            audioStatusText.textContent = `AUDIO: ${isMuted ? 'MUTED' : 'SYNTH_ONLINE'} [CLICK OR 'M']`;
          }
          break;
      }
    });

    // Inspector launch button click
    const launchBtn = document.getElementById('launch-btn');
    if (launchBtn) {
      launchBtn.addEventListener('click', () => {
        this.launchSelected();
      });
    }

    // Audio status test / toggle click
    const audioToggle = document.getElementById('audio-status');
    if (audioToggle) {
      audioToggle.addEventListener('click', () => {
        const isMuted = sfx.toggleMute();
        this.logTerminal(`AUDIO: ${isMuted ? 'MUTED' : 'SYNTH_ONLINE'}`);
        const audioStatusText = document.getElementById('audio-status-text');
        if (audioStatusText) {
          audioStatusText.textContent = `AUDIO: ${isMuted ? 'MUTED' : 'SYNTH_ONLINE'} [CLICK OR 'M']`;
        }
        if (!isMuted) {
          sfx.playConfirm();
        }
      });
    }

    // Clock updater
    setInterval(() => {
      const clock = document.getElementById('clock-display');
      if (clock) {
        const d = new Date();
        clock.textContent = d.toISOString().substring(11, 19) + ' UTC';
      }
    }, 1000);
  }

  // Continuous main loop
  startGameLoop() {
    const loop = (now) => {
      this.frameCount++;
      if (now - this.lastFrameTime >= 1000) {
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.lastFrameTime = now;
        const fpsEl = document.getElementById('fps-display');
        if (fpsEl) fpsEl.textContent = this.fps;
      }

      this.visuals.render();
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}

// Boot up game portfolio engine on load
window.addEventListener('DOMContentLoaded', () => {
  new PortfolioGameEngine();
});
