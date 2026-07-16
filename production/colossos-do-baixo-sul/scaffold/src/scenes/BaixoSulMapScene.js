export class BaixoSulMapScene extends Phaser.Scene {
  constructor() {
    super('BaixoSulMapScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#0B1620');
    this.add.text(40, 32, 'Colossos do Baixo Sul — World Map', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#F2F2F2'
    });

    const regions = [
      'Ituberá',
      'Pancada Grande',
      'Itacaré',
      'Baía de Camamu',
      'Ilha do Timbuca',
      'Morro de São Paulo',
      'Valença',
      'Salvador'
    ];

    regions.forEach((name, index) => {
      const y = 96 + index * 44;
      const item = this.add.text(64, y, `> ${name}`, {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#B7D7FF'
      }).setInteractive({ useHandCursor: true });

      item.on('pointerdown', () => {
        this.scene.start('ItuberaBattleScene', { regionName: name.toLowerCase() });
      });
    });
  }
}
