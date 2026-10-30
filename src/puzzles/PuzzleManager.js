export class PuzzleManager {
  constructor(inventory, soundEngine = null) {
    this.inventory = inventory;
    this.soundEngine = soundEngine;

    // Puzzle states
    this.puzzle1Solved = false; // Safe combination
    this.puzzle2Solved = false; // Kitchen Pizza Recipe
    this.puzzle3Solved = false; // Dining Table Symbols
    this.puzzle4Solved = false; // CCTV Power Breakers
    this.puzzle5Solved = false; // Basement Altar

    // Callbacks to trigger chapter progress / rewards
    this.onPuzzleSolved = null;
  }

  // --- PUZZLE 1: 3-Digit Combination Safe ---
  // Target code is 4-8-2 (clue found on office wall with Ghost Vision)
  checkSafeCombination(digits) {
    const isCorrect = digits[0] === 4 && digits[1] === 8 && digits[2] === 2;
    if (isCorrect && !this.puzzle1Solved) {
      this.puzzle1Solved = true;
      if (this.soundEngine) this.soundEngine.playLockClick();

      // Reward: Kitchen Key!
      this.inventory.addItem({
        id: 'key_kitchen',
        name: 'Rusty Kitchen Key',
        type: 'key',
        icon: '🗝️',
        description: 'An old brass key labeled "PUMPKIN CRUST KITCHEN". Unlocks the kitchen door.'
      });

      if (this.onPuzzleSolved) this.onPuzzleSolved('puzzle1', 'Combination Safe Unlocked!');
      return { success: true, message: 'Click! The safe popped open! Obtained Kitchen Key!' };
    }
    return { success: false, message: 'Incorrect combination dials.' };
  }

  // --- PUZZLE 2: Kitchen Pizza Recipe Sequence ---
  // Required Sequence: 'dough' -> 'sauce' -> 'spice'
  submitPizzaRecipe(ingredients) {
    if (ingredients.length !== 3) {
      return { success: false, message: 'You need 3 ingredients to bake the ritual slice!' };
    }

    const isCorrect =
      ingredients[0] === 'dough' &&
      ingredients[1] === 'sauce' &&
      ingredients[2] === 'spice';

    if (isCorrect && !this.puzzle2Solved) {
      this.puzzle2Solved = true;
      if (this.soundEngine) this.soundEngine.playPickup();

      // Reward: Pumpkin Fragment 2!
      this.inventory.addItem({
        id: 'frag_2',
        name: 'Pumpkin Fragment II (Fire Heart)',
        type: 'fragment',
        icon: '🎃',
        description: 'The second shard of the ancient Jack-o\'-Lantern. Warm with supernatural heat.'
      });

      if (this.onPuzzleSolved) this.onPuzzleSolved('puzzle2', 'Pizza Recipe Complete! Oven Unlocked!');
      return { success: true, message: 'The oven roared with magical flame! Pumpkin Fragment II revealed!' };
    }

    return { success: false, message: 'Wrong ingredient order! The cursed dough turned to ash.' };
  }

  // --- PUZZLE 3: Dining Table Symbol Seating Order ---
  // Order according to chair count ascending (2, 3, 4, 5 chairs):
  // Table 3 (2 chairs) = '★'
  // Table 1 (3 chairs) = 'Ψ'
  // Table 2 (4 chairs) = 'Ω'
  // Table 4 (5 chairs) = '▲'
  submitDiningSymbolSequence(symbols) {
    const target = ['★', 'Ψ', 'Ω', '▲'];
    const isCorrect = symbols.length === 4 && symbols.every((s, i) => s === target[i]);

    if (isCorrect && !this.puzzle3Solved) {
      this.puzzle3Solved = true;
      if (this.soundEngine) this.soundEngine.playLockClick();

      // Reward: Pumpkin Fragment 3!
      this.inventory.addItem({
        id: 'frag_3',
        name: 'Pumpkin Fragment III (Spectral Core)',
        type: 'fragment',
        icon: '🎃',
        description: 'The third shard of the ancient Jack-o\'-Lantern. Glows with ethereal purple radiance.'
      });

      // Also Security Keycard
      this.inventory.addItem({
        id: 'key_security',
        name: 'Security Room Keycard',
        type: 'key',
        icon: '💳',
        description: 'Owner Elias\'s master security keycard. Unlocks the CCTV Security office.'
      });

      if (this.onPuzzleSolved) this.onPuzzleSolved('puzzle3', 'Secret Dining Compartment Opened!');
      return { success: true, message: 'A hidden wall panel slid open! Found Pumpkin Fragment III & Security Keycard!' };
    }

    return { success: false, message: 'The runes hum discordant notes. Sequence rejected.' };
  }

  // --- PUZZLE 4: Security CCTV Power Switches ---
  // Breakers 1, 3, 4 active
  toggleSecurityBreakers(switches) {
    const isCorrect = switches[0] === true && switches[1] === false && switches[2] === true && switches[3] === true;

    if (isCorrect && !this.puzzle4Solved) {
      this.puzzle4Solved = true;
      if (this.soundEngine) this.soundEngine.playPickup();

      this.inventory.addItem({
        id: 'frag_4',
        name: 'Pumpkin Fragment IV (Beast\'s Eye)',
        type: 'fragment',
        icon: '🎃',
        description: 'The fourth pumpkin shard. Shows flickering visions of Elias\'s final humanity.'
      });

      if (this.onPuzzleSolved) this.onPuzzleSolved('puzzle4', 'Security Cameras Powered!');
      return { success: true, message: 'Power restored! CCTV monitors burst to life, ejecting Fragment IV!' };
    }

    return { success: false, message: 'Circuit breaker tripped! Breaker configuration incorrect.' };
  }

  // --- PUZZLE 5: Basement Ritual Altar ---
  submitBasementRitual() {
    if (!this.puzzle5Solved) {
      this.puzzle5Solved = true;
      if (this.soundEngine) this.soundEngine.playPumpkinBurst();

      this.inventory.addItem({
        id: 'frag_5',
        name: 'Pumpkin Fragment V (Eternal Crown)',
        type: 'fragment',
        icon: '🎃',
        description: 'The final pumpkin fragment. Elias\'s lost memories resonate from within.'
      });

      this.inventory.addItem({
        id: 'pumpkin_full',
        name: 'Restored Jack-o\'-Lantern',
        type: 'key',
        icon: '🎃',
        description: 'All 5 fragments have merged! Emits an overwhelming divine glow capable of breaking the main exit seal!'
      });

      if (this.onPuzzleSolved) this.onPuzzleSolved('puzzle5', 'The Ancient Curse is Broken!');
      return { success: true, message: 'The ritual altar ignited! The Restored Jack-o\'-Lantern is complete! Escape the pizzeria!' };
    }
    return { success: false, message: 'Ritual requirements not met.' };
  }
}

