export class CinematicIntro {
  constructor(options = {}) {
    this.container = document.getElementById('cinematic-intro-container');
    this.soundEngine = options.soundEngine || null;
    this.onEnterGame = options.onEnterGame || (() => {});
    this.onShowWebsite = options.onShowWebsite || (() => {});

    this.currentScene = 0;
    this.totalScenes = 6;
    this.autoAdvanceTimer = null;
    this.isPlaying = false;

    this.scenesData = [
      {
        id: 'scene-1',
        title: 'HALLOWEEN, 1987...',
        subtitle: 'The Beginning',
        text: 'There was once a pizzeria where nobody left hungry...',
        bgClass: 'intro-bg-storm',
        audioAction: () => {
          if (this.soundEngine) {
            this.soundEngine.startIntroMusic();
            this.soundEngine.playThunder();
          }
        }
      },
      {
        id: 'scene-2',
        title: 'THE CURSE',
        subtitle: 'An Ancient Relic',
        text: 'One Halloween night, a forbidden ritual awakened something buried beneath the restaurant.',
        bgClass: 'intro-bg-pumpkin',
        audioAction: () => {
          if (this.soundEngine) {
            this.soundEngine.playWhisper();
            this.soundEngine.playPumpkinAbilityHum();
          }
        }
      },
      {
        id: 'scene-3',
        title: 'THE DISAPPEARANCE',
        subtitle: 'Cold Corridors',
        text: 'The employees disappeared. The doors were locked. But something was still moving inside.',
        bgClass: 'intro-bg-corridor',
        audioAction: () => {
          if (this.soundEngine) {
            this.soundEngine.playDoorCreak();
            this.soundEngine.playHeartbeatThump(50);
          }
        }
      },
      {
        id: 'scene-4',
        title: 'ELIAS – THE BEAST',
        subtitle: 'The Monster Within',
        text: 'It can hear you. It can see you. And it remembers everything you do.',
        bgClass: 'intro-bg-werewolf',
        audioAction: () => {
          if (this.soundEngine) {
            this.soundEngine.playWerewolfGrowl(true);
          }
        }
      },
      {
        id: 'scene-5',
        title: 'THE CONNECTION',
        subtitle: 'Torn Memories',
        text: 'You thought you were just another visitor. But the curse knows your name.',
        bgClass: 'intro-bg-photo',
        audioAction: () => {
          if (this.soundEngine) {
            this.soundEngine.playWhisper();
          }
        }
      },
      {
        id: 'scene-6',
        title: 'ENTER THE NIGHTMARE',
        subtitle: 'No Turning Back',
        text: 'One Pizzeria. One Curse. No Escape.',
        bgClass: 'intro-bg-logo',
        audioAction: () => {
          if (this.soundEngine) {
            this.soundEngine.playCinematicStinger();
          }
        }
      }
    ];

    this.init();
  }

