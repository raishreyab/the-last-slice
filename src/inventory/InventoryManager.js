export class InventoryManager {
  constructor(maxSlots = 8, soundEngine = null) {
    this.maxSlots = maxSlots;
    this.soundEngine = soundEngine;
    this.items = []; // array of item objects
    this.selectedItemIndex = -1;

    // Callbacks for UI updates
    this.onInventoryChanged = null;
  }

  addItem(item) {
    if (this.items.length >= this.maxSlots) {
      return { success: false, message: 'Inventory is full!' };
    }

    this.items.push({
      id: item.id,
      name: item.name,
      type: item.type || 'item', // 'key', 'fragment', 'diary', 'puzzle', 'crystal'
      description: item.description || '',
      icon: item.icon || '📦',
      lore: item.lore || '',
      usable: !!item.usable
    });

    if (this.soundEngine) this.soundEngine.playPickup();
    if (this.onInventoryChanged) this.onInventoryChanged(this.items);

    return { success: true, message: `Picked up: ${item.name}` };
  }

  removeItem(id) {
    const idx = this.items.findIndex(it => it.id === id);
    if (idx !== -1) {
      const removed = this.items.splice(idx, 1)[0];
      if (this.onInventoryChanged) this.onInventoryChanged(this.items);
      return removed;
    }
    return null;
  }

  hasItem(id) {
    return this.items.some(it => it.id === id);
  }

  getItem(id) {
    return this.items.find(it => it.id === id) || null;
  }

  getItemName(id) {
    const it = this.getItem(id);
    return it ? it.name : 'Unknown Item';
  }

  getPumpkinFragmentCount() {
    return this.items.filter(it => it.id.startsWith('frag_')).length;
  }
}

