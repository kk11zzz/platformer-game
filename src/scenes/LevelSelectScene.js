import { LEVELS } from '../levels.js';

export default class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  preload() {
    // 关卡选择页暂时不加载外部素材。
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#1f2937');

    this.add.text(width / 2, 80, 'Phaser 3 横板过关', {
      fontFamily: 'Arial',
      fontSize: '38px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(width / 2, 130, '选择关卡开始游戏', {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#d1d5db'
    }).setOrigin(0.5);

    LEVELS.forEach((level, index) => {
      const button = this.add.rectangle(width / 2, 220 + index * 110, 520, 70, 0x374151)
        .setStrokeStyle(3, 0x9ca3af)
        .setInteractive({ useHandCursor: true });

      this.add.text(width / 2, 205 + index * 110, `第 ${index + 1} 关`, {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffffff'
      }).setOrigin(0.5);

      this.add.text(width / 2, 240 + index * 110, level.name, {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#d1d5db'
      }).setOrigin(0.5);

      button.on('pointerdown', () => {
        this.scene.start('GameScene', { levelId: level.id });
      });
    });

    this.add.text(width / 2, height - 60, '提示：游戏中按 R 重新开始当前关卡', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#9ca3af'
    }).setOrigin(0.5);
  }
}
