import * as THREE from 'three';
import { Engine } from './core/Engine.js';
import { InputManager } from './core/InputManager.js';
import { Player } from './player/Player.js';
import { WorldBuilder } from './world/WorldBuilder.js';
import { NavigationGraph } from './ai/NavigationGraph.js';
import { WerewolfAI } from './ai/WerewolfAI.js';
import { JackOLantern } from './pumpkin/JackOLantern.js';
import { InventoryManager } from './inventory/InventoryManager.js';
import { PuzzleManager } from './puzzles/PuzzleManager.js';
import { ChapterManager } from './chapters/ChapterManager.js';
import { SoundEngine } from './audio/SoundEngine.js';
import { UIManager } from './ui/UIManager.js';
import { SaveSystem } from './core/SaveSystem.js';
import { CinematicIntro } from './ui/CinematicIntro.js';
import { WebsiteManager } from './ui/WebsiteManager.js';

class Game {
  constructor() {
    console.log('Antigravity: Initializing The Last Slice Engine & Systems...');
    this.container = document.getElementById('canvas-container');

    // 0. World Items list MUST be initialized first before anything spawns items!
    this.worldItems = [];

    // Game State flags
    this.isPlaying = false;
    this.isPaused = false;
    this.isNightmare = false;

    // 1. Core Engine & Audio
    this.engine = new Engine(this.container);
    this.soundEngine = new SoundEngine();
    this.input = new InputManager(this.engine.renderer.domElement);

    // 2. World Environment & Procedural 9-Room Map
    this.world = new WorldBuilder(this.engine.scene, this.engine);
    this.world.buildAll();

    // 3. First-Person Player Controller
    this.player = new Player(this.engine.camera, this.input, this.soundEngine);
    this.player.colliders = this.world.colliders;

    // 4. AI Navigation & Werewolf (Elias)
    this.navGraph = new NavigationGraph();
    this.werewolf = new WerewolfAI(this.engine.scene, this.navGraph, {
      soundEngine: this.soundEngine
    });

    // 5. Sound Detection System (connects player & doors to Elias's hearing)
    this.soundDetector = {
      emitSound: (origin, intensity, soundType) => {
        if (this.werewolf) {
          this.werewolf.onSoundHeard(origin, intensity, soundType);
        }
      }
    };

    // 6. Magical Jack-o'-Lantern System
    this.pumpkin = new JackOLantern(this.engine.camera, this.engine.scene, this.soundEngine);

    // 7. Inventory & Puzzles
    this.inventory = new InventoryManager(8, this.soundEngine);
    this.puzzles = new PuzzleManager(this.inventory, this.soundEngine);

    // 8. UI Interface Manager
    this.ui = new UIManager(this);

    // 9. Chapter Manager & Story Progression
    this.chapterManager = new ChapterManager(this, this.inventory, this.puzzles);

    // 10. Cinematic Introduction & Public Website Managers
    this.intro = new CinematicIntro({
      soundEngine: this.soundEngine,
      onEnterGame: () => {
        this.website.openGameView();
        this.startNewGame(false);
      },
      onShowWebsite: () => {
        this.website.openWebsiteView();
      }
    });

    this.website = new WebsiteManager({
      soundEngine: this.soundEngine,
      onStartGame: () => {
        this.ui.showScreen('menu');
      },
      onPlayIntro: () => {
        this.intro.playIntro();
      }
    });

    // Wire puzzle callbacks
    this.puzzles.onPuzzleSolved = (puzzleId, msg) => {
      this.ui.showToast(msg);
      this.chapterManager.checkProgression();
      SaveSystem.saveGame({
        chapter: this.chapterManager.currentChapter,
        items: this.inventory.items,
        isNightmare: this.isNightmare
      });
    };

    console.log('Antigravity: Systems initialized successfully. Starting game render loop.');
    this.initGameLoop();

    // Auto-launch intro on first visit or show website if revisited
    const hasSeenIntro = sessionStorage.getItem('the_last_slice_intro_seen');
    if (!hasSeenIntro) {
      sessionStorage.setItem('the_last_slice_intro_seen', 'true');
      this.intro.playIntro();
    } else {
      this.website.openWebsiteView();
    }
  }

