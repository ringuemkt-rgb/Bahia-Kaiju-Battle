export class NPCDirectorSystem {
  constructor() {
    this.wantedLevel = 0;
    this.civilianState = 'routine';
    this.militaryState = 'patrol';
  }

  registerDestruction(amount = 1) {
    this.wantedLevel = Math.min(5, this.wantedLevel + amount);
    if (this.wantedLevel >= 2) this.civilianState = 'panic';
    if (this.wantedLevel >= 3) this.militaryState = 'engage';
    if (this.wantedLevel >= 4) this.militaryState = 'reinforce';
  }

  registerFeedingEvent() {
    this.wantedLevel = Math.min(5, this.wantedLevel + 2);
    this.civilianState = 'flee';
    this.militaryState = 'contain';
  }

  getSnapshot() {
    return {
      wantedLevel: this.wantedLevel,
      civilianState: this.civilianState,
      militaryState: this.militaryState
    };
  }
}
