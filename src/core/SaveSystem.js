export class SaveSystem {
  static SAVE_KEY = 'the_last_slice_save_v1';
  static ACHIEVEMENTS_KEY = 'the_last_slice_achievements_v1';

  static saveGame(gameData) {
    try {
      localStorage.setItem(this.SAVE_KEY, JSON.stringify({
        timestamp: Date.now(),
        chapter: gameData.chapter || 1,
        items: gameData.items || [],
        puzzles: gameData.puzzles || {},
        isNightmare: !!gameData.isNightmare
      }));
      return true;
    } catch (e) {
      console.warn('Could not save game to localStorage', e);
      return false;
    }
  }

  static loadGame() {
    try {
      const data = localStorage.getItem(this.SAVE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  static hasSave() {
    return !!localStorage.getItem(this.SAVE_KEY);
  }

  static clearSave() {
    try {
      localStorage.removeItem(this.SAVE_KEY);
    } catch (e) {}
  }

  static getAchievements() {
    try {
      const data = localStorage.getItem(this.ACHIEVEMENTS_KEY);
      return data ? JSON.parse(data) : {
        SILENT_SURVIVOR: false,
        PUMPKIN_HUNTER: false,
        MASTER_DETECTIVE: false,
        GHOST: false,
        NIGHTMARE_SURVIVOR: false
      };
    } catch (e) {
      return {};
    }
  }

  static unlockAchievement(id, onUnlockedCallback = null) {
    const list = this.getAchievements();
    if (!list[id]) {
      list[id] = true;
      try {
        localStorage.setItem(this.ACHIEVEMENTS_KEY, JSON.stringify(list));
      } catch (e) {}
      if (onUnlockedCallback) {
        onUnlockedCallback(id);
      }
    }
  }
}