  startNewGame(nightmare = false) {
    console.log(`Antigravity: Starting New Game (Nightmare: ${nightmare})...`);
    this.isNightmare = nightmare;
    this.soundEngine.resume();

    // Ensure game view is visible
    this.website.openGameView();

    // Reset Inventory
    this.inventory.items = [];
    if (this.inventory.onInventoryChanged) {
      this.inventory.onInventoryChanged(this.inventory.items);
    }

    // Reset Puzzles
    this.puzzles.puzzle1Solved = false;
    this.puzzles.puzzle2Solved = false;
    this.puzzles.puzzle3Solved = false;
    this.puzzles.puzzle4Solved = false;
    this.puzzles.puzzle5Solved = false;

    // Reset doors to default locked/unlocked state
    for (const d of this.world.doors) {
      d.isOpen = false;
      d.targetAngle = 0;
      d.doorMesh.rotation.y = 0;
      d.collider.enabled = true;
      if (d.id === 'door_bedroom' || d.id === 'door_kitchen' || d.id === 'door_security' || d.id === 'door_main_exit') {
        d.isLocked = true;
      }
    }

    // Clear existing spawned world items
    for (const item of this.worldItems) {
      this.engine.scene.remove(item.group);
      const colIdx = this.world.colliders.findIndex(c => c.id === item.data.id);
      if (colIdx !== -1) {
        this.world.colliders.splice(colIdx, 1);
      }
    }
    this.worldItems = [];

    // Respawn Chapter 1 Items
    this.chapterManager.initChapter1();

    // Spawn player in Bedroom
    this.player.setPosition(-6.0, 0, -17.0);
    this.player.yaw = -Math.PI / 2;
    this.player.pitch = 0;
    this.player.stamina = 100;
    this.player.isHiding = false;
    this.player.currentHidingSpot = null;

    // Reset werewolf position in North Hallway
    this.werewolf.position.set(0, 0, 10);
    this.werewolf.mesh.position.set(0, 0, 10);
    this.werewolf.state = 'PATROLLING';
    this.werewolf.patrolIndex = 0;
    this.werewolf.currentPath = [];
    this.werewolf.lastKnownPlayerPos = null;
    this.werewolf.canSeePlayer = false;

    if (this.isNightmare) {
      this.werewolf.patrolSpeed = 2.4;
      this.werewolf.chaseSpeed = 6.4;
    } else {
      this.werewolf.patrolSpeed = 1.9;
      this.werewolf.chaseSpeed = 5.6;
    }

    this.isPlaying = true;
    this.isPaused = false;
    this.ui.showScreen('game');

    // Request pointer lock on desktop if supported
    try {
      if (!this.input.isMobile && this.engine.renderer.domElement.requestPointerLock) {
        this.engine.renderer.domElement.requestPointerLock();
      }
    } catch (e) {}

    // Show Chapter 1 Banner
    this.ui.showChapterBanner(this.chapterManager.getCurrentChapterInfo());
    this.ui.showToast('Tip: Use [E] or touch USE to pick up diary & keys.');
  }

  continueGame() {
    console.log('Antigravity: Continuing Saved Game...');
    const save = SaveSystem.loadGame();
    if (!save) {
      this.ui.showToast('No saved game found – Starting New Game');
      this.startNewGame(false);
      return;
    }

    this.website.openGameView();
    this.isNightmare = !!save.isNightmare;
    this.soundEngine.resume();
    this.inventory.items = save.items || [];
    if (this.inventory.onInventoryChanged) {
      this.inventory.onInventoryChanged(this.inventory.items);
    }
    this.chapterManager.advanceChapter(save.chapter || 1);

    this.player.setPosition(-6.0, 0, -17.0);
    this.player.yaw = -Math.PI / 2;
    this.player.pitch = 0;
    this.player.isHiding = false;
    this.player.currentHidingSpot = null;

    this.isPlaying = true;
    this.isPaused = false;
    this.ui.showScreen('game');

    try {
      if (!this.input.isMobile && this.engine.renderer.domElement.requestPointerLock) {
        this.engine.renderer.domElement.requestPointerLock();
      }
    } catch (e) {}

    this.ui.showChapterBanner(this.chapterManager.getCurrentChapterInfo());
  }

