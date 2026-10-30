export class ChapterManager {
  constructor(game, inventory, puzzleManager) {
    this.game = game;
    this.inventory = inventory;
    this.puzzleManager = puzzleManager;

    this.currentChapter = 1;
    this.maxChapters = 6;

    this.chapterInfo = {
      1: {
        title: 'CHAPTER I: THE AWAKENING',
        subtitle: 'Escape the locked bedroom and find the first pumpkin fragment.',
        objectives: [
          'Read the diary beside the bed',
          'Find the Bedroom Key on the nightstand',
          'Unlock the bedroom door',
          'Collect Pumpkin Fragment I'
        ]
      },
      2: {
        title: 'CHAPTER II: THE HAUNTED KITCHEN',
        subtitle: 'Solve the office safe to unlock the kitchen and bake the cursed recipe.',
        objectives: [
          'Unlock the office safe (clue etched on wall)',
          'Collect the 3 ritual pizza ingredients',
          'Assemble the recipe on the kitchen prep station',
          'Collect Pumpkin Fragment II from the oven'
        ]
      },
      3: {
        title: 'CHAPTER III: THE SILENT DINING ROOM',
        subtitle: 'Use Ghost Vision to decode the dining tables and outsmart Elias\'s memory.',
        objectives: [
          'Inspect the 4 dining tables',
          'Use Ghost Vision to reveal the hidden table runes',
          'Submit the seating rune sequence',
          'Collect Pumpkin Fragment III and Security Keycard'
        ]
      },
      4: {
        title: 'CHAPTER IV: THE EYE OF THE BEAST',
        subtitle: 'Restore power to the CCTV security system and uncover Elias\'s past.',
        objectives: [
          'Unlock the Security Room',
          'Configure the electrical breaker switches',
          'Collect Pumpkin Fragment IV from the CCTV console'
        ]
      },
      5: {
        title: 'CHAPTER V: THE FORBIDDEN BASEMENT',
        subtitle: 'Descend to the subterranean ritual chamber and reconstruct the failed ritual.',
        objectives: [
          'Enter the basement ritual chamber',
          'Activate the ritual pentagram circle',
          'Assemble the Restored Jack-o\'-Lantern'
        ]
      },
      6: {
        title: 'CHAPTER VI: THE LAST HALLOWEEN',
        subtitle: 'Survive the Werewolf\'s final hunt and escape Pumpkin Crust.',
        objectives: [
          'Survive Elias\'s enraged hunt',
          'Reach the Pizzeria Main Exit',
          'Break the ancient pumpkin seal and choose your ending'
        ]
      }
    };

    this.initChapter1();
  }

  initChapter1() {
    this.currentChapter = 1;

    // Spawn Diary Page in Bedroom (Beside bed)
    this.game.spawnWorldItem({
      id: 'item_diary_1',
      name: 'Elias\'s Bedroom Diary',
      type: 'diary',
      icon: '📖',
      position: { x: -6.2, y: 0.85, z: -20.4 },
      description: 'A dust-covered leather journal. One page is dog-eared with urgent handwritten ink.',
      lore: '"October 31st... Collect the pumpkin fragments before midnight. Whatever happens, DO NOT MAKE A SOUND. The beast hears every step."'
    });

    // Spawn Bedroom Key in bedroom
    this.game.spawnWorldItem({
      id: 'key_bedroom',
      name: 'Brass Bedroom Key',
      type: 'key',
      icon: '🗝️',
      position: { x: -8.0, y: 0.65, z: -18.2 },
      description: 'A small brass key that unlocks the bedroom door.'
    });

    // Spawn Pumpkin Fragment I in Main Hallway north alcove
    this.game.spawnWorldItem({
      id: 'frag_1',
      name: 'Pumpkin Fragment I (Soul Shard)',
      type: 'fragment',
      icon: '🎃',
      position: { x: 0.0, y: 0.9, z: -17.0 },
      description: 'The first glowing piece of the ancient magical Jack-o\'-Lantern. Pulsates with warm orange light.'
    });

    // Spawn Soul Recharge Ember in Storage Room
    this.game.spawnWorldItem({
      id: 'soul_ember_1',
      name: 'Soul Ember Crystal',
      type: 'crystal',
      icon: '🔮',
      position: { x: -8.0, y: 0.85, z: -6.0 },
      description: 'A glowing spirit crystal. Restores 50 Pumpkin Energy when collected.'
    });

    // Spawn Pizza Ingredients for Chapter 2
    this.game.spawnWorldItem({
      id: 'item_dough',
      name: 'Fermented Pizza Dough',
      type: 'puzzle',
      icon: '🥟',
      position: { x: -11.0, y: 0.85, z: -7.5 },
      description: 'Cold dough kneaded with black yeast.'
    });

    this.game.spawnWorldItem({
      id: 'item_sauce',
      name: 'Cursed Pumpkin Sauce',
      type: 'puzzle',
      icon: '🥫',
      position: { x: 10.0, y: 0.9, z: -6.5 },
      description: 'Blood-red sauce infused with pumpkin flesh.'
    });

    this.game.spawnWorldItem({
      id: 'item_spice',
      name: 'Mystical Halloween Spice',
      type: 'puzzle',
      icon: '🧂',
      position: { x: 8.0, y: 0.95, z: -9.0 },
      description: 'A jar of aromatic occult seasonings.'
    });
  }

  checkProgression() {
    // Check transitions
    if (this.currentChapter === 1 && this.inventory.hasItem('frag_1')) {
      this.advanceChapter(2);
    } else if (this.currentChapter === 2 && this.inventory.hasItem('frag_2')) {
      this.advanceChapter(3);
    } else if (this.currentChapter === 3 && this.inventory.hasItem('frag_3')) {
      this.advanceChapter(4);
    } else if (this.currentChapter === 4 && this.inventory.hasItem('frag_4')) {
      this.advanceChapter(5);
    } else if (this.currentChapter === 5 && this.inventory.hasItem('pumpkin_full')) {
      this.advanceChapter(6);
    }
  }

  advanceChapter(newChapter) {
    if (newChapter > this.currentChapter && newChapter <= this.maxChapters) {
      this.currentChapter = newChapter;
      if (this.game.ui) {
        this.game.ui.showChapterBanner(this.chapterInfo[newChapter]);
      }
      // Werewolf aggression increases as midnight approaches!
      if (this.game.werewolf) {
        this.game.werewolf.patrolSpeed += 0.2;
        this.game.werewolf.chaseSpeed += 0.3;
      }
    }
  }

  getCurrentChapterInfo() {
    return this.chapterInfo[this.currentChapter] || this.chapterInfo[1];
  }
}

