import { PumpkinAbility } from '../pumpkin/JackOLantern.js';
import { SaveSystem } from '../core/SaveSystem.js';

export class UIManager {
  constructor(game) {
    this.game = game;

    // Elements cache
    this.screens = {
      menu: document.getElementById('screen-menu'),
      game: document.getElementById('screen-hud'),
      pause: document.getElementById('screen-pause'),
      inventory: document.getElementById('screen-inventory'),
      puzzle: document.getElementById('screen-puzzle'),
      gameOver: document.getElementById('screen-game-over'),
      victory: document.getElementById('screen-victory'),
      settings: document.getElementById('screen-settings'),
      howToPlay: document.getElementById('screen-how-to-play')
    };

    // HUD Elements
    this.promptEl = document.getElementById('hud-prompt');
    this.noiseBar = document.getElementById('hud-noise-fill');
    this.pumpkinBar = document.getElementById('hud-pumpkin-fill');
    this.staminaBar = document.getElementById('hud-stamina-fill');
    this.chapterBanner = document.getElementById('chapter-banner');
    this.toastEl = document.getElementById('toast-notification');
    this.debugOverlay = document.getElementById('debug-overlay');

    // Ability buttons on HUD
    this.abilitySlots = [
      document.getElementById('slot-1'),
      document.getElementById('slot-2'),
      document.getElementById('slot-3'),
      document.getElementById('slot-4')
    ];

    this.debugMode = false;

    this.initEventListeners();
  }