  resumeGame() {
    this.isPaused = false;
    this.ui.showScreen('game');

    try {
      if (!this.input.isMobile && this.engine.renderer.domElement.requestPointerLock) {
        this.engine.renderer.domElement.requestPointerLock();
      }
    } catch (e) {}
  }

  pauseGame() {
    this.isPaused = true;
    this.ui.showScreen('pause');
  }

  returnToMenu() {
    this.isPlaying = false;
    this.isPaused = false;
    this.ui.showScreen('menu');
  }

  restartChapter() {
    this.player.setPosition(-6.0, 0, -17.0);
    this.player.yaw = -Math.PI / 2;
    this.player.pitch = 0;
    this.player.isHiding = false;
    this.player.currentHidingSpot = null;

    this.werewolf.position.set(0, 0, 10);
    this.werewolf.mesh.position.set(0, 0, 10);
    this.werewolf.state = 'PATROLLING';
    this.werewolf.patrolIndex = 0;
    this.werewolf.currentPath = [];
    this.werewolf.lastKnownPlayerPos = null;
    this.werewolf.canSeePlayer = false;

    this.isPlaying = true;
    this.isPaused = false;
    this.ui.showScreen('game');

    try {
      if (!this.input.isMobile && this.engine.renderer.domElement.requestPointerLock) {
        this.engine.renderer.domElement.requestPointerLock();
      }
    } catch (e) {}
  }

  // Spawn interactable 3D item into the world
  spawnWorldItem(itemData) {
    const group = new THREE.Group();
    group.position.set(itemData.position.x, itemData.position.y, itemData.position.z);

    // Glowing item visual
    let geo;
    let mat;

    if (itemData.type === 'key') {
      geo = new THREE.TorusGeometry(0.08, 0.025, 8, 16);
      mat = new THREE.MeshStandardMaterial({ color: 0xffcc33, metalness: 0.9, roughness: 0.2 });
    } else if (itemData.type === 'fragment') {
      geo = new THREE.DodecahedronGeometry(0.14);
      mat = new THREE.MeshStandardMaterial({
        color: 0xff6600,
        emissive: 0xff4400,
        emissiveIntensity: 0.8
      });
      // Point light so fragments glow in the dark
      const fragLight = new THREE.PointLight(0xff6600, 1.5, 3.0);
      group.add(fragLight);
    } else if (itemData.type === 'diary') {
      geo = new THREE.BoxGeometry(0.24, 0.05, 0.32);
      mat = new THREE.MeshStandardMaterial({ color: 0x5a3320, roughness: 0.9 });
    } else {
      geo = new THREE.OctahedronGeometry(0.12);
      mat = new THREE.MeshStandardMaterial({ color: 0xcc44ff, emissive: 0x8822bb, emissiveIntensity: 0.6 });
    }

    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);

    group.userData.interactiveData = {
      type: 'world_item',
      itemData: itemData,
      meshGroup: group,
      getPrompt: () => `[E] Pick up ${itemData.name}`
    };

    this.engine.scene.add(group);
    this.worldItems.push({
      data: itemData,
      group: group,
      mesh: mesh,
      baseY: itemData.position.y
    });

