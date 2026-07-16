export class ItuberaBattleScene extends Phaser.Scene {
  constructor() {
    super('ItuberaBattleScene');
  }

  init(data) {
    this.regionName = data.regionName || 'itubera';
  }

  create() {
    this.cameras.main.setBackgroundColor('#8FAFB8');
    this.add.rectangle(480, 270, 960, 540, 0xC9C2B7);
    this.add.text(28, 20, 'Ituberá Vertical Slice', {
      fontFamily: 'Arial',
      fontSize: '26px',
      color: '#1A1A1A'
    });

    this.add.text(28, 58, 'Objetivos do slice: props costeiros, pânico civil, wanted militar, clima e boss inicial.', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#202020'
    });

    this.add.rectangle(150, 390, 90, 40, 0x6D4C41).setStrokeStyle(2, 0x3B241D);
    this.add.text(108, 380, 'Barco', { fontFamily: 'Arial', fontSize: '18px', color: '#FFFFFF' });

    this.add.rectangle(320, 380, 100, 70, 0x6B7A8F).setStrokeStyle(2, 0x1D2430);
    this.add.text(276, 365, 'Blindado', { fontFamily: 'Arial', fontSize: '18px', color: '#FFFFFF' });

    this.add.rectangle(720, 210, 120, 120, 0xA68F77).setStrokeStyle(3, 0x3A2B1F);
    this.add.text(655, 195, 'Mercado / Igreja / Cais', { fontFamily: 'Arial', fontSize: '16px', color: '#111111' });

    this.add.text(42, 470, 'Integrar aqui: NPCDirectorSystem, WeatherAndTideSystem, MonsterLoadoutSystem e boss Capitao da Contencao.', {
      fontFamily: 'Arial', fontSize: '14px', color: '#111111', wordWrap: { width: 860 }
    });
  }
}
