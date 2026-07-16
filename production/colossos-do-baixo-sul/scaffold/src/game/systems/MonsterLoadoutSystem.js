export class MonsterLoadoutSystem {
  constructor() {
    this.slots = {
      head: null,
      torso: null,
      arms: null,
      legs: null,
      dorsal: null,
      tail: null,
      core: null
    };

    this.weaponCategories = [
      'biological',
      'atl',
      'military_hybrid',
      'environmental'
    ];
  }

  equip(slot, partId) {
    if (!(slot in this.slots)) return false;
    this.slots[slot] = partId;
    return true;
  }

  getBuildProfile() {
    return {
      slots: this.slots,
      features: {
        canUsePropsAsWeapons: true,
        canConsumeHumansForHp: true,
        canConsumeTroopsForAtl: true
      }
    };
  }
}
