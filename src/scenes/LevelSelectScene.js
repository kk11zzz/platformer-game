import { LEVELS } from '../levels.js';

export default class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelSelectScene' });
    this.selectedLevelIndex = 0;
  }

  preload() {
    // 关卡选择页暂时不加载外部素材。
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#1f2937');

    this.add.text(width / 2, 72, 'Phaser 3 横板过关', {
      fontFamily: 'Arial',
      fontSize: '38px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(width / 2, 124, '选择关卡开始游戏', {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#d1d5db'
    }).setOrigin(0.5);

    this.add.text(width / 2, 160, '点击关卡后直接进入游戏，无需二次开始', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#9ca3af'
    }).setOrigin(0.5);

    this.selectedText = this.add.text(width / 2, 188, '键盘按 1 / 2 选择关卡，按 Enter / Space 开始', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#facc15'
    }).setOrigin(0.5);

    this.buttons = [];

    LEVELS.forEach((level, index) => {
      const y = 250 + index * 110;
      const button = this.add.rectangle(width / 2, y, 520, 70, 0x374151)
        .setStrokeStyle(3, 0x9ca3af)
        .setInteractive({ useHandCursor: true });

      const titleText = this.add.text(width / 2, y - 18, `第 ${index + 1} 关`, {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffffff'
      }).setOrigin(0.5);

      const nameText = this.add.text(width / 2, y + 17, level.name, {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#d1d5db'
      }).setOrigin(0.5);

      button.on('pointerdown', () => this.startLevel(index));
      button.on('pointerover', () => this.selectLevel(index));
      button.on('pointerout', () => this.selectLevel(this.selectedLevelIndex));

      this.buttons.push({ button, titleText, nameText, level });
    });

    this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.add.text(width / 2, height - 60, '提示：点击关卡后直接开始 | 游戏中按 R 重新开始当前关卡', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#9ca3af'
    }).setOrigin(0.5);

    this.selectLevel(0);
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.key1)) {
      this.selectLevel(0);
    }

    if (Phaser.Input.Keyboard.JustDown(this.key2)) {
      this.selectLevel(1);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyEnter) || Phaser.Input.Keyboard.JustDown(this.keySpace)) {
      this.startLevel(this.selectedLevelIndex);
    }
  }

  selectLevel(index) {
    if (index < 0 || index >= this.buttons.length) return;

    this.selectedLevelIndex = index;

    this.buttons.forEach((item, itemIndex) => {
      const active = itemIndex === index;
      item.button.setFillStyle(active ? 0x1d4ed8 : 0x374151);
      item.button.setStrokeStyle(3, active ? 0xfacc15 : 0x9ca3af);
      item.titleText.setColor(active ? '#facc15' : '#ffffff');
      item.nameText.setColor(active ? '#ffffff' : '#d1d5db');
    });

    if (this.selectedText) {
      this.selectedText.setText(`当前选择：第 ${index + 1} 关　按 Enter / Space 开始`);
    }
  }

  startLevel(index) {
    const level = this.buttons[index] && this.buttons[index].level;
    if (!level) return;

    this.scene.start('GameScene', { levelId: level.id, startImmediately: true });
  }
}
