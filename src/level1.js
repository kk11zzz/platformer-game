const level1 = {
  id: 'level-1',
  name: '第一关：新手试炼',
  width: 2400,
  height: 540,
  spawn: {
    x: 80,
    y: 420
  },
  grounds: [
    {
      x: 0,
      y: 510,
      width: 780,
      height: 60,
      color: 0x6b8e23
    },
    {
      x: 980,
      y: 510,
      width: 1420,
      height: 60,
      color: 0x6b8e23
    }
  ],
  pits: [
    {
      x: 780,
      y: 510,
      width: 200,
      height: 60,
      color: 0x202020
    }
  ],
  platforms: [
    {
      x: 260,
      y: 400,
      width: 260,
      height: 28,
      color: 0x8b5a2b
    },
    {
      x: 610,
      y: 315,
      width: 260,
      height: 28,
      color: 0x8b5a2b
    },
    {
      x: 1050,
      y: 405,
      width: 280,
      height: 28,
      color: 0x8b5a2b
    },
    {
      x: 1450,
      y: 335,
      width: 280,
      height: 28,
      color: 0x8b5a2b
    }
  ],
  coins: [
    {
      x: 340,
      y: 360
    },
    {
      x: 690,
      y: 275
    },
    {
      x: 1190,
      y: 365
    }
  ],
  enemies: [
    {
      x: 1120,
      y: 373,
      patrolLeft: 1060,
      patrolRight: 1300,
      speed: 70
    }
  ],
  goal: {
    x: 2320,
    y: 380,
    width: 50,
    height: 130,
    color: 0x2ecc71
  }
};

export default level1;