  initEventListeners() {
    console.log('Antigravity: Initializing UI Event Listeners...');

    // 1. Menu Buttons
    const btnNewGame = document.getElementById('btn-new-game');
    if (btnNewGame) {
      btnNewGame.onclick = (e) => {
        e.preventDefault();
        console.log('Antigravity: [NEW GAME] clicked');
        this.game.startNewGame(false);
      };
    }

    const btnNightmare = document.getElementById('btn-nightmare');
    if (btnNightmare) {
      btnNightmare.onclick = (e) => {
        e.preventDefault();
        console.log('Antigravity: [NIGHTMARE MODE] clicked');
        this.game.startNewGame(true);
      };
    }

    const btnContinue = document.getElementById('btn-continue');
    if (btnContinue) {
      btnContinue.onclick = (e) => {
        e.preventDefault();
        console.log('Antigravity: [CONTINUE] clicked');
        this.game.continueGame();
      };
    }

    const btnSettings = document.getElementById('btn-settings');
    if (btnSettings) {
      btnSettings.onclick = (e) => {
        e.preventDefault();
        console.log('Antigravity: [SETTINGS] clicked');
        this.showScreen('settings');
      };
    }

    const btnHowToPlay = document.getElementById('btn-how-to-play');
    if (btnHowToPlay) {
      btnHowToPlay.onclick = (e) => {
        e.preventDefault();
        console.log('Antigravity: [HOW TO PLAY] clicked');
        this.showScreen('howToPlay');
      };
    }

    const btnCloseSettings = document.getElementById('btn-close-settings');
    if (btnCloseSettings) {
      btnCloseSettings.onclick = (e) => {
        e.preventDefault();
        this.showScreen(this.game.isPlaying ? 'game' : 'menu');
      };
    }

    const btnCloseHelp = document.getElementById('btn-close-help');
    if (btnCloseHelp) {
      btnCloseHelp.onclick = (e) => {
        e.preventDefault();
        this.showScreen('menu');
      };
    }

    // 2. Pause Screen Buttons
    const btnResume = document.getElementById('btn-resume');
    if (btnResume) {
      btnResume.onclick = (e) => {
        e.preventDefault();
        this.game.resumeGame();
      };
    }

    const btnPauseMenu = document.getElementById('btn-pause-menu');
    if (btnPauseMenu) {
      btnPauseMenu.onclick = (e) => {
        e.preventDefault();
        this.game.returnToMenu();
      };
    }

    // 3. Game Over & Victory
    const btnRetry = document.getElementById('btn-retry');
    if (btnRetry) {
      btnRetry.onclick = (e) => {
        e.preventDefault();
        this.game.restartChapter();
      };
    }

    const btnGameOverMenu = document.getElementById('btn-game-over-menu');
    if (btnGameOverMenu) {
      btnGameOverMenu.onclick = (e) => {
        e.preventDefault();
        this.game.returnToMenu();
      };
    }

    const btnVictoryMenu = document.getElementById('btn-victory-menu');
    if (btnVictoryMenu) {
      btnVictoryMenu.onclick = (e) => {
        e.preventDefault();
        this.game.returnToMenu();
      };
    }

    // 4. Inventory Close
    const btnCloseInv = document.getElementById('btn-close-inventory');
    if (btnCloseInv) {
      btnCloseInv.onclick = (e) => {
        e.preventDefault();
        this.hideInventory();
      };
    }

    // 5. Ability Slot Clicks
    this.abilitySlots.forEach((slot, idx) => {
      if (slot) {
        slot.addEventListener('click', (e) => {
          e.stopPropagation();
          this.game.pumpkin.selectAbility(idx + 1);
          this.updateAbilitySelection(idx + 1);
        });
      }
    });

    // 6. Settings Controls
    const sensInput = document.getElementById('setting-sensitivity');
    if (sensInput) {
      sensInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.game.input.mouseSensitivity = 0.001 * val;
        this.game.input.touchSensitivity = 0.0015 * val;
      });
    }

    const volInput = document.getElementById('setting-volume');
    if (volInput) {
      volInput.addEventListener('input', (e) => {
        this.game.soundEngine.masterVolume = parseFloat(e.target.value);
      });
    }

    const debugToggle = document.getElementById('setting-debug');
    if (debugToggle) {
      debugToggle.addEventListener('change', (e) => {
        this.debugMode = e.target.checked;
        if (this.debugOverlay) {
          this.debugOverlay.style.display = this.debugMode ? 'block' : 'none';
        }
      });
    }

    // 7. Ending Choice Buttons
    document.getElementById('btn-end-purify')?.addEventListener('click', () => {
      this.showEndingResult('ENDING A: PURIFICATION', 'With the Restored Jack-o\'-Lantern ablaze in ancient light, Elias cries out as the werewolf form crumbles to ash. The owner\'s soul is finally at peace.');
    });

    document.getElementById('btn-end-escape')?.addEventListener('click', () => {
      this.showEndingResult('ENDING B: THE ESCAPE', 'You slam the pizzeria gates shut and sprint through the Halloween fog. Behind you, the howls of Elias echo into the night, eternal and alone.');
    });

    document.getElementById('btn-end-curse')?.addEventListener('click', () => {
      this.showEndingResult('ENDING C: THE NEW BEAST', 'You absorb the supernatural flame into your chest. Elias bows to his new master. The Pumpkin Crust Pizzeria claims its new beast.');
    });
  }

  showScreen(name) {
    console.log(`Antigravity: showScreen('${name}')`);

    for (const key in this.screens) {
      if (this.screens[key]) {
        this.screens[key].style.display = (key === name) ? 'flex' : 'none';
      }
    }

    if (name === 'game') {
      document.body.classList.add('in-game');
      if (this.screens.game) {
        this.screens.game.style.display = 'block';
      }
    } else {
      document.body.classList.remove('in-game');
    }
  }

  updateHUD(player, pumpkin, werewolf) {
    if (!this.game.isPlaying) return;

    // 1. Prompt Text
    if (this.promptEl) {
      if (player.interactTarget) {
        this.promptEl.style.display = 'block';
        this.promptEl.textContent = player.interactTarget.getPrompt ? player.interactTarget.getPrompt() : '[E] Interact';
      } else {
        this.promptEl.style.display = 'none';
      }
    }

    // 2. Pumpkin Energy Bar
    if (this.pumpkinBar && pumpkin) {
      const pct = (pumpkin.energy / pumpkin.maxEnergy) * 100;
      this.pumpkinBar.style.width = `${pct}%`;
    }

    // 3. Stamina Bar
    if (this.staminaBar && player) {
      const pct = (player.stamina / player.maxStamina) * 100;
      this.staminaBar.style.width = `${pct}%`;
    }

    // 4. Noise Indicator
    if (this.noiseBar && player) {
      const noise = player.currentNoise;
      const noisePct = Math.min(100, (noise / 90) * 100);
      this.noiseBar.style.width = `${noisePct}%`;
      if (noise >= 45) {
        this.noiseBar.style.background = '#ff2200';
      } else if (noise >= 15) {
        this.noiseBar.style.background = '#ff8800';
      } else {
        this.noiseBar.style.background = '#22cc55';
      }
    }

    // 5. Ability Selector Active State
    if (pumpkin) {
      this.updateAbilitySelection(pumpkin.activeAbility);
    }

    // 6. Debug Overlay
    if (this.debugMode && this.debugOverlay && werewolf) {
      const stat = werewolf.getDebugStatus(player);
      this.debugOverlay.innerHTML = `
        <strong>[DEBUG MODE: WEREWOLF AI]</strong><br>
        State: <span style="color:#ffaa00">${stat.state}</span><br>
        Speed: ${stat.speed} m/s<br>
        Can See Player: ${stat.canSeePlayer ? '<span style="color:#ff2222">YES</span>' : 'NO'}<br>
        Distance to Player: ${stat.distanceToPlayer} m<br>
        Waypoints Left: ${stat.pathRemaining}<br>
        Patrol Route Step: ${stat.patrolIndex}<br>
        Hiding Suspicions: ${JSON.stringify(werewolf.memory.hidingSpotSuspicion)}
      `;
    }
  }

  updateAbilitySelection(activeSlot) {
    this.abilitySlots.forEach((slot, idx) => {
      if (slot) {
        if (idx + 1 === activeSlot) {
          slot.classList.add('active-slot');
        } else {
          slot.classList.remove('active-slot');
        }
      }
    });
  }

  showChapterBanner(info) {
    if (!this.chapterBanner || !info) return;
    this.chapterBanner.innerHTML = `
      <div class="banner-title">${info.title}</div>
      <div class="banner-sub">${info.subtitle}</div>
    `;
    this.chapterBanner.style.display = 'block';
    this.chapterBanner.classList.add('banner-fade');

    setTimeout(() => {
      if (this.chapterBanner) {
        this.chapterBanner.style.display = 'none';
        this.chapterBanner.classList.remove('banner-fade');
      }
    }, 4500);
  }

  showToast(message) {
    if (!this.toastEl) return;
    this.toastEl.textContent = message;
    this.toastEl.style.display = 'block';
    setTimeout(() => {
      if (this.toastEl) this.toastEl.style.display = 'none';
    }, 3200);
  }

  showInventory(inventory) {
    const listEl = document.getElementById('inventory-grid');
    if (!listEl) return;

    listEl.innerHTML = '';
    const slots = 8;
    for (let i = 0; i < slots; i++) {
      const slotDiv = document.createElement('div');
      slotDiv.className = 'inv-slot';

      if (i < inventory.items.length) {
        const item = inventory.items[i];
        slotDiv.innerHTML = `<span class="inv-icon">${item.icon}</span><span class="inv-name">${item.name}</span>`;
        slotDiv.addEventListener('click', () => {
          this.inspectItem(item);
        });
      } else {
        slotDiv.classList.add('empty');
      }
      listEl.appendChild(slotDiv);
    }

    this.screens.inventory.style.display = 'flex';
  }

  hideInventory() {
    if (this.screens.inventory) {
      this.screens.inventory.style.display = 'none';
    }
  }

  inspectItem(item) {
    const inspectEl = document.getElementById('inventory-inspect');
    if (!inspectEl) return;
    inspectEl.innerHTML = `
      <div class="inspect-icon">${item.icon}</div>
      <h3>${item.name}</h3>
      <p class="inspect-desc">${item.description}</p>
      ${item.lore ? `<blockquote class="inspect-lore">${item.lore}</blockquote>` : ''}
    `;
  }

  // --- PUZZLE 1 MODAL (Safe Combination) ---
  openSafePuzzleModal(callback) {
    const modal = document.getElementById('screen-puzzle');
    if (!modal) return;
    const body = document.getElementById('puzzle-content');

    let digits = [0, 0, 0];

    const render = () => {
      body.innerHTML = `
        <h2>COMBINATION SAFE</h2>
        <p class="puzzle-hint">Align the 3 dials to the correct digits.</p>
        <div class="combination-dials">
          ${digits.map((d, idx) => `
            <div class="dial-column">
              <button class="dial-btn" data-col="${idx}" data-dir="1">▲</button>
              <div class="dial-val">${d}</div>
              <button class="dial-btn" data-col="${idx}" data-dir="-1">▼</button>
            </div>
          `).join('')}
        </div>
        <div class="puzzle-actions">
          <button id="btn-unlock-safe" class="primary-btn">UNLOCK</button>
          <button id="btn-cancel-puzzle" class="secondary-btn">CLOSE</button>
        </div>
        <div id="puzzle-feedback" class="puzzle-feedback"></div>
      `;

      body.querySelectorAll('.dial-btn').forEach(btn => {
        btn.onclick = () => {
          const col = parseInt(btn.dataset.col);
          const dir = parseInt(btn.dataset.dir);
          digits[col] = (digits[col] + dir + 10) % 10;
          render();
        };
      });

      document.getElementById('btn-unlock-safe').onclick = () => {
        const res = callback(digits);
        const fb = document.getElementById('puzzle-feedback');
        fb.textContent = res.message;
        if (res.success) {
          fb.style.color = '#55ff55';
          setTimeout(() => { modal.style.display = 'none'; }, 1600);
        } else {
          fb.style.color = '#ff5555';
        }
      };

      document.getElementById('btn-cancel-puzzle').onclick = () => {
        modal.style.display = 'none';
      };
    };

    render();
    modal.style.display = 'flex';
  }

  // --- PUZZLE 2 MODAL (Pizza Recipe) ---
  openPizzaPrepModal(inventory, callback) {
    const modal = document.getElementById('screen-puzzle');
    if (!modal) return;
    const body = document.getElementById('puzzle-content');

    const available = [];
    if (inventory.hasItem('item_dough')) available.push({ id: 'dough', name: 'Pizza Dough', icon: '🥟' });
    if (inventory.hasItem('item_sauce')) available.push({ id: 'sauce', name: 'Cursed Sauce', icon: '🥫' });
    if (inventory.hasItem('item_spice')) available.push({ id: 'spice', name: 'Halloween Spice', icon: '🧂' });

    let sequence = [];

    const render = () => {
      body.innerHTML = `
        <h2>PUMPKIN CRUST PREPARATION STATION</h2>
        <p class="puzzle-hint">Select the ingredients in the ancient ritual order:</p>
        <div class="recipe-tray">
          <h4>Selected Sequence:</h4>
          <div class="sequence-display">
            ${sequence.length === 0 ? '<em>(Empty tray)</em>' : sequence.map(s => `<span class="tray-item">${s}</span>`).join(' ➜ ')}
          </div>
        </div>
        <div class="ingredients-list">
          <h4>Available Ingredients:</h4>
          ${available.map(ing => `
            <button class="ingredient-btn" data-id="${ing.id}">
              ${ing.icon} ${ing.name}
            </button>
          `).join('')}
        </div>
        <div class="puzzle-actions">
          <button id="btn-bake" class="primary-btn">BAKE IN OVEN</button>
          <button id="btn-reset-recipe" class="secondary-btn">CLEAR</button>
          <button id="btn-cancel-puzzle" class="secondary-btn">CLOSE</button>
        </div>
        <div id="puzzle-feedback" class="puzzle-feedback"></div>
      `;

      body.querySelectorAll('.ingredient-btn').forEach(btn => {
        btn.onclick = () => {
          if (!sequence.includes(btn.dataset.id)) {
            sequence.push(btn.dataset.id);
            render();
          }
        };
      });

      document.getElementById('btn-reset-recipe').onclick = () => {
        sequence = [];
        render();
      };

      document.getElementById('btn-bake').onclick = () => {
        const res = callback(sequence);
        const fb = document.getElementById('puzzle-feedback');
        fb.textContent = res.message;
        if (res.success) {
          fb.style.color = '#55ff55';
          setTimeout(() => { modal.style.display = 'none'; }, 1800);
        } else {
          fb.style.color = '#ff5555';
        }
      };

      document.getElementById('btn-cancel-puzzle').onclick = () => {
        modal.style.display = 'none';
      };
    };

    render();
    modal.style.display = 'flex';
  }

  // --- PUZZLE 3 MODAL (Dining Seating Symbols) ---
  openDiningSymbolsModal(callback) {
    const modal = document.getElementById('screen-puzzle');
    if (!modal) return;
    const body = document.getElementById('puzzle-content');

    const symbols = ['★', 'Ψ', 'Ω', '▲'];
    let selectedOrder = [];

    const render = () => {
      body.innerHTML = `
        <h2>DINING ROOM SECRET COMPARTMENT</h2>
        <p class="puzzle-hint">Arrange the dining table runes in order of chair count (2, 3, 4, 5):</p>
        <div class="sequence-display">
          ${selectedOrder.length === 0 ? '<em>(Select runes)</em>' : selectedOrder.map(s => `<span class="rune-badge">${s}</span>`).join(' ')}
        </div>
        <div class="runes-grid">
          ${symbols.map(sym => `
            <button class="rune-select-btn" data-sym="${sym}">${sym}</button>
          `).join('')}
        </div>
        <div class="puzzle-actions">
          <button id="btn-submit-runes" class="primary-btn">ACTIVATE RUNES</button>
          <button id="btn-reset-runes" class="secondary-btn">CLEAR</button>
          <button id="btn-cancel-puzzle" class="secondary-btn">CLOSE</button>
        </div>
        <div id="puzzle-feedback" class="puzzle-feedback"></div>
      `;

      body.querySelectorAll('.rune-select-btn').forEach(btn => {
        btn.onclick = () => {
          if (!selectedOrder.includes(btn.dataset.sym)) {
            selectedOrder.push(btn.dataset.sym);
            render();
          }
        };
      });

      document.getElementById('btn-reset-runes').onclick = () => {
        selectedOrder = [];
        render();
      };

      document.getElementById('btn-submit-runes').onclick = () => {
        const res = callback(selectedOrder);
        const fb = document.getElementById('puzzle-feedback');
        fb.textContent = res.message;
        if (res.success) {
          fb.style.color = '#55ff55';
          setTimeout(() => { modal.style.display = 'none'; }, 1800);
        } else {
          fb.style.color = '#ff5555';
        }
      };

      document.getElementById('btn-cancel-puzzle').onclick = () => {
        modal.style.display = 'none';
      };
    };

    render();
    modal.style.display = 'flex';
  }

  // --- PUZZLE 4 MODAL (Security Breakers) ---
  openSecurityBreakerModal(callback) {
    const modal = document.getElementById('screen-puzzle');
    if (!modal) return;
    const body = document.getElementById('puzzle-content');

    let switches = [false, false, false, false];

    const render = () => {
      body.innerHTML = `
        <h2>SECURITY CCTV BREAKER PANEL</h2>
        <p class="puzzle-hint">Switch circuit breakers to restore monitor power without overload:</p>
        <div class="breaker-switches">
          ${switches.map((sw, idx) => `
            <div class="breaker-item">
              <span class="breaker-label">CIRCUIT ${idx + 1}</span>
              <button class="breaker-toggle-btn ${sw ? 'on' : 'off'}" data-idx="${idx}">
                ${sw ? 'ON' : 'OFF'}
              </button>
            </div>
          `).join('')}
        </div>
        <div class="puzzle-actions">
          <button id="btn-engage-breakers" class="primary-btn">ENGAGE POWER</button>
          <button id="btn-cancel-puzzle" class="secondary-btn">CLOSE</button>
        </div>
        <div id="puzzle-feedback" class="puzzle-feedback"></div>
      `;

      body.querySelectorAll('.breaker-toggle-btn').forEach(btn => {
        btn.onclick = () => {
          const idx = parseInt(btn.dataset.idx);
          switches[idx] = !switches[idx];
          render();
        };
      });

      document.getElementById('btn-engage-breakers').onclick = () => {
        const res = callback(switches);
        const fb = document.getElementById('puzzle-feedback');
        fb.textContent = res.message;
        if (res.success) {
          fb.style.color = '#55ff55';
          setTimeout(() => { modal.style.display = 'none'; }, 1800);
        } else {
          fb.style.color = '#ff5555';
        }
      };

      document.getElementById('btn-cancel-puzzle').onclick = () => {
        modal.style.display = 'none';
      };
    };

    render();
    modal.style.display = 'flex';
  }

  showEndingResult(title, description) {
    const resEl = document.getElementById('victory-narrative');
    if (resEl) {
      resEl.innerHTML = `
        <h2 style="color:#ff7700">${title}</h2>
        <p>${description}</p>
      `;
    }
    const choices = document.getElementById('ending-choices');
    if (choices) choices.style.display = 'none';
  }
}