    // Add to interactive colliders
    this.world.colliders.push({
      id: itemData.id,
      mesh: group,
      isInteractable: true,
      box: new THREE.Box3().setFromObject(group)
    });
  }

  removeWorldItem(itemId) {
    const idx = this.worldItems.findIndex(w => w.data.id === itemId);
    if (idx !== -1) {
      const item = this.worldItems[idx];
      this.engine.scene.remove(item.group);
      this.worldItems.splice(idx, 1);

      // Remove collider
      const colIdx = this.world.colliders.findIndex(c => c.id === itemId);
      if (colIdx !== -1) {
        this.world.colliders.splice(colIdx, 1);
      }
    }
  }

  handlePlayerInteraction() {
    const target = this.player.interactTarget;
    if (!target) return;

    if (target.type === 'world_item') {
      const res = this.inventory.addItem(target.itemData);
      if (res.success) {
        this.removeWorldItem(target.itemData.id);
        this.ui.showToast(res.message);
        this.chapterManager.checkProgression();
      } else {
        this.ui.showToast(res.message);
      }
    } else if (target.type === 'door') {
      const res = target.instance.interact(this.inventory, this.soundDetector, this.soundEngine);
      this.ui.showToast(res.message);
      if (target.instance.id === 'door_main_exit' && this.inventory.hasItem('pumpkin_full')) {
        // Final Escape! Show victory screen
        this.ui.showScreen('victory');
        this.isPlaying = false;
      }
    } else if (target.type === 'hiding_spot') {
      const res = target.instance.interact(this.player, this.soundEngine);
      this.ui.showToast(res.message);
    } else if (target.type === 'combination_safe') {
      this.ui.openSafePuzzleModal((digits) => {
        return this.puzzles.checkSafeCombination(digits);
      });
    } else if (target.type === 'pizza_prep_table') {
      this.ui.openPizzaPrepModal(this.inventory, (recipe) => {
        return this.puzzles.submitPizzaRecipe(recipe);
      });
    } else if (target.type === 'dining_table') {
      this.ui.openDiningSymbolsModal((symbols) => {
        return this.puzzles.submitDiningSymbolSequence(symbols);
      });
    } else if (target.type === 'cctv_console') {
      this.ui.openSecurityBreakerModal((switches) => {
        return this.puzzles.toggleSecurityBreakers(switches);
      });
    } else if (target.type === 'ritual_altar') {
      const res = this.puzzles.submitBasementRitual();
      this.ui.showToast(res.message);
      if (res.success) {
        this.chapterManager.checkProgression();
      }
    }
  }

  onPlayerCaught() {
    this.isPlaying = false;
    if (this.soundEngine) {
      this.soundEngine.playJumpscare();
    }
    // Snap camera towards Elias's face for jumpscare
    const toBeast = new THREE.Vector3().subVectors(this.werewolf.position, this.player.position);
    this.player.yaw = Math.atan2(-toBeast.x, -toBeast.z);
    this.player.pitch = 0.2;

    setTimeout(() => {
      this.ui.showScreen('gameOver');
    }, 900);
  }

  initGameLoop() {
    const animate = () => {
      requestAnimationFrame(animate);

      const delta = Math.min(this.engine.clock.getDelta(), 0.1);

      if (this.isPlaying && !this.isPaused) {
        // 1. Process Input actions
        if (this.input.pausePressed) {
          this.pauseGame();
          this.input.pausePressed = false;
        }

        if (this.input.inventoryPressed) {
          if (this.ui.screens.inventory.style.display === 'flex') {
            this.ui.hideInventory();
          } else {
            this.ui.showInventory(this.inventory);
          }
          this.input.inventoryPressed = false;
        }

        if (this.input.interactPressed) {
          this.handlePlayerInteraction();
          this.input.interactPressed = false;
        }

        if (this.input.pumpkinPressed) {
          const fragments = this.worldItems
            .filter(w => w.data.type === 'fragment')
            .map(w => ({ position: w.group.position }));

          this.pumpkin.activateCurrentAbility(
            this.werewolf,
            this.soundDetector,
            this.world,
            fragments
          );
          this.input.pumpkinPressed = false;
        }

        if (this.input.abilitySlot) {
          this.pumpkin.selectAbility(this.input.abilitySlot);
        }

        // 2. Update Systems
        this.player.update(delta, this.soundDetector);
        this.werewolf.update(
          delta,
          this.player,
          this.world.colliders,
          this.world.hidingSpots,
          () => this.onPlayerCaught()
        );
        this.pumpkin.update(delta, this.world);
        this.world.update(delta);
        this.engine.update(delta);

        // 3. Floating animation for collectible items
        const time = performance.now() * 0.003;
        for (const item of this.worldItems) {
          item.group.position.y = item.baseY + Math.sin(time + item.baseY) * 0.08;
          item.mesh.rotation.y += delta * 1.5;
        }

        // 4. Update HUD
        this.ui.updateHUD(this.player, this.pumpkin, this.werewolf);
      }

      // Render 3D Scene always
      this.engine.render();
    };

    animate();
  }
}

// Bootstrap game when DOM is ready or immediately if already loaded
function bootstrapGame() {
  if (!window.game) {
    console.log('Antigravity: Bootstrapping The Last Slice Website & Game...');
    window.game = new Game();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapGame);
} else {
  bootstrapGame();
}
