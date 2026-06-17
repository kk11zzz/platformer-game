import { LEVELS } from '../levels.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });

    this.levelId = null;
    this.gameState = 'title';
  }

  preload() {
    // 当前版本仍使用程序生成的临时贴图，不依赖外部素材。
    // 后续可统一迁移到 PreloadScene 中加载 player、enemy、coin、goal 等图片。
  }

  create(data) {
    const { width, height } = this.scale;

    this.levelId = data && data.levelId ? data.levelId : this.levelId;
    const startImmediately = Boolean(data && data.startImmediately);

    // 1. 关卡配置
    // 第 10-11 步开始，关卡内容从 level1.js / level2.js 读取。
    // GameScene 只负责把数据转换成 Phaser 对象。
    const levelId = this.levelId || (LEVELS[0] && LEVELS[0].id);
    this.levelConfig = LEVELS.find((level) => level.id === levelId) || LEVELS[0];
    this.levelWidth = this.levelConfig.width;
    this.levelHeight = this.levelConfig.height;
    this.spawnPoint = { ...this.levelConfig.spawn };

    // 玩家重生次数
    this.respawnCount = 0;

    // 分数
    // 第 8 步新增：玩家收集金币后增加分数。
    this.score = 0;

    // 受伤短暂无敌时间，避免重生或撞怪后连续触发死亡。
    this.playerInvincibleUntil = 0;
    this.lastStompTime = 0;

    // 第 18 步：跳跃缓冲与土狼时间，让跳跃和踩怪判定更稳定。
    this.jumpBufferUntil = 0;
    this.coyoteUntil = 0;

    // 音效系统
    // 第 14 步新增：用 Web Audio API 生成简单合成音效，不依赖外部音频文件。
    this.audio = this.createSimpleAudio();

    // 第 16 步：游戏状态机
    // title：标题/开始提示
    // playing：正式游玩
    // gameOver：失败画面
    // levelClear：过关画面
    this.gameState = 'title';

    // 过关状态
    // 防止玩家到达终点后，update 里继续移动或重复触发过关。
    this.isLevelClear = false;

    // 2. 背景
    // 先使用纯色背景，后续替换成背景图或视差背景。
    this.cameras.main.setBackgroundColor('#87ceeb');

    // 3. 物理世界边界
    // 注意：这里 bottom 设置得比关卡高度更低。
    // 这样玩家掉进坑后不会立刻被世界底部挡住，而是可以继续下落并触发重生。
    this.physics.world.setBounds(0, 0, this.levelWidth, this.levelHeight + 300);

    // 4. 平台组
    // staticGroup 表示这些平台不会受物理重力影响，适合作为地面和固定平台。
    this.platforms = this.physics.add.staticGroup();

    // 5. 从关卡数据创建地面
    this.createGrounds();

    // 6. 从关卡数据创建坑的视觉提示
    this.createPits();

    // 7. 从关卡数据创建悬空平台
    this.createPlatforms();

    // 8. 创建玩家临时贴图
    // 暂时没有美术素材时，用 Phaser Graphics 生成一个黄色矩形作为玩家占位图。
    // 后续会替换成真正的 player.png 或精灵动画。
    this.createTemporaryTextures();

    // 9. 创建玩家 Sprite
    // this.physics.add.sprite 会自动给玩家创建 Arcade Physics body。
    this.player = this.physics.add.sprite(this.spawnPoint.x, this.spawnPoint.y, 'playerTemp');

    // 10. 创建敌人组
    // group 用来统一管理多个敌人，后续碰撞检测也会更方便。
    this.enemies = this.physics.add.group();

    // 11. 创建金币组
    // 使用 staticGroup，因为金币不需要移动，只需要被玩家收集。
    this.coins = this.physics.add.staticGroup();

    // 12. 从关卡数据创建金币、敌人、终点
    this.createCoins();
    this.createEnemies();
    this.createGoal();

    // 13. 玩家与金币重叠检测
    // overlap 用于“碰到就触发”，金币不需要把玩家弹开。
    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);

    // 14. 玩家与终点重叠检测
    // 玩家碰到终点后触发过关。
    this.physics.add.overlap(this.player, this.goal, this.reachGoal, null, this);

    // 15. 玩家与敌人碰撞
    // 使用 collider 而不是 overlap，确保 body.touching 状态可用于判断是否“踩怪”。
    this.physics.add.collider(this.player, this.enemies, this.handlePlayerEnemyCollision, null, this);

    // 16. 玩家物理参数
    // setCollideWorldBounds 只限制左右边界，不限制底部。
    // 这样玩家可以掉进坑里并触发重生。
    // setBounce 给一点轻微反弹，避免落地时完全僵硬。
    // setSize/Offset 用来让碰撞体比贴图略小，手感更自然。
    this.player.setCollideWorldBounds(true, true, true, false, false);
    this.player.setBounce(0.05);
    this.player.setSize(28, 44);
    this.player.setOffset(2, 2);

    // 17. 玩家与平台碰撞
    // 这一步完成后，玩家会受重力下落，并站在地面或平台上。
    this.physics.add.collider(this.player, this.platforms);

    // 18. 敌人与平台碰撞
    // 敌人会受重力影响，并站在平台上。
    this.physics.add.collider(this.enemies, this.platforms);

    // 19. 键盘输入
    // createCursorKeys 提供上下左右和空格键。
    // addKey 额外创建 A/D 和 W，方便习惯 WASD 的玩家。
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    // 20. 移动参数
    // 这里先使用固定速度，后续可以改成加速度/摩擦力，让手感更细腻。
    this.playerSpeed = 220;
    this.jumpPower = 520;
    this.enemySpeed = 70;

    // 21. 摄像机跟随
    // 关卡宽度大于屏幕宽度后，需要摄像机跟随玩家移动。
    // setBounds 限制摄像机不要显示关卡外区域。
    // startFollow 让主摄像机跟随玩家。
    this.cameras.main.setBounds(0, 0, this.levelWidth, this.levelHeight);
    this.cameras.main.startFollow(this.player, true, 0.14, 0.14);
    this.cameras.main.setLerp(0.14, 0.14);

    // 22. UI 文本
    this.respawnText = this.add.text(width - 24, 20, '掉坑次数：0', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(1, 0);

    this.scoreText = this.add.text(24, 82, `分数：${this.score}`, {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    });

    this.statusText = this.add.text(24, 52, '状态：title', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#fff7ad',
      stroke: '#000000',
      strokeThickness: 4
    });

    this.clearText = this.add.text(width / 2, height / 2, '', {
      fontFamily: 'Arial',
      fontSize: '36px',
      color: '#ffffff',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setVisible(false);

    this.add.text(24, 20, `Phaser 3 横板过关\n${this.levelConfig.name}`, {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    });

    this.hintText = this.add.text(24, height - 44, '按 Enter / Space / 点击屏幕开始 | 第一关过关后进入第二关 | 最后一关过关后回到选择 | 按 R 重开', {
      fontFamily: 'Arial',
      fontSize: '15px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    });

    this.overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.68)
      .setDepth(1000)
      .setVisible(false);

    this.overlayText = this.add.text(width / 2, height / 2, '', {
      fontFamily: 'Arial',
      fontSize: '34px',
      color: '#ffffff',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(1001).setVisible(false);

    // 23. 监听 R 键重新开始关卡，playing 状态下使用。
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    // 24. 首次用户输入后启用音效，绕过浏览器自动播放限制。
    this.input.once('pointerdown', () => this.audio.unlock());
    this.input.keyboard.once('keydown', () => this.audio.unlock());

    this.showTitle();

    if (startImmediately) {
      this.time.delayedCall(180, () => {
        if (this.gameState === 'title') {
          this.startPlaying();
        }
      });
    }
  }

  createTemporaryTextures() {
    const playerGraphics = this.add.graphics();
    playerGraphics.fillStyle(0xffd34e, 1);
    playerGraphics.fillRect(0, 0, 32, 48);
    playerGraphics.generateTexture('playerTemp', 32, 48);
    playerGraphics.destroy();

    const enemyGraphics = this.add.graphics();
    enemyGraphics.fillStyle(0xe74c3c, 1);
    enemyGraphics.fillRect(0, 0, 32, 32);
    enemyGraphics.generateTexture('enemyTemp', 32, 32);
    enemyGraphics.destroy();

    const coinGraphics = this.add.graphics();
    coinGraphics.fillStyle(0xffd700, 1);
    coinGraphics.fillCircle(12, 12, 10);
    coinGraphics.lineStyle(2, 0xffa500, 1);
    coinGraphics.strokeCircle(12, 12, 10);
    coinGraphics.generateTexture('coinTemp', 24, 24);
    coinGraphics.destroy();

    const goalGraphics = this.add.graphics();
    goalGraphics.fillStyle(0x2ecc71, 1);
    goalGraphics.fillRect(0, 0, 50, 130);
    goalGraphics.lineStyle(4, 0xffffff, 1);
    goalGraphics.strokeRect(0, 0, 50, 130);
    goalGraphics.generateTexture('goalTemp', 50, 130);
    goalGraphics.destroy();
  }

  createGrounds() {
    for (const ground of this.levelConfig.grounds) {
      const body = this.add.rectangle(ground.x, ground.y, ground.width, ground.height, ground.color).setOrigin(0, 0);
      this.physics.add.existing(body, true);
      this.platforms.add(body);
    }
  }

  createPits() {
    for (const pit of this.levelConfig.pits) {
      this.add.rectangle(pit.x, pit.y, pit.width, pit.height, pit.color).setOrigin(0, 0);
    }
  }

  createPlatforms() {
    for (const platform of this.levelConfig.platforms) {
      const body = this.add.rectangle(platform.x, platform.y, platform.width, platform.height, platform.color).setOrigin(0, 0);
      this.physics.add.existing(body, true);
      this.platforms.add(body);
    }
  }

  createCoins() {
    for (const coinData of this.levelConfig.coins) {
      this.addCoin(coinData.x, coinData.y);
    }
  }

  createEnemies() {
    for (const enemyData of this.levelConfig.enemies) {
      this.addEnemy(enemyData);
    }
  }

  createGoal() {
    const goal = this.levelConfig.goal;

    this.goal = this.physics.add.sprite(goal.x, goal.y, 'goalTemp');
    this.goal.setImmovable(true);
    this.goal.body.allowGravity = false;
    this.goal.body.setAllowGravity(false);
  }

  update() {
    // 1. 防止 update 在玩家还没创建前运行
    if (!this.player) return;

    // 2. 标题状态：等待玩家开始
    if (this.gameState === 'title') {
      if (Phaser.Input.Keyboard.JustDown(this.keyEnter) || Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
        this.startPlaying();
      }
      return;
    }

    // 3. 非游玩状态：停止处理移动和碰撞反馈
    if (this.gameState === 'gameOver' || this.gameState === 'levelClear') {
      return;
    }

    // 4. 受伤短暂无敌期间，让玩家可以闪烁提示。
    if (this.time.now < this.playerInvincibleUntil) {
      this.player.alpha = this.time.now % 160 < 80 ? 0.45 : 1;
    } else {
      this.player.alpha = 1;
    }

    // 5. 如果已经过关，只显示提示，不再处理移动和碰撞。
    if (this.isLevelClear) {
      if (this.keyR.isDown) {
        this.scene.restart({ levelId: this.levelConfig.id });
      }
      return;
    }

    // 6. 掉落重生判定
    // 如果玩家 y 坐标低于关卡底部一段距离，说明已经掉进坑里。
    // 这里不直接限制底部世界边界，是为了让“掉坑”可以正常发生。
    if (this.player.y > this.levelHeight + 120) {
      this.respawnPlayer();
    }

    // 7. 敌人巡逻
    // 每个敌人根据自己的 patrolLeft 和 patrolRight 来回移动。
    if (this.enemies) {
      this.enemies.children.iterate((enemy) => {
        if (!enemy) return;

        if (enemy.x <= enemy.patrolLeft) {
          enemy.setVelocityX(enemy.speed || this.enemySpeed);
        }

        if (enemy.x >= enemy.patrolRight) {
          enemy.setVelocityX(-(enemy.speed || this.enemySpeed));
        }
      });
    }

    // 8. 左右移动
    // 按住右键或 D：向右移动。
    // 按住左键或 A：向左移动。
    // 两者都不按：水平速度归零。
    if (this.cursors.right.isDown || this.keyD.isDown) {
      this.player.setVelocityX(this.playerSpeed);
    } else if (this.cursors.left.isDown || this.keyA.isDown) {
      this.player.setVelocityX(-this.playerSpeed);
    } else {
      this.player.setVelocityX(0);
    }

    // 9. 跳跃
    // 第 18 步优化：加入跳跃缓冲和土狼时间，降低误操作。
    // - 跳跃缓冲：落地前短暂按下跳跃，落地后会自动起跳。
    // - 土狼时间：刚离开平台边缘的极短时间内仍可跳跃。
    const now = this.time.now;
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keyW) || Phaser.Input.Keyboard.JustDown(this.cursors.space);

    if (jumpPressed) {
      this.jumpBufferUntil = now + 100;
    }

    if (this.player.body.touching.down || this.player.body.blocked.down) {
      this.coyoteUntil = now + 90;
    }

    if (this.jumpBufferUntil > now && (this.player.body.touching.down || this.player.body.blocked.down || this.coyoteUntil > now)) {
      this.player.setVelocityY(-this.jumpPower);
      this.jumpBufferUntil = 0;
      this.coyoteUntil = 0;
    }

    // 10. R 键重开
    if (Phaser.Input.Keyboard.JustDown(this.keyR)) {
      this.scene.restart({ levelId: this.levelConfig.id });
    }
  }

  showTitle() {
    this.gameState = 'title';
    this.isLevelClear = false;
    this.statusText.setText('状态：title');
    this.clearText.setVisible(false);

    this.player.setVisible(false);
    this.player.setActive(false);
    if (this.player.body) {
      this.player.body.enable = false;
    }

    this.hintText.setText('按 Enter / Space / 点击屏幕开始 | 第一关过关后进入第二关 | 最后一关过关后回到选择 | 按 R 重开');

    this.overlay.setPosition(this.scale.width / 2, this.scale.height / 2);
    this.overlay.setSize(this.scale.width, this.scale.height);
    this.overlay.setFillStyle(0x000000, 0.68);
    this.overlay.setVisible(true);

    this.overlayText.setText(`Phaser 3 横板过关\n${this.levelConfig.name}\n\n按 Enter / Space / 点击屏幕开始\n← → 或 A D 移动　↑ W Space 跳跃`);
    this.overlayText.setVisible(true);

    this.input.keyboard.on('keydown-ENTER', this.startPlaying, this);
    this.input.keyboard.on('keydown-SPACE', this.startPlaying, this);
    this.input.once('pointerdown', () => {
      this.audio.unlock();
      this.startPlaying();
    });
  }

  startPlaying() {
    if (this.gameState !== 'title') return;

    if (this.audio && typeof this.audio.unlock === 'function') {
      this.audio.unlock();
    }

    this.gameState = 'playing';
    this.isLevelClear = false;
    this.respawnCount = 0;
    this.score = 0;
    this.playerInvincibleUntil = 0;

    this.player.setPosition(this.spawnPoint.x, this.spawnPoint.y);
    this.player.setVelocity(0, 0);
    this.player.setAlpha(1);
    this.player.setVisible(true);
    this.player.setActive(true);

    if (this.player.body) {
      this.player.body.enable = true;
      this.player.body.setAllowGravity(true);
    }

    this.scoreText.setText(`分数：${this.score}`);
    this.respawnText.setText('掉坑次数：0');
    this.statusText.setText('状态：playing');
    this.clearText.setVisible(false);
    this.overlay.setVisible(false);
    this.overlayText.setVisible(false);
    this.hintText.setText('按 R 重玩当前关卡 | 红色矩形 = 怪兽 | 黄色圆形 = 金币 | 绿色矩形 = 终点');
  }

  addEnemy({ x, y, patrolLeft, patrolRight, speed }) {
    const enemy = this.physics.add.sprite(x, y, 'enemyTemp');

    enemy.patrolLeft = patrolLeft;
    enemy.patrolRight = patrolRight;
    enemy.speed = speed || this.enemySpeed;

    enemy.setBounce(0.02);
    enemy.setSize(28, 28);
    enemy.setOffset(2, 2);

    // 初始向右巡逻
    enemy.setVelocityX(enemy.speed);

    this.enemies.add(enemy);

    return enemy;
  }

  handlePlayerEnemyCollision(player, enemy) {
    if (!enemy.active || !player.active || this.gameState !== 'playing') return;

    // 受伤短暂无敌期间不再重复触发死亡。
    if (this.time.now < this.playerInvincibleUntil) return;

    if (this.time.now - this.lastStompTime < 120) return;

    const playerBottom = player.body.y + player.body.height;
    const enemyTop = enemy.body.y;
    const isStomp =
      player.body.touching.down &&
      player.body.velocity.y > 0 &&
      playerBottom - enemyTop < 24;

    if (isStomp) {
      this.stompEnemy(enemy);
    } else {
      this.showGameOver('被怪兽撞到了');
    }
  }

  addCoin(x, y) {
    const coin = this.coins.create(x, y, 'coinTemp');

    // 让金币保持静止，只作为重叠检测对象。
    coin.body.allowGravity = false;
    coin.body.setAllowGravity(false);

    return coin;
  }

  collectCoin(player, coin) {
    // 防止同一枚金币被重复收集。
    if (!coin.active || this.gameState !== 'playing') return;

    // 第 8 步核心：收集金币后加分并移除金币。
    this.score += 10;
    this.scoreText.setText(`分数：${this.score}`);

    // 第 13 步反馈：金币消失时显示 +10，并播放小型粒子反馈。
    this.createScorePopup(coin.x, coin.y - 12, '+10', '#ffd700');
    this.createBurst(coin.x, coin.y, 0xffd700, 10);

    // 第 14 步反馈：播放吃金币音效。
    this.audio.play('coin');

    // disableBody(true, true) 会让金币不可见，并从物理世界中移除。
    coin.disableBody(true, true);
  }

  respawnPlayer(reason = '掉进坑里') {
    if (this.gameState !== 'playing') return;

    // 回到出生点
    this.player.setPosition(this.spawnPoint.x, this.spawnPoint.y);

    // 清空速度，避免带着旧速度继续掉
    this.player.setVelocity(0, 0);

    // 受伤短暂无敌，避免重生点附近重复碰撞。
    this.playerInvincibleUntil = this.time.now + 1200;
    this.player.alpha = 1;

    // 记录掉坑/被撞次数
    this.respawnCount += 1;

    // 更新 UI
    this.respawnText.setText(`掉坑次数：${this.respawnCount}`);

    // 第 13 步反馈：死亡/重生时屏幕轻微闪红，并显示原因。
    this.cameras.main.flash(180, 255, 80, 80, false);

    // 第 14 步反馈：播放受伤音效。
    this.audio.play('hurt');
    this.createScorePopup(this.player.x, this.player.y - 42, reason, '#ff6b6b');
    this.createBurst(this.player.x, this.player.y, 0xff6b6b, 8);
  }

  stompEnemy(enemy) {
    if (this.gameState !== 'playing') return;

    this.lastStompTime = this.time.now;

    // 怪兽死亡：不可见，并从物理世界中移除。
    enemy.disableBody(true, true);

    // 玩家轻微弹起，增强“踩怪”手感。
    this.player.setVelocityY(-360);

    // 第 13 步反馈：踩怪时显示提示、爆炸粒子和轻微震屏。
    this.audio.play('stomp');
    this.createScorePopup(enemy.x, enemy.y - 18, '踩怪！', '#ffffff');
    this.createBurst(enemy.x, enemy.y, 0xe74c3c, 14);
    this.cameras.main.shake(120, 0.003);
  }

  reachGoal(player, goal) {
    // 防止重复触发过关。
    if (this.gameState !== 'playing' || this.isLevelClear) return;

    this.isLevelClear = true;
    this.gameState = 'levelClear';

    // 停止玩家运动。
    player.setVelocity(0, 0);
    player.body.setAllowGravity(false);

    // 第 13 步反馈：过关时闪烁、震屏、放粒子，并显示过关提示。
    this.audio.play('goal');
    this.cameras.main.flash(350, 255, 255, 255, false);
    this.cameras.main.shake(250, 0.004);
    this.createBurst(player.x, player.y, 0x2ecc71, 18);
    this.createBurst(player.x - 24, player.y - 20, 0xffd700, 12);
    this.createBurst(player.x + 24, player.y - 20, 0xffffff, 12);

    this.showLevelClear();
  }

  showGameOver(reason = '挑战失败') {
    if (this.gameState === 'gameOver') return;

    this.gameState = 'gameOver';
    this.statusText.setText('状态：gameOver');
    this.hintText.setText('按 Enter / Space / R 重新开始当前关卡 | 踩怪：从怪兽上方落下 | 死亡：碰到怪兽侧面或掉进坑');

    if (this.player && this.player.body) {
      this.player.setVelocity(0, 0);
      this.player.body.enable = false;
    }

    this.overlay.setPosition(this.scale.width / 2, this.scale.height / 2);
    this.overlay.setSize(this.scale.width, this.scale.height);
    this.overlay.setFillStyle(0x111827, 0.78);
    this.overlay.setVisible(true);

    this.overlayText.setText(`Game Over\n${reason}\n\n分数：${this.score}\n\n按 Enter / Space / R 重新开始`);
    this.overlayText.setVisible(true);

    this.input.keyboard.once('keydown-ENTER', () => this.restartLevel());
    this.input.keyboard.once('keydown-SPACE', () => this.restartLevel());
    this.input.keyboard.once('keydown-R', () => this.restartLevel());
  }

  showLevelClear() {
    const currentIndex = LEVELS.findIndex((level) => level.id === this.levelConfig.id);
    const hasNextLevel = currentIndex >= 0 && currentIndex < LEVELS.length - 1;
    const nextLevel = hasNextLevel ? LEVELS[currentIndex + 1] : null;

    this.gameState = 'levelClear';
    this.statusText.setText('状态：levelClear');
    this.hintText.setText(hasNextLevel ? '按 Enter / Space 进入下一关 | 按 R 重玩当前关卡 | 踩怪：从怪兽上方落下' : '按 Enter / Space 回到关卡选择 | 按 R 重玩当前关卡 | 踩怪：从怪兽上方落下');

    this.overlay.setPosition(this.scale.width / 2, this.scale.height / 2);
    this.overlay.setSize(this.scale.width, this.scale.height);
    this.overlay.setFillStyle(0x064e3b, 0.72);
    this.overlay.setVisible(true);

    const nextText = hasNextLevel
      ? `下一关：${nextLevel.name}`
      : '已通关全部关卡';

    this.overlayText.setText(`过关成功！\n${this.levelConfig.name}\n\n分数：${this.score}\n\n${nextText}\n\n按 Enter / Space ${hasNextLevel ? '进入下一关' : '回到关卡选择'}\n按 R 重玩当前关卡`);
    this.overlayText.setVisible(true);

    this.input.keyboard.once('keydown-ENTER', () => this.handleLevelClearAction());
    this.input.keyboard.once('keydown-SPACE', () => this.handleLevelClearAction());
    this.input.keyboard.once('keydown-R', () => this.restartLevel());
  }

  handleLevelClearAction() {
    const currentIndex = LEVELS.findIndex((level) => level.id === this.levelConfig.id);
    const hasNextLevel = currentIndex >= 0 && currentIndex < LEVELS.length - 1;

    if (hasNextLevel) {
      this.scene.start('GameScene', { levelId: LEVELS[currentIndex + 1].id });
      return;
    }

    this.scene.start('LevelSelectScene');
  }

  restartLevel() {
    this.scene.restart({ levelId: this.levelConfig.id });
  }

  createSimpleAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      return {
        unlocked: false,
        unlock() {},
        play() {}
      };
    }

    const audio = {
      ctx: null,
      unlocked: false,
      unlock() {
        if (!this.ctx) {
          this.ctx = new AudioContextClass();
        }

        if (this.ctx.state === 'suspended') {
          this.ctx.resume();
        }

        this.unlocked = true;
      },
      play(name) {
        if (!this.unlocked) return;

        if (name === 'coin') {
          this.tone(760, 0.08, 'triangle', 0.08);
          this.tone(1040, 0.1, 'triangle', 0.06, 0.08);
          return;
        }

        if (name === 'stomp') {
          this.tone(180, 0.09, 'square', 0.08);
          this.tone(90, 0.12, 'sawtooth', 0.05, 0.06);
          return;
        }

        if (name === 'hurt') {
          this.tone(160, 0.16, 'sawtooth', 0.08);
          this.tone(90, 0.22, 'sawtooth', 0.06, 0.12);
          return;
        }

        if (name === 'goal') {
          this.tone(523, 0.12, 'triangle', 0.07);
          this.tone(659, 0.12, 'triangle', 0.07, 0.12);
          this.tone(784, 0.22, 'triangle', 0.07, 0.24);
        }
      },
      tone(freq, duration, type = 'sine', volume = 0.08, delay = 0) {
        if (!this.ctx || !this.unlocked) return;

        const start = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + duration + 0.02);
      }
    };

    return audio;
  }

  createScorePopup(x, y, text, color) {
    const popup = this.add.text(x, y, text, {
      fontFamily: 'Arial',
      fontSize: '22px',
      color,
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.tweens.add({
      targets: popup,
      y: y - 42,
      alpha: 0,
      scale: 1.25,
      duration: 750,
      ease: 'Cubic.easeOut',
      onComplete: () => popup.destroy()
    });
  }

  createBurst(x, y, color, count = 12) {
    for (let i = 0; i < count; i += 1) {
      const dot = this.add.circle(x, y, Phaser.Math.Between(2, 4), color, 1);
      const angle = (Math.PI * 2 * i) / count + Phaser.Math.FloatBetween(-0.25, 0.25);
      const distance = Phaser.Math.Between(24, 64);

      this.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(420, 720),
        ease: 'Cubic.easeOut',
        onComplete: () => dot.destroy()
      });
    }
  }
}