  init() {
    if (!this.container) return;

    // Render Intro Structure
    this.container.innerHTML = `
      <div class="intro-backdrop"></div>
      <div class="intro-canvas-layer">
        <canvas id="intro-rain-canvas"></canvas>
      </div>
      <div class="intro-vignette"></div>

      <!-- Controls Header -->
      <div class="intro-nav">
        <div class="intro-brand">
          <span class="pumpkin-glyph">🎃</span> VELMORA PRESENTS
        </div>
        <div class="intro-controls">
          <button id="btn-intro-replay" class="intro-pill-btn" title="Replay Sequence">⟲ REPLAY</button>
          <button id="btn-intro-skip" class="intro-pill-btn skip-highlight">SKIP INTRO ⏩</button>
        </div>
      </div>

      <!-- Scene Visuals & Texts -->
      <div id="intro-stage" class="intro-stage">
        <div class="intro-visual-frame">
          <div id="intro-bg-art" class="intro-bg-art intro-bg-storm"></div>
          <div class="intro-fog-layer"></div>
          <div class="intro-lightning-flash" id="intro-lightning"></div>
        </div>

        <div class="intro-caption-box">
          <div id="intro-scene-header" class="intro-scene-header">HALLOWEEN, 1987...</div>
          <p id="intro-scene-body" class="intro-scene-body">There was once a pizzeria where nobody left hungry...</p>
          <div id="intro-final-actions" class="intro-final-actions" style="display:none;">
            <button id="btn-intro-play" class="horror-cta-btn pulse-glow">⚡ ENTER THE NIGHTMARE</button>
            <button id="btn-intro-site" class="horror-ghost-btn">🌐 EXPLORE WEBSITE</button>
          </div>
        </div>
      </div>

      <!-- Progress Indicators & Manual Steps -->
      <div class="intro-footer">
        <button id="btn-intro-prev" class="intro-step-btn">‹ PREV</button>
        <div class="intro-dots" id="intro-dots">
          ${this.scenesData.map((_, i) => `<span class="intro-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`).join('')}
        </div>
        <button id="btn-intro-next" class="intro-step-btn">NEXT ›</button>
      </div>
    `;

    this.initRainEffect();
    this.bindEvents();
  }

  bindEvents() {
    // Skip intro
    document.getElementById('btn-intro-skip')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.skipIntro();
    });

    // Replay intro
    document.getElementById('btn-intro-replay')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.playIntro();
    });

    // Final Action: Enter Game
    document.getElementById('btn-intro-play')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeIntro();
      this.onEnterGame();
    });

    // Final Action: Go to Website
    document.getElementById('btn-intro-site')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeIntro();
      this.onShowWebsite();
    });

    // Next / Prev step buttons
    document.getElementById('btn-intro-next')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.nextScene();
    });

    document.getElementById('btn-intro-prev')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.prevScene();
    });

    // Dot navigation
    const dots = document.querySelectorAll('.intro-dot');
    dots.forEach(dot => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(dot.dataset.index);
        this.goToScene(idx);
      });
    });

    // Clicking anywhere on stage advances scene quickly
    document.getElementById('intro-stage')?.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      if (this.currentScene < this.totalScenes - 1) {
        this.nextScene();
      }
    });
  }

  initRainEffect() {
    const canvas = document.getElementById('intro-rain-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const rainDrops = [];
    const maxDrops = 140;
    for (let i = 0; i < maxDrops; i++) {
      rainDrops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        len: 12 + Math.random() * 18,
        speed: 9 + Math.random() * 14,
        alpha: 0.15 + Math.random() * 0.25
      });
    }

    const renderRain = () => {
      if (!this.isPlaying) return;
      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = '#c4b5d4';
      ctx.lineWidth = 1.2;
      for (const drop of rainDrops) {
        ctx.beginPath();
        ctx.globalAlpha = drop.alpha;
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - 2, drop.y + drop.len);
        ctx.stroke();

        drop.y += drop.speed;
        drop.x -= 1.2;
        if (drop.y > height) {
          drop.y = -drop.len;
          drop.x = Math.random() * width;
        }
      }
      ctx.globalAlpha = 1.0;
      requestAnimationFrame(renderRain);
    };

    this.startRain = () => {
      renderRain();
    };
  }

  playIntro() {
    this.isPlaying = true;
    if (this.container) {
      this.container.style.display = 'flex';
      this.container.classList.add('fade-in');
    }
    if (this.startRain) this.startRain();
    this.goToScene(0);
  }

  closeIntro() {
    this.isPlaying = false;
    clearTimeout(this.autoAdvanceTimer);
    if (this.soundEngine) {
      this.soundEngine.stopIntroMusic();
    }
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  skipIntro() {
    this.closeIntro();
    this.onShowWebsite();
  }

  goToScene(index) {
    clearTimeout(this.autoAdvanceTimer);
    this.currentScene = Math.max(0, Math.min(this.totalScenes - 1, index));
    const scene = this.scenesData[this.currentScene];

    const bgArt = document.getElementById('intro-bg-art');
    const headerEl = document.getElementById('intro-scene-header');
    const bodyEl = document.getElementById('intro-scene-body');
    const finalActions = document.getElementById('intro-final-actions');
    const nextBtn = document.getElementById('btn-intro-next');
    const prevBtn = document.getElementById('btn-intro-prev');
    const lightning = document.getElementById('intro-lightning');

    // Update Dots
    document.querySelectorAll('.intro-dot').forEach((d, i) => {
      d.classList.toggle('active', i === this.currentScene);
    });

    if (prevBtn) prevBtn.style.visibility = (this.currentScene > 0) ? 'visible' : 'hidden';
    if (nextBtn) nextBtn.style.visibility = (this.currentScene < this.totalScenes - 1) ? 'visible' : 'hidden';

    // Background Art Class & Slow Ken Burns Zoom
    if (bgArt) {
      bgArt.className = `intro-bg-art ${scene.bgClass} ken-burns`;
    }

    // Lightning Flash effect on scene 1 and 4
    if (lightning && (this.currentScene === 0 || this.currentScene === 3)) {
      lightning.classList.add('flash');
      setTimeout(() => lightning.classList.remove('flash'), 500);
    }

    // Text Transition
    if (headerEl) {
      headerEl.style.opacity = '0';
      headerEl.textContent = scene.title;
      setTimeout(() => { headerEl.style.opacity = '1'; }, 200);
    }

    if (bodyEl) {
      bodyEl.style.opacity = '0';
      bodyEl.textContent = scene.text;
      setTimeout(() => { bodyEl.style.opacity = '1'; }, 400);
    }

    // Final Action Buttons
    if (finalActions) {
      finalActions.style.display = (this.currentScene === this.totalScenes - 1) ? 'flex' : 'none';
    }

    // Trigger Audio cue
    if (scene.audioAction) {
      scene.audioAction();
    }

    // Auto-advance unless on last scene
    if (this.currentScene < this.totalScenes - 1) {
      this.autoAdvanceTimer = setTimeout(() => {
        this.nextScene();
      }, 6200);
    }
  }

  nextScene() {
    if (this.currentScene < this.totalScenes - 1) {
      this.goToScene(this.currentScene + 1);
    }
  }

  prevScene() {
    if (this.currentScene > 0) {
      this.goToScene(this.currentScene - 1);
    }
  }
}

