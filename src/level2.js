const level2 = {
  id: 'level-2',
  name: '第二关：高空平台挑战',
  width: 3200,
  height: 540,
  spawn: {
    x: 80,
    y: 420
  },
  grounds: [
    {
      x: 0,
      y: 510,
      width: 520,
      height: 60,
      color: 0x6b8e23
    },
    {
      x: 760,
      y: 510,
      width: 420,
      height: 60,
      color: 0x6b8e23
    },
    {
      x: 1440,
      y: 510,
      width: 420,
      height: 60,
      color: 0x6b8e23
    },
    {
      x: 2100,
      y: 510,
      width: 460,
      height: 60,
      color: 0x6b8e23
    },
    {
      x: 2820,
      y: 510,
      width: 380,
      height: 60,
      color: 0x6b8e23
    }
  ],
  pits: [
    {
      x: 520,
      y: 510,
      width: 240,
      height: 60,
      color: 0x202020
    },
    {
      x: 1180,
      y: 510,
      width: 260,
      height: 60,
      color: 0x202020
    },
    {
      x: 1860,
      y: 510,
      width: 240,
      height: 60,
      color: 0x202020
    },
    {
      x: 2560,
      y: 510,
      width: 260,
      height: 60,
      color: 0x202020
    }
  ],
  platforms: [
    {
      x: 180,
      y: 405,
      width: 220,
      height: 28,
      color: 0x8b5a2b
    },
    {
      x: 480,
      y: 335,
      width: 220,
      height: 28,
      color: 0x8b5a2b
    },
    {
      x: 820,
      y: 400,
      width: 240,
      height: 28,
      color: 0x8b5a2b
    },
    {
      x: 1100,
      y: 325,
      width: 240,
      height: 28,
      color: 0x8b5a2b
    },
    {
      x: 1480,
      y: 390,
      width: 240,
      height: 28,
      color: 0x8b5a2b
    },
    {
      x: 1780,
      y: 315,
      width: 240,
      height: 28,
      color: 0x8b5a2b
    },
    {
      x: 2140,
      y: 390,
      width: 240,
      height: 28,
      color: 0x8b5a2b
    },
    {
      x: 2440,
      y: 330,
      width: 240,
      height: 28,
      color: 0x8b5a2b
    },
    {
      x: 2720,
      y: 400,
      width: 220,
      height: 28,
      color: 0x8b5a2b
    }
  ],
  coins: [
    {
      x: 250,
      y: 365
    },
    {
      x: 560,
      y: 295
    },
    {
      x: 900,
      y: 360
    },
    {
      x: 1180,
      y: 285
    },
    {
      x: 1560,
      y: 350
    },
    {
      x: 1860,
      y: 275
    },
    {
      x: 2220,
      y: 350
    },
    {
      x: 2520,
      y: 290
    },
    {
      x: 2800,
      y: 360
    }
  ],
  enemies: [
    {
      x: 840,
      y: 473,
      patrolLeft: 760,
      patrolRight: 1150,
      speed: 105
    },
    {
      x: 1500,
      y: 473,
      patrolLeft: 1440,
      patrolRight: 1830,
      speed: 115
    },
    {
      x: 2160,
      y: 473,
      patrolLeft: 2100,
      patrolRight: 2530,
      speed: 125
    },
    {
      x: 2900,
      y: 473,
      patrolLeft: 2820,
      patrolRight: 3120,
      speed: 130
    }
  ],
  goal: {
    x: 3120,
    y: 380,
    width: 50,
    height: 130,
    color: 0x2ecc71
  }
};

export default level2;
