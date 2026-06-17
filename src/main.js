import Phaser from 'phaser';
import { GAME_CONFIG } from './config.js';
import GameScene from './scenes/GameScene.js';
import LevelSelectScene from './scenes/LevelSelectScene.js';

window.Phaser = Phaser;

new Phaser.Game({
  ...GAME_CONFIG,
  scene: [LevelSelectScene, GameScene]
});
