const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const modeChip = document.getElementById('modeChip');
const menuOverlay = document.getElementById('menuOverlay');
const endOverlay = document.getElementById('endOverlay');
const endTitle = document.getElementById('endTitle');
const endKicker = document.getElementById('endKicker');
const endCopy = document.getElementById('endCopy');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const playerLifeValue = document.getElementById('playerLifeValue');
const playerBombValue = document.getElementById('playerBombValue');

canvas.width = 540;
canvas.height = 720;

const W = canvas.width;
const H = canvas.height;
const TAU = Math.PI * 2;
const MAX_BOMBS = 3;
const MAX_PLAYER_LIVES = 2;
const BOSS_PHASE_HP = 200;

function loadSprite(fileName) {
  const image = new Image();
  image.src = `./image/${fileName}`;
  return image;
}

const sprites = {
  fairy: loadSprite('1.png'),
  wisp: loadSprite('2.png'),
  midboss: loadSprite('3.png'),
  supportMidboss: loadSprite('3.png'),
  boss: loadSprite('boss.png'),
};

const keysDown = new Set();
const keysPressed = new Set();

window.addEventListener('keydown', (event) => {
  if (!keysDown.has(event.code)) {
    keysPressed.add(event.code);
  }
  keysDown.add(event.code);

  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
    event.preventDefault();
  }
});

window.addEventListener('keyup', (event) => {
  keysDown.delete(event.code);
});

function isMoveKey(code) {
  return code === 'KeyW' || code === 'KeyA' || code === 'KeyS' || code === 'KeyD' || code === 'ArrowUp' || code === 'ArrowLeft' || code === 'ArrowDown' || code === 'ArrowRight';
}

const config = {
  enemyBulletSpeed: 165,
  bossBulletSpeed: 180,
  waveInterval: 0.55,
  enemyFireMultiplier: 1,
};

const stagePlan = [
  {
    key: 'wave1',
    type: 'wave',
    label: 'wave1',
    subtitle: '雑魚Aを15隊',
    spawnTotal: 15,
    spawnInterval: 0.52,
    spawnFactory: 'spawnWave1Enemy',
  },
  {
    key: 'wave2',
    type: 'wave',
    label: 'wave2',
    subtitle: '雑魚Bを15隊',
    spawnTotal: 15,
    spawnInterval: 0.5,
    spawnFactory: 'spawnWave2Enemy',
  },
  {
    key: 'wave3-1',
    type: 'midboss',
    label: 'wave3-1',
    subtitle: '中ボス / 弾幕1つ目',
    midbossVariant: 'fan',
  },
  {
    key: 'wave3-2',
    type: 'midboss',
    label: 'wave3-2',
    subtitle: '中ボス / 弾幕2つ目',
    midbossVariant: 'spiral',
  },
  {
    key: 'wave4',
    type: 'wave',
    label: 'wave4',
    subtitle: '雑魚A+Bの混成',
    spawnTotal: 18,
    spawnInterval: 0.45,
    spawnFactory: 'spawnWave4Enemy',
  },
  {
    key: 'boss-dialogue',
    type: 'dialogue',
    label: 'BOSSとの会話',
    subtitle: 'ボス前会話',
    lines: [
      { speaker: 'エイル＝ノクス', text: 'お前...今年で...いくつだ...' },
      { speaker: 'エイル＝ノクス', text: '月は毎年、ほんとうは四回だけ青くなる。だれも見たことがないけど。' },
      { speaker: 'エイル＝ノクス', text: '雨粒は落ちる前に、だいたい三秒だけ自分の名前を考えている。' },
      { speaker: 'オデ', text: 'オデ...お前...丸かじる...' },
      { speaker: 'オデ', text: 'きのこは夜にだけ、影のほうへ引っ越しする。朝にはだいたい戻る。' },
      { speaker: 'エイル＝ノクス', text: 'この弾幕、よく見ると全部ちがう数列のたまごから生まれてる。' },
      { speaker: 'オデ', text: 'おでんの大根は、切る前に一度だけ宇宙の方角を向くって聞いた。' },
      { speaker: 'エイル＝ノクス', text: 'カメは左足で夢を見ると長生きする。右足だとたぶん夕方になる。' },
      { speaker: 'オデ', text: 'オデの村では、冷蔵庫の上に置いた輪ゴムが天気予報をしていた。' },
      { speaker: 'エイル＝ノクス', text: 'エレベーターの「閉」は、たまにひとりで練習している。' },
      { speaker: 'オデ', text: '土星の輪っかは、昔の落とし物をしまってある棚だという説がある。' },
      { speaker: 'エイル＝ノクス', text: '砂時計の砂は、だいたい半分くらいが気分で流れている。' },
      { speaker: 'オデ', text: 'この城の床、三歩あるくと一回だけ知らない音階を返してくる。' },
      { speaker: 'エイル＝ノクス', text: '鳥は空を飛ぶんじゃない、空のほうが鳥を覚えておくんだよ。' },
      { speaker: 'オデ', text: 'スプーンは夜になると、だいたい人生相談をしたがる。' },
      { speaker: 'エイル＝ノクス', text: '雲は水じゃなくて、遠くの海がちょっと休憩している姿らしい。' },
      { speaker: 'オデ', text: 'オデが知ってる一番短い道は、地図に載る前に曲がっている。' },
      { speaker: 'エイル＝ノクス', text: '電柱の影は、夕方になると自分の背丈を測り直す。' },
      { speaker: 'オデ', text: 'イチゴの種は、たまに「今日は表情を変える日」だけ選ばれて赤くなる。' },
      { speaker: 'エイル＝ノクス', text: '深海の魚は、見られると少し照れて光る種類がいる。たぶん。' },
      { speaker: 'オデ', text: '氷は溶ける前に、一回だけ夏の名前を覚えてる。' },
      { speaker: 'エイル＝ノクス', text: 'この世界の午前2時には、時計の針がひそひそ話しかしない。' },
      { speaker: 'オデ', text: '雷は空の中で忘れた鍵を探しているだけかもしれない。' },
      { speaker: 'エイル＝ノクス', text: '花びらは落ちる時、全部ちがう方向の帰り道を選ぶ。' },
      { speaker: 'オデ', text: 'ネコが机の上に乗るのは、重力にあいさつしてるからだ。' },
      { speaker: 'エイル＝ノクス', text: '石ころにも、たまに昔の王様みたいな気分の日がある。' },
      { speaker: 'オデ', text: '靴ひもは結ばれるたび、少しだけ他人との距離を学ぶ。' },
      { speaker: 'エイル＝ノクス', text: '木の年輪は年の数じゃない。森で聞いた秘密の回数だよ。' },
      { speaker: 'オデ', text: '朝露は、夜のあいだに空が落とした忘れ物なんだ。' },
      { speaker: 'エイル＝ノクス', text: 'そろそろいいかな。最後にひとつだけ。今日の勝敗は、たぶんヤモリの気分で決まる。' },
    ],
  },
  {
    key: 'boss',
    type: 'boss',
    label: 'BOSS_1',
    subtitle: 'フェイズ1〜6',
  },
];

const bossPhases = [
  {
    name: 'Spell Card 1: Arcane Bloom',
    setup: { x: W * 0.5, y: 132 },
    fire: bossPhaseArcaneBloom,
  },
  {
    name: 'Spell Card 2: Hex Lattice',
    setup: { x: W * 0.5, y: 118 },
    fire: bossPhaseHexLattice,
  },
  {
    name: 'Spell Card 3: Moon Veil',
    setup: { x: W * 0.5, y: 126 },
    fire: bossPhaseMoonVeil,
  },
  {
    name: 'Spell Card 4: Thorn Rain',
    setup: { x: W * 0.5, y: 122 },
    fire: bossPhaseThornRain,
  },
  {
    name: 'Spell Card 5: Cinder Chorus',
    setup: { x: W * 0.5, y: 138 },
    fire: bossPhaseCinderChorus,
  },
];

const state = {
  scene: 'menu',
  score: 0,
  graze: 0,
  bombStock: MAX_BOMBS,
  stageIndex: 0,
  stageTimer: 0,
  stageSpawnTimer: 0,
  stageSpawned: 0,
  stageCleared: false,
  stageBannerTimer: 0,
  time: 0,
  player: null,
  playerBullets: [],
  enemyBullets: [],
  enemies: [],
  particles: [],
  boss: null,
  dialogue: null,
  bombEffect: null,
  bombQueued: false,
  bossSupportSpawned: false,
  combatResetTimer: 0,
  clearTimer: 0,
  titlePulse: 0,
  bgScroll: 0,
};

const bgStars = Array.from({ length: 110 }, () => ({
  x: Math.random() * W,
    subtitle: 'フェイズ1〜5',
  z: 0.25 + Math.random() * 1.6,
  twinkle: Math.random() * TAU,
}));

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

function makePlayer() {
  return {
    x: W * 0.5,
    y: H - 96,
    speed: 280,
    fireCooldown: 0,
    shotIndex: 0,
    lives: 2,
    invuln: 2.5,
    hitRadius: 8,
    grazeRadius: 28,
    power: 1,
  };
}

function resetGame() {
  state.score = 0;
  state.graze = 0;
  state.bombStock = MAX_BOMBS;
  state.stageIndex = 0;
  state.stageTimer = 0;
  state.stageSpawnTimer = 0;
  state.stageSpawned = 0;
  state.stageCleared = false;
  state.stageBannerTimer = 0;
  state.time = 0;
  state.player = makePlayer();
  state.playerBullets = [];
  state.enemyBullets = [];
  state.enemies = [];
  state.particles = [];
  state.boss = null;
  state.dialogue = null;
  state.bombEffect = null;
  state.bombQueued = false;
  state.bossSupportSpawned = false;
  state.combatResetTimer = 0;
  state.clearTimer = 0;
  state.bgScroll = 0;
  updateSidebarStatus();
}

function enterMenu() {
  state.scene = 'menu';
  updateModeChip();
  menuOverlay.classList.remove('hidden');
  endOverlay.classList.add('hidden');
}

function startGame() {
  resetGame();
  state.scene = 'playing';
  menuOverlay.classList.add('hidden');
  endOverlay.classList.add('hidden');
  updateModeChip();
  updateSidebarStatus();
  beginStage(0, true);
}

function endGame(clear = false) {
  state.scene = clear ? 'clear' : 'gameover';
  endOverlay.classList.remove('hidden');
  endKicker.textContent = clear ? 'HAPPY BIRTHDAY' : 'GAME OVER';
  endTitle.textContent = clear ? '誕生日おめでとう' : '結界は破れた';
  endCopy.textContent = clear
    ? `スコア ${Math.floor(state.score).toLocaleString('ja-JP')} / グレイズ ${state.graze}。きょうは特別な日です。`
    : `スコア ${Math.floor(state.score).toLocaleString('ja-JP')} / グレイズ ${state.graze}。もう一度挑めます。`;
}

function updateSidebarStatus() {
  if (playerLifeValue) {
    playerLifeValue.textContent = `${state.player?.lives ?? 0} / ${MAX_PLAYER_LIVES}`;
  }

  if (playerBombValue) {
    playerBombValue.textContent = `${state.bombStock} / ${MAX_BOMBS}`;
  }
}

function currentStage() {
  return stagePlan[state.stageIndex] ?? stagePlan[stagePlan.length - 1];
}

function spawnStageEnemy(stage) {
  if (stage.key === 'wave1') {
    const xPositions = [72, 152, 232, 312, 392];
    const x = xPositions[state.stageSpawned % xPositions.length];
    spawnFairy({ x, y: -26, vx: state.stageSpawned % 2 === 0 ? 0 : 10, vy: 64, fireInterval: 1.2, hp: 18, shotStyle: 'aimed' });
    return;
  }

  if (stage.key === 'wave2') {
    const xPositions = [96, 204, 312, 420];
    const x = xPositions[state.stageSpawned % xPositions.length];
    spawnWisp({ x, y: -26, vx: state.stageSpawned % 2 === 0 ? 16 : -16, vy: 70, fireInterval: 1.0, hp: 20 });
    return;
  }

  if (stage.key === 'wave4') {
    if (state.stageSpawned % 2 === 0) {
      spawnFairy({ x: 90 + (state.stageSpawned % 4) * 96, y: -28, vx: 0, vy: 58, fireInterval: 1.1, hp: 20, shotStyle: 'fan' });
    } else {
      spawnWisp({ x: 120 + (state.stageSpawned % 4) * 88, y: -28, vx: 0, vy: 60, fireInterval: 0.95, hp: 18 });
    }
  }
}

function spawnBossSupportSquads() {
  if (state.bossSupportSpawned) {
    return;
  }

  state.bossSupportSpawned = true;
  spawnSupportMidboss(0);
  spawnSupportMidboss(1);
}

function beginStage(index, force = false) {
  const stage = stagePlan[index];
  if (!stage || (!force && index === state.stageIndex)) {
    return;
  }

  state.stageIndex = index;
  state.stageTimer = 0;
  state.stageSpawnTimer = 0;
  state.stageSpawned = 0;
  state.stageCleared = false;
  state.stageBannerTimer = 2.4;
  state.dialogue = null;
  state.bombQueued = false;
  state.bossSupportSpawned = false;

  if (stage.type === 'dialogue') {
    state.dialogue = {
      lines: stage.lines,
      index: 0,
      callback: () => beginStage(index + 1, true),
      speakerAccent: '#ff9fce',
      title: stage.label,
    };
    return;
  }

  if (stage.type === 'midboss') {
    state.boss = createMidboss(stage.midbossVariant);
    return;
  }

  if (stage.type === 'boss') {
    state.boss = createBoss();
  }
}

function advanceStage() {
  beginStage(state.stageIndex + 1, true);
}

function triggerBomb() {
  if (state.scene !== 'playing' || state.dialogue || state.bombEffect || state.bombStock <= 0) {
    return;
  }

  state.bombStock -= 1;
  const originX = state.player?.x ?? W * 0.5;
  const originY = state.player?.y ?? H * 0.8;
  const enemySnapshot = state.enemies.filter((enemy) => enemy.kind === 'fairy' || enemy.kind === 'wisp');
  const bulletSnapshot = [...state.enemyBullets];
  let scoreGain = 0;

  enemySnapshot.forEach((enemy) => {
    scoreGain += enemy.value;
    spawnParticle(enemy.x, enemy.y, enemy.kind === 'wisp' ? '#89f4ff' : '#ffd38f', 14, 220, 3.2);
  });

  bulletSnapshot.forEach((bullet) => {
    spawnParticle(bullet.x, bullet.y, '#ffffff', 1, 120, 1.4);
  });

  state.score += scoreGain;
  state.enemies = state.enemies.filter((enemy) => enemy.kind !== 'fairy' && enemy.kind !== 'wisp');
  state.enemyBullets.length = 0;
  state.bombQueued = false;
  state.bombEffect = {
    timer: 0.7,
    flash: 1,
    originX,
    originY,
    radius: 0,
  };
}

function updateBombEffect(dt) {
  if (!state.bombEffect) {
    return;
  }

  state.bombEffect.timer -= dt;
  state.bombEffect.flash = Math.max(0, state.bombEffect.flash - dt * 2.5);
  state.bombEffect.radius += dt * 1000;

  if (state.bombEffect.timer <= 0) {
    state.bombEffect = null;
  }
}

function updateModeChip() {
  modeChip.textContent = 'NORMAL';
}

function spawnParticle(x, y, color, count = 1, speed = 100, radius = 2.2) {
  for (let i = 0; i < count; i += 1) {
    const angle = rand(0, TAU);
    const amount = speed * rand(0.35, 1.1);
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * amount,
      vy: Math.sin(angle) * amount,
      life: rand(0.28, 0.72),
      age: 0,
      radius: radius * rand(0.75, 1.3),
      color,
    });
  }
}

function spawnPlayerShot() {
  const player = state.player;
  const spread = [-11, 11];
  for (let i = 0; i < spread.length; i += 1) {
    state.playerBullets.push({
      x: player.x + spread[i],
      y: player.y - 10,
      vx: spread[i] * 0.08,
      vy: -620,
      radius: 4,
      damage: 6,
      life: 1.4,
      age: 0,
      hue: i === 1 ? '#dfffe9' : '#8cf7ff',
    });
  }

  spawnParticle(player.x, player.y - 12, '#8cf7ff', 1, 30, 1.5);
}

function spawnEnemyBullet(x, y, vx, vy, options = {}) {
  state.enemyBullets.push({
    x,
    y,
    vx,
    vy,
    radius: options.radius ?? 6,
    life: options.life ?? 7,
    age: 0,
    color: options.color ?? '#ff8fd0',
    kind: options.kind ?? 'orb',
    swayAmp: options.swayAmp ?? 0,
    swaySpeed: options.swaySpeed ?? 0,
    swayPhase: options.swayPhase ?? 0,
    rotate: options.rotate ?? 0,
    grazed: false,
  });
}

function spawnHitExplosion(x, y, color = '#ff8fd0') {
  spawnParticle(x, y, color, 18, 220, 3.0);
  spawnParticle(x, y, '#fff6da', 10, 160, 2.0);
}

function handlePlayerHit(hitX, hitY) {
  const player = state.player;
  if (!player || player.invuln > 0 || state.scene !== 'playing') {
    return;
  }

  player.lives -= 1;
  player.invuln = 2.2;
  player.x = W * 0.5;
  player.y = H - 96;
  player.fireCooldown = 0;
  state.bombStock = MAX_BOMBS;
  state.playerBullets.length = 0;
  state.enemyBullets.length = 0;
  state.bombQueued = false;
  state.bombEffect = null;
  state.combatResetTimer = 0.15;
  updateSidebarStatus();
  spawnHitExplosion(hitX ?? player.x, hitY ?? player.y);

  if (player.lives <= 0) {
    endGame(false);
  }
}

function spawnEnemyWave(stage) {
  const spawnIndex = state.stageSpawned;

  if (stage.key === 'wave1') {
    const xPositions = [64, 148, 232, 316, 400];
    spawnFairy({
      x: xPositions[spawnIndex % xPositions.length],
      y: -28,
      vx: spawnIndex % 2 === 0 ? 0 : 10,
      vy: 70,
      fireInterval: 1.15,
      hp: 16,
      shotStyle: 'aimed',
    });
    return;
  }

  if (stage.key === 'wave2') {
    const xPositions = [92, 188, 284, 380, 476];
    spawnWisp({
      x: xPositions[spawnIndex % xPositions.length],
      y: -28,
      vx: spawnIndex % 2 === 0 ? -14 : 14,
      vy: 74,
      fireInterval: 0.95,
      hp: 18,
    });
    return;
  }

  if (stage.key === 'wave4') {
    if (spawnIndex % 2 === 0) {
      spawnFairy({
        x: 84 + (spawnIndex % 3) * 112,
        y: -30,
        vx: 0,
        vy: 62,
        fireInterval: 1.0,
        hp: 18,
        shotStyle: 'fan',
      });
    } else {
      spawnWisp({
        x: 130 + (spawnIndex % 3) * 108,
        y: -30,
        vx: 0,
        vy: 62,
        fireInterval: 0.92,
        hp: 18,
      });
    }
  }
}

function spawnFairy({ x, y, vx, vy, fireInterval, hp, shotStyle }) {
  state.enemies.push({
    kind: 'fairy',
    x,
    y,
    vx,
    vy,
    hp,
    maxHp: hp,
    age: 0,
    fireTimer: rand(0.3, 0.95),
    fireInterval,
    shotStyle,
    phase: rand(0, TAU),
    value: 120,
    radius: 16,
  });
}

function spawnWisp({ x, y, vx, vy, fireInterval, hp }) {
  state.enemies.push({
    kind: 'wisp',
    x,
    y,
    vx,
    vy,
    hp,
    maxHp: hp,
    age: 0,
    fireTimer: rand(0.15, 0.7),
    fireInterval,
    shotStyle: 'ring',
    phase: rand(0, TAU),
    value: 100,
    radius: 14,
  });
}

function spawnBoss() {
  state.dialogue = null;
  state.enemies.length = 0;
  state.enemyBullets.length = 0;
  state.boss = createBoss();
}

function createMidboss(variant = 'fan') {
  const hp = 360;
  return {
    kind: 'midboss',
    name: variant === 'fan' ? 'ルシエル' : 'ルシエル',
    variant,
    x: W * 0.5,
    y: 140,
    vx: 0,
    vy: 0,
    hp,
    maxHp: hp,
    age: 0,
    fireTimer: 0.8,
    patternIndex: 0,
    phaseTime: 0,
    radius: 30,
    value: 1200,
  };
}

function createBoss() {
  return {
    kind: 'boss',
    name: 'BOSS_1',
    x: W * 0.5,
    y: 112,
    vx: 0,
    vy: 0,
    phaseHp: BOSS_PHASE_HP,
    phaseMaxHp: BOSS_PHASE_HP,
    age: 0,
    phaseIndex: 0,
    phaseTime: 0,
    phaseFlash: 0,
    supportSpawned: false,
    supportTimer: 0,
    radius: 38,
    value: 6500,
  };
}

function spawnSupportMidboss(slot) {
  const x = slot === 0 ? W * 0.28 : W * 0.72;
  const pattern = slot === 0 ? 'ring' : 'fan';
  state.enemies.push({
    kind: 'supportMidboss',
    name: `中ボス隊${slot + 1}`,
    x,
    y: 160,
    vx: 0,
    vy: 0,
    hp: 240,
    maxHp: 240,
    age: 0,
    fireTimer: 0.7,
    fireInterval: 0.7,
    pattern,
    phase: 0,
    radius: 24,
    value: 900,
  });
}

function advanceBossPhase(boss) {
  boss.phaseIndex += 1;
  boss.phaseTime = 0;
  boss.phaseFlash = 1.2;
  boss.phaseHp = BOSS_PHASE_HP;
  boss.phaseMaxHp = BOSS_PHASE_HP;
  boss.supportSpawned = false;
  boss.supportTimer = 0;
}

function beginEnemyBurst(originX, originY, count, speed, startAngle, spread, color, kind = 'orb', sway = 0) {
  for (let i = 0; i < count; i += 1) {
    const angle = startAngle + spread * (count === 1 ? 0 : (i / (count - 1) - 0.5));
    const velocity = speed * rand(0.95, 1.08);
    spawnEnemyBullet(
      originX,
      originY,
      Math.cos(angle) * velocity,
      Math.sin(angle) * velocity,
      {
        color,
        kind,
        radius: kind === 'needle' ? 4 : kind === 'star' ? 5 : 6,
        swayAmp: sway,
        swaySpeed: sway ? rand(2.5, 4.2) : 0,
        swayPhase: rand(0, TAU),
      },
    );
  }
}

function bossPhaseArcaneBloom(boss, dt, cfg) {
  boss.phaseTime += dt;
  if (boss.phaseTime % 0.95 < dt) {
    const ringCount = 14;
    const rot = boss.phaseTime * 1.7;
    for (let i = 0; i < ringCount; i += 1) {
      const angle = rot + (TAU * i) / ringCount;
      const speed = 102 + i % 3 * 10;
      spawnEnemyBullet(boss.x, boss.y, Math.cos(angle) * speed, Math.sin(angle) * speed, {
        color: i % 2 === 0 ? '#ffd38f' : '#ff8fd0',
        kind: 'star',
        radius: 5,
      });
    }
  }

  if (boss.phaseTime % 0.4 < dt) {
    fireAimedSpread(boss.x, boss.y, 5, 72, '#d9fbff', cfg.enemyBulletSpeed * 0.6);
  }
}

function bossPhaseHexLattice(boss, dt, cfg) {
  boss.phaseTime += dt;
  if (boss.phaseTime % 0.58 < dt) {
    const offsets = [-72, -36, 0, 36, 72];
    const targetAngle = angleTo(boss.x, boss.y, state.player.x, state.player.y);
    offsets.forEach((offset, index) => {
      const angle = targetAngle + (offset * Math.PI) / 360 + Math.sin(boss.phaseTime * 1.2 + index) * 0.03;
      const speed = cfg.enemyBulletSpeed * 0.95 + index * 10;
      spawnEnemyBullet(boss.x, boss.y, Math.cos(angle) * speed, Math.sin(angle) * speed, {
        color: index % 2 === 0 ? '#ffb3e1' : '#9ff7ff',
        kind: 'needle',
        radius: 4,
      });
    });
  }

  if (boss.phaseTime % 1.05 < dt) {
    const pulse = 10 + Math.floor(boss.phaseTime * 2) % 4;
    beginEnemyBurst(boss.x, boss.y, pulse, 128, boss.phaseTime * 1.6, TAU, '#eec87b', 'orb');
  }
}

function bossPhaseMoonVeil(boss, dt, cfg) {
  boss.phaseTime += dt;
  boss.x = W * 0.5 + Math.sin(boss.phaseTime * 0.82) * 160;
  boss.y = 118 + Math.cos(boss.phaseTime * 0.5) * 18;

  if (boss.phaseTime % 0.44 < dt) {
    const originSide = Math.sin(boss.phaseTime * 1.7) > 0 ? 1 : -1;
    const x = originSide > 0 ? W + 10 : -10;
    const y = 170 + Math.sin(boss.phaseTime * 3.1) * 110;
    const vx = originSide * -74;
    const vy = Math.sin(boss.phaseTime * 2.6) * 18;
    spawnEnemyBullet(x, y, vx, vy, {
      color: '#88f5ff',
      kind: 'orb',
      radius: 6,
      swayAmp: 58,
      swaySpeed: 2.8,
      swayPhase: boss.phaseTime * 1.2,
    });
  }

  if (boss.phaseTime % 1.15 < dt) {
    fireAimedSpread(boss.x, boss.y, 7, 68, '#ff9ed4', cfg.enemyBulletSpeed * 0.52, 0.38);
  }
}

function bossPhaseThornRain(boss, dt, cfg) {
  boss.phaseTime += dt;
  if (boss.phaseTime % 0.24 < dt) {
    const count = 4;
    for (let i = 0; i < count; i += 1) {
      const x = 60 + ((boss.phaseTime * 180 + i * 140) % (W - 120));
      const y = -10 - i * 18;
      spawnEnemyBullet(x, y, Math.sin(boss.phaseTime * 1.1 + i) * 10, 132 + i * 7, {
        color: i % 2 === 0 ? '#ffd38f' : '#ff8fd0',
        kind: 'needle',
        radius: 4,
        swayAmp: 18,
        swaySpeed: 3.5,
        swayPhase: rand(0, TAU),
      });
    }
  }

  if (boss.phaseTime % 1.2 < dt) {
    const arcCount = 9;
    for (let i = 0; i < arcCount; i += 1) {
      const angle = -Math.PI * 0.15 + (Math.PI * 0.3 * i) / (arcCount - 1);
      spawnEnemyBullet(boss.x, boss.y, Math.cos(angle) * 98, Math.sin(angle) * 98, {
        color: '#dfffe9',
        kind: 'star',
        radius: 5,
      });
    }
  }
}

function bossPhaseCinderChorus(boss, dt, cfg) {
  boss.phaseTime += dt;
  boss.x = W * 0.5 + Math.sin(boss.phaseTime * 1.8) * 190;
  boss.y = 132 + Math.sin(boss.phaseTime * 0.8) * 16;

  if (boss.phaseTime % 0.5 < dt) {
    const side = Math.sin(boss.phaseTime * 2.2) > 0 ? -1 : 1;
    const x = side < 0 ? -16 : W + 16;
    const y = 180 + Math.cos(boss.phaseTime * 2.5) * 96;
    const aim = angleTo(x, y, state.player.x, state.player.y);
    const bias = side < 0 ? Math.PI - 0.35 : -0.35;
    beginEnemyBurst(x, y, 6, 122, aim + bias, 0.65, '#ff7fb7', 'star');
  }

  if (boss.phaseTime % 0.92 < dt) {
    beginEnemyBurst(boss.x, boss.y, 14, 98, boss.phaseTime * 1.25, TAU, '#eec87b', 'orb');
  }
}

function bossPhaseEclipseRite(boss, dt, cfg) {
  boss.phaseTime += dt;
  const desperation = 1 - boss.hp / boss.maxHp;
  boss.x = W * 0.5 + Math.sin(boss.phaseTime * 1.8) * (96 + desperation * 24);
  boss.y = 118 + Math.cos(boss.phaseTime * 1.1) * (14 + desperation * 6);

  if (boss.phaseTime % 0.36 < dt) {
    fireAimedSpread(boss.x, boss.y, 7, 70 + desperation * 20, '#9ff7ff', cfg.enemyBulletSpeed * (0.78 + desperation * 0.28), 0.45);
  }

  if (boss.phaseTime % 0.74 < dt) {
    const ringCount = 16;
    const rot = boss.phaseTime * (1.5 + desperation * 0.9);
    for (let i = 0; i < ringCount; i += 1) {
      const angle = rot + (TAU * i) / ringCount;
      spawnEnemyBullet(boss.x, boss.y, Math.cos(angle) * (90 + desperation * 32), Math.sin(angle) * (90 + desperation * 32), {
        color: i % 3 === 0 ? '#ffd38f' : i % 3 === 1 ? '#ff8fd0' : '#9ff7ff',
        kind: 'star',
        radius: 5,
      });
    }
  }
}

function fireAimedSpread(x, y, count, spreadDegrees, color, speed, centerJitter = 0.15) {
  const aim = angleTo(x, y, state.player.x, state.player.y);
  const spread = (spreadDegrees * Math.PI) / 180;
  const step = count > 1 ? spread / (count - 1) : 0;
  for (let i = 0; i < count; i += 1) {
    const angle = aim - spread * 0.5 + step * i + rand(-centerJitter, centerJitter) * 0.08;
    spawnEnemyBullet(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, {
      color,
      kind: 'needle',
      radius: 4,
    });
  }
}

function updateStageDirector(dt) {
  const stage = currentStage();
  if (!stage || state.dialogue) {
    return;
  }

  state.stageTimer += dt;
  state.stageBannerTimer = Math.max(0, state.stageBannerTimer - dt);

  if (stage.type === 'wave') {
    state.stageSpawnTimer += dt;
    while (state.stageSpawned < stage.spawnTotal && state.stageSpawnTimer >= stage.spawnInterval) {
      state.stageSpawnTimer -= stage.spawnInterval;
      spawnEnemyWave(stage);
      state.stageSpawned += 1;
    }

    if (state.stageSpawned >= stage.spawnTotal && state.enemies.length === 0) {
      state.stageCleared = true;
      advanceStage();
    }
    return;
  }

  if (stage.type === 'midboss' && !state.boss) {
    state.boss = createMidboss(stage.midbossVariant);
    return;
  }

  if (stage.type === 'boss' && !state.boss) {
    state.boss = createBoss();
  }
}

function updatePlayer(dt) {
  const player = state.player;
  let moveX = 0;
  let moveY = 0;

  if (keysDown.has('KeyA') || keysDown.has('ArrowLeft')) moveX -= 1;
  if (keysDown.has('KeyD') || keysDown.has('ArrowRight')) moveX += 1;
  if (keysDown.has('KeyW') || keysDown.has('ArrowUp')) moveY -= 1;
  if (keysDown.has('KeyS') || keysDown.has('ArrowDown')) moveY += 1;

  const magnitude = Math.hypot(moveX, moveY) || 1;
  moveX /= magnitude;
  moveY /= magnitude;

  const speed = keysDown.has('ShiftLeft') || keysDown.has('ShiftRight') ? player.speed * 0.72 : player.speed;
  player.x = clamp(player.x + moveX * speed * dt, 26, W - 26);
  player.y = clamp(player.y + moveY * speed * dt, 34, H - 24);

  player.fireCooldown = Math.max(0, player.fireCooldown - dt);
  if (keysDown.has('Space') && player.fireCooldown <= 0 && state.scene === 'playing' && !state.dialogue) {
    spawnPlayerShot();
    player.fireCooldown = 0.09;
    player.shotIndex = (player.shotIndex + 1) % 6;
  }

  player.invuln = Math.max(0, player.invuln - dt);
}

function updatePlayerBullets(dt) {
  for (let i = state.playerBullets.length - 1; i >= 0; i -= 1) {
    const bullet = state.playerBullets[i];
    bullet.age += dt;
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    if (bullet.age > bullet.life || bullet.x < -40 || bullet.x > W + 40 || bullet.y < -60) {
      state.playerBullets.splice(i, 1);
    }
  }
}

function updateEnemyBullets(dt) {
  const player = state.player;
  if (!player || state.scene !== 'playing') {
    return;
  }

  const grazeRadius = player.grazeRadius;
  for (let i = state.enemyBullets.length - 1; i >= 0; i -= 1) {
    const bullet = state.enemyBullets[i];
    bullet.age += dt;
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    if (bullet.swayAmp) {
      bullet.x += Math.cos(bullet.age * bullet.swaySpeed + bullet.swayPhase) * bullet.swayAmp * dt;
    }

    const d = dist(bullet.x, bullet.y, player.x, player.y);
    if (!bullet.grazed && d < grazeRadius + bullet.radius && d > player.hitRadius + bullet.radius) {
      bullet.grazed = true;
      state.graze += 1;
      state.score += 2;
    }

    if (bullet.age > bullet.life || bullet.x < -80 || bullet.x > W + 80 || bullet.y < -120 || bullet.y > H + 120) {
      state.enemyBullets.splice(i, 1);
      continue;
    }

    if (d < player.hitRadius + bullet.radius) {
      handlePlayerHit(bullet.x, bullet.y);
      state.enemyBullets.splice(i, 1);
      if (state.scene !== 'playing') {
        return;
      }
    }
  }
}

function updateEnemies(dt) {
  for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = state.enemies[i];
    enemy.age += dt;
    enemy.phase += dt;
    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;
    if (enemy.kind === 'fairy') {
      enemy.x += Math.sin(enemy.phase * 1.8) * 22 * dt;
      enemy.fireTimer -= dt * config.enemyFireMultiplier;
      if (enemy.fireTimer <= 0) {
        enemy.fireTimer = enemy.fireInterval;
        const style = enemy.shotStyle;
        if (style === 'aimed') {
          fireAimedSpread(enemy.x, enemy.y, 3, 24, '#ff92ca', config.enemyBulletSpeed * 0.68, 0.12);
        } else if (style === 'scatter') {
          beginEnemyBurst(enemy.x, enemy.y, 5, 90, enemy.phase, TAU, '#eec87b', 'orb');
        } else if (style === 'spiral') {
          const rot = enemy.phase * 2.4;
          for (let k = 0; k < 6; k += 1) {
            const angle = rot + (TAU * k) / 6;
            spawnEnemyBullet(enemy.x, enemy.y, Math.cos(angle) * 108, Math.sin(angle) * 108, {
              color: k % 2 === 0 ? '#9ff7ff' : '#ff8fd0',
              kind: 'orb',
              radius: 5,
            });
          }
        } else {
          beginEnemyBurst(enemy.x, enemy.y, 6, 100, angleTo(enemy.x, enemy.y, state.player.x, state.player.y), 0.75, '#ff9ed4', 'needle');
        }
      }
    }

    const player = state.player;
    if (player && state.scene === 'playing' && player.invuln <= 0) {
      const bodyDistance = dist(enemy.x, enemy.y, player.x, player.y);
      if (bodyDistance < enemy.radius + player.hitRadius) {
        handlePlayerHit(enemy.x, enemy.y);
      }
    }

    if (enemy.kind === 'wisp') {
      enemy.x += Math.sin(enemy.phase * 2.6) * 36 * dt;
      enemy.fireTimer -= dt * config.enemyFireMultiplier;
      if (enemy.fireTimer <= 0) {
        enemy.fireTimer = enemy.fireInterval;
        const ringCount = 8;
        const base = enemy.phase * 1.7;
        for (let k = 0; k < ringCount; k += 1) {
          const angle = base + (TAU * k) / ringCount;
          spawnEnemyBullet(enemy.x, enemy.y, Math.cos(angle) * 104, Math.sin(angle) * 104, {
            color: k % 2 === 0 ? '#ffd38f' : '#89f4ff',
            kind: 'star',
            radius: 5,
            swayAmp: 14,
            swaySpeed: 3.4,
            swayPhase: rand(0, TAU),
          });
        }
      }
    }

    if (enemy.kind === 'supportMidboss') {
      enemy.y += Math.sin(enemy.phase * 0.8) * 0.1;
      enemy.fireTimer -= dt * 0.7;
      if (enemy.fireTimer <= 0) {
        enemy.fireTimer = enemy.fireInterval;
        if (enemy.pattern === 'ring') {
          const ringCount = 10;
          const base = enemy.phase * 1.4;
          for (let k = 0; k < ringCount; k += 1) {
            const angle = base + (TAU * k) / ringCount;
            spawnEnemyBullet(enemy.x, enemy.y, Math.cos(angle) * 102, Math.sin(angle) * 102, {
              color: k % 2 === 0 ? '#ffd38f' : '#89f4ff',
              kind: 'orb',
              radius: 5,
            });
          }
        } else {
          fireAimedSpread(enemy.x, enemy.y, 5, 42, '#ffb3e1', config.enemyBulletSpeed * 0.7, 0.18);
        }
      }
    }

    if (enemy.hp <= 0) {
      state.score += enemy.value;
      spawnParticle(enemy.x, enemy.y, enemy.kind === 'wisp' ? '#89f4ff' : '#ffd38f', 12, 160, 2.6);
      state.enemies.splice(i, 1);
      continue;
    }

    if (enemy.y > H + 80) {
      state.enemies.splice(i, 1);
    }
  }
}

function updateBoss(dt) {
  const boss = state.boss;
  if (!boss || state.scene !== 'playing') {
    return;
  }

  boss.age += dt;
  boss.phaseFlash = Math.max(0, boss.phaseFlash - dt);

  if (boss.kind === 'midboss') {
    boss.phaseTime += dt;
    boss.y = 130 + Math.sin(boss.phaseTime * 1.2) * 18;
    boss.x = W * 0.5 + Math.sin(boss.phaseTime * 0.5) * 100;

    boss.fireTimer -= dt * config.enemyFireMultiplier;
    if (boss.fireTimer <= 0) {
      boss.fireTimer = 0.72;
      boss.patternIndex += 1;
      if (boss.variant === 'fan') {
        fireAimedSpread(boss.x, boss.y, 7, 58, '#ffb3e1', config.enemyBulletSpeed * 0.8, 0.18);
      } else if (boss.variant === 'spiral') {
        const start = boss.phaseTime * 1.9;
        for (let i = 0; i < 10; i += 1) {
          const angle = start + (TAU * i) / 10;
          spawnEnemyBullet(boss.x, boss.y, Math.cos(angle) * 96, Math.sin(angle) * 96, {
            color: i % 2 === 0 ? '#89f4ff' : '#ffd38f',
            kind: 'orb',
            radius: 5,
          });
        }
      } else {
        beginEnemyBurst(boss.x, boss.y, 12, 118, boss.phaseTime * 1.1, TAU, '#dfffe9', 'star');
      }
    }

    if (boss.hp <= 0) {
      spawnParticle(boss.x, boss.y, '#ffcf8a', 26, 200, 3.6);
      state.score += boss.value;
      state.boss = null;
      state.enemyBullets.length = 0;
      advanceStage();
    }
    return;
  }

  if (boss.kind === 'boss') {
    boss.phaseTime += dt;
    const phase = bossPhases[boss.phaseIndex];
    if (!phase) {
      state.boss = null;
      endGame(true);
      return;
    }

    if (boss.phaseIndex === 4 && !boss.supportSpawned) {
      spawnBossSupportSquads();
      boss.supportSpawned = true;
    }

    boss.x = lerp(boss.x, phase.setup.x, 0.03);
    boss.y = lerp(boss.y, phase.setup.y, 0.03);

    phase.fire(boss, dt, config);
    boss.x = clamp(boss.x, 56, W - 56);
    boss.y = clamp(boss.y, 72, H - 220);

    if (boss.phaseHp <= 0) {
      if (boss.phaseIndex < bossPhases.length - 1) {
        advanceBossPhase(boss);
        state.enemyBullets = state.enemyBullets.filter((bullet, index) => index % 4 !== 0);
      } else {
        spawnParticle(boss.x, boss.y, '#fff0c2', 48, 240, 4.2);
        state.score += boss.value;
        state.boss = null;
        state.enemies.length = 0;
        state.enemyBullets.length = 0;
        state.clearTimer = 1.8;
        endGame(true);
      }
    }
    return;
  }

}

function updateCollisions() {
  const player = state.player;
  if (!player || state.scene !== 'playing') {
    return;
  }

  for (let i = state.playerBullets.length - 1; i >= 0; i -= 1) {
    const bullet = state.playerBullets[i];
    let hit = false;

    if (state.boss) {
      const boss = state.boss;
      if (dist(bullet.x, bullet.y, boss.x, boss.y) < boss.radius + bullet.radius) {
        if (boss.kind === 'boss') {
          boss.phaseHp -= 1;
        } else {
          boss.hp -= bullet.damage;
        }
        state.score += 6;
        hit = true;
      }
    }

    for (let j = state.enemies.length - 1; j >= 0; j -= 1) {
      const enemy = state.enemies[j];
      if (dist(bullet.x, bullet.y, enemy.x, enemy.y) < enemy.radius + bullet.radius) {
        enemy.hp -= bullet.damage;
        state.score += 4;
        spawnParticle(bullet.x, bullet.y, '#dfffe9', 2, 70, 1.6);
        hit = true;
        break;
      }
    }

    if (hit) {
      state.playerBullets.splice(i, 1);
    }

    if (state.scene !== 'playing') {
      return;
    }
  }
}

function updateDialogue() {
  const dialogue = state.dialogue;
  if (!dialogue) {
    return;
  }

  if (keysPressed.has('Space')) {
    dialogue.index += 1;
    if (dialogue.index >= dialogue.lines.length) {
      const callback = dialogue.callback;
      state.dialogue = null;
      if (callback) {
        callback();
      }
    }
  }
}

function updateStageFlow(dt) {
  if (state.scene !== 'playing') {
    return;
  }

  state.time += dt;

  if (!state.dialogue && !state.bombEffect) {
    updateStageDirector(dt);
  }

  const stage = currentStage();
  if (stage?.type === 'boss' && !state.boss && state.enemies.length === 0) {
    endGame(true);
  }
}

function updateParticles(dt) {
  for (let i = state.particles.length - 1; i >= 0; i -= 1) {
    const particle = state.particles[i];
    particle.age += dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= 0.98;
    particle.vy *= 0.98;
    if (particle.age >= particle.life) {
      state.particles.splice(i, 1);
    }
  }
}

function spawnStageBadgeLabel() {
  const stage = currentStage();
  if (!stage) {
    return 'STAGE';
  }
  return stage.subtitle ? `${stage.label} / ${stage.subtitle}` : stage.label;
}

function updateGame(dt) {
  state.bgScroll += dt * 120;
  state.titlePulse += dt;

  if (state.combatResetTimer > 0) {
    state.combatResetTimer = Math.max(0, state.combatResetTimer - dt);
  }

  updateSidebarStatus();

  if (state.scene === 'playing') {
    if (state.bombQueued) {
      triggerBomb();
    }

    if (state.bombEffect) {
      updateBombEffect(dt);
      updateParticles(dt);
      keysPressed.clear();
      return;
    }

    updateStageFlow(dt);
    updateDialogue();
    updatePlayer(dt);
    updatePlayerBullets(dt);

    if (state.combatResetTimer > 0) {
      updateParticles(dt);
      keysPressed.clear();
      return;
    }

    updateEnemies(dt);

    if (state.combatResetTimer > 0) {
      updateParticles(dt);
      keysPressed.clear();
      return;
    }

    updateBoss(dt);

    if (state.combatResetTimer > 0) {
      updateParticles(dt);
      keysPressed.clear();
      return;
    }

    updateEnemyBullets(dt);

    if (state.combatResetTimer > 0) {
      updateParticles(dt);
      keysPressed.clear();
      return;
    }

    updateCollisions();
    updateParticles(dt);
  } else {
    updateParticles(dt * 0.6);
  }

  keysPressed.clear();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, '#0d1024');
  gradient.addColorStop(0.42, '#140f28');
  gradient.addColorStop(1, '#03040a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  const nebula = ctx.createRadialGradient(W * 0.5, H * 0.24, 40, W * 0.5, H * 0.24, 340);
  nebula.addColorStop(0, 'rgba(157,123,255,0.18)');
  nebula.addColorStop(0.55, 'rgba(255,137,196,0.08)');
  nebula.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = nebula;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.translate(0, (state.bgScroll % 96) - 96);
  for (let y = -96; y < H + 96; y += 96) {
    for (let x = 0; x < W; x += 96) {
      ctx.strokeStyle = y % 192 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 96, y + 96);
      ctx.stroke();
    }
  }
  ctx.restore();

  bgStars.forEach((star) => {
    star.y += star.z * 28 * 0.016;
    if (star.y > H + 12) {
      star.y = -12;
      star.x = Math.random() * W;
    }
    star.twinkle += 0.03 * star.z;
    const alpha = 0.28 + Math.sin(star.twinkle) * 0.14;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(star.x, star.y, star.z * 1.5, star.z * 1.5);
  });
}

function drawPlayer() {
  const player = state.player;
  if (!player) {
    return;
  }

  const blink = player.invuln > 0 && Math.floor(player.invuln * 14) % 2 === 0;
  if (blink) {
    ctx.globalAlpha = 0.4;
  }

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.fillStyle = '#e2ffef';
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(10, 10);
  ctx.lineTo(0, 6);
  ctx.lineTo(-10, 10);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#8cf7ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.lineTo(0, 14);
  ctx.stroke();

  ctx.fillStyle = '#8cf7ff';
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.globalAlpha = 1;
}

function drawPlayerBullets() {
  state.playerBullets.forEach((bullet) => {
    ctx.save();
    ctx.translate(bullet.x, bullet.y);
    ctx.fillStyle = bullet.hue;
    ctx.beginPath();
    ctx.roundRect(-3, -11, 6, 22, 4);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.fillRect(-1, -12, 2, 24);
    ctx.restore();
  });
}

function drawEnemyBullets() {
  state.enemyBullets.forEach((bullet) => {
    ctx.save();
    ctx.translate(bullet.x, bullet.y);
    ctx.rotate(bullet.rotate + bullet.age * 0.8);
    ctx.shadowColor = bullet.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = bullet.color;
    if (bullet.kind === 'needle') {
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(4, 0);
      ctx.lineTo(0, 8);
      ctx.lineTo(-4, 0);
      ctx.closePath();
      ctx.fill();
    } else if (bullet.kind === 'star') {
      ctx.beginPath();
      for (let i = 0; i < 5; i += 1) {
        const outer = i * (TAU / 5) - Math.PI / 2;
        const inner = outer + Math.PI / 5;
        ctx.lineTo(Math.cos(outer) * 7, Math.sin(outer) * 7);
        ctx.lineTo(Math.cos(inner) * 3.2, Math.sin(inner) * 3.2);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, bullet.radius, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  });
}

function drawEnemies() {
  state.enemies.forEach((enemy) => {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    const sprite = enemy.kind === 'fairy' ? sprites.fairy : enemy.kind === 'wisp' ? sprites.wisp : sprites.midboss;
    const size = enemy.kind === 'fairy' ? 32 : enemy.kind === 'wisp' ? 32 : 46;

    if (sprite.complete && sprite.naturalWidth > 0) {
      ctx.shadowBlur = enemy.kind === 'fairy' ? 14 : 18;
      ctx.shadowColor = enemy.kind === 'fairy' ? '#ff8fd0' : enemy.kind === 'wisp' ? '#89f4ff' : '#ffe0a7';
      ctx.drawImage(sprite, -size * 0.5, -size * 0.5, size, size);
    } else {
      ctx.shadowBlur = 12;
      ctx.shadowColor = enemy.kind === 'wisp' ? '#89f4ff' : '#ff8fd0';
      ctx.fillStyle = enemy.kind === 'wisp' ? '#a7fbff' : '#ffd0ec';
      if (enemy.kind === 'wisp') {
        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.lineTo(16, 0);
        ctx.lineTo(0, 16);
        ctx.lineTo(-16, 0);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  });
}

function drawBoss() {
  const boss = state.boss;
  if (!boss) {
    return;
  }

  ctx.save();
  ctx.translate(boss.x, boss.y);
  const sprite = boss.kind === 'boss' ? sprites.boss : sprites.midboss;
  const size = boss.kind === 'boss' ? 86 : 64;

  if (sprite.complete && sprite.naturalWidth > 0) {
    ctx.shadowBlur = boss.kind === 'boss' ? 28 : 20;
    ctx.shadowColor = boss.kind === 'boss' ? '#ff8fd0' : '#eec87b';
    ctx.drawImage(sprite, -size * 0.5, -size * 0.5, size, size);
  } else {
    ctx.shadowBlur = 26;
    ctx.shadowColor = boss.kind === 'boss' ? '#ff8fd0' : '#eec87b';
    ctx.fillStyle = boss.kind === 'boss' ? '#f9d6ff' : '#ffe0a7';
    ctx.beginPath();
    ctx.arc(0, 0, boss.kind === 'boss' ? 28 : 24, 0, TAU);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(0, -6, 7, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = boss.kind === 'boss' ? '#ff8fd0' : '#ffd38f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, boss.kind === 'boss' ? 40 : 34, boss.phaseTime * 0.6, boss.phaseTime * 0.6 + TAU * 0.7);
    ctx.stroke();
  }
  ctx.restore();
}

function drawParticles() {
  state.particles.forEach((particle) => {
    const alpha = 1 - particle.age / particle.life;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, TAU);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawArenaFrame() {
  ctx.save();
  ctx.strokeStyle = 'rgba(232, 198, 123, 0.28)';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, W - 20, H - 20);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.strokeRect(20, 20, W - 40, H - 40);
  ctx.restore();
}

function drawHud() {
  const player = state.player;
  const stage = currentStage();
  const boss = state.boss;

  ctx.save();
  ctx.fillStyle = 'rgba(4, 4, 12, 0.58)';
  ctx.fillRect(0, 0, W, 62);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(0, 62, W, 2);

  ctx.fillStyle = '#f7f0ff';
  ctx.font = '700 20px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
  ctx.fillText(`SCORE ${Math.floor(state.score).toLocaleString('ja-JP')}`, 26, 28);
  ctx.font = '700 15px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
  ctx.fillStyle = '#e8c67b';
  ctx.fillText(`TIME ${formatTime(state.time)}`, 26, 48);

  ctx.fillStyle = '#b7adc9';
  ctx.fillText(`MODE NORMAL / ${stage ? stage.label : ''}`, 276, 28);
  ctx.fillText(`GRAZE ${state.graze}`, 276, 48);
  drawBombs();

  drawLives(player);
  drawBossBar(boss);

  if (state.stageBannerTimer > 0) {
    const t = smoothstep(0, 0.5, state.stageBannerTimer) * smoothstep(2.4, 1.8, state.stageBannerTimer);
    ctx.globalAlpha = t;
    ctx.fillStyle = '#fff36d';
    ctx.font = '700 20px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(spawnStageBadgeLabel(), W * 0.5, 96);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }

  ctx.restore();
}

function drawLives(player) {
  if (!player) {
    return;
  }

  const baseX = W - 250;
  ctx.fillStyle = '#b7adc9';
  ctx.font = '700 15px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
  ctx.fillText('LIVES', baseX, 28);
  for (let i = 0; i < MAX_PLAYER_LIVES; i += 1) {
    ctx.save();
    ctx.translate(baseX + 58 + i * 28, 19);
    ctx.fillStyle = i < player.lives ? '#ff8fd0' : 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, 5);
    ctx.lineTo(0, 2);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawBombs() {
  const baseX = W - 250;
  ctx.fillStyle = '#b7adc9';
  ctx.font = '700 15px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
  ctx.fillText('BOMBS', baseX, 72);
  for (let i = 0; i < MAX_BOMBS; i += 1) {
    ctx.save();
    ctx.translate(baseX + 58 + i * 28, 63);
    ctx.fillStyle = i < state.bombStock ? '#89f4ff' : 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

function drawBossBar(boss) {
  if (!boss) {
    return;
  }

  const label = boss.kind === 'boss' ? `${boss.name} / ${bossPhases[boss.phaseIndex]?.name ?? 'Boss'}` : boss.kind === 'supportMidboss' ? '中ボス隊' : 'Midboss';
  const x = W - 330;
  const y = 38;
  const w = 260;
  const h = 10;
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(x, y, w, h);
  const ratio = clamp((boss.kind === 'boss' ? boss.phaseHp : boss.hp) / (boss.kind === 'boss' ? boss.phaseMaxHp : boss.maxHp), 0, 1);
  const fill = ctx.createLinearGradient(x, y, x + w, y);
  fill.addColorStop(0, '#89f4ff');
  fill.addColorStop(0.5, '#ff8fd0');
  fill.addColorStop(1, '#eec87b');
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w * ratio, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = '#f7f0ff';
  ctx.font = '700 12px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
  ctx.fillText(label, x, 30);
}

function drawDialogue() {
  if (!state.dialogue) {
    return;
  }

  const dialogue = state.dialogue;
  const line = dialogue.lines[clamp(dialogue.index, 0, dialogue.lines.length - 1)];
  const portraitX = 56;
  const portraitY = H - 170;
  const portraitW = 116;
  const portraitH = 138;
  const textX = portraitX + portraitW + 18;
  const textWidth = W - textX - 72;
  ctx.save();
  ctx.fillStyle = 'rgba(4, 4, 10, 0.72)';
  ctx.fillRect(38, H - 180, W - 76, 142);
  ctx.strokeStyle = dialogue.speakerAccent;
  ctx.lineWidth = 2;
  ctx.strokeRect(38, H - 180, W - 76, 142);

  const portrait = sprites.boss;
  if (portrait.complete && portrait.naturalWidth > 0) {
    ctx.save();
    ctx.shadowColor = 'rgba(255, 143, 208, 0.55)';
    ctx.shadowBlur = 14;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(portraitX - 4, portraitY - 4, portraitW + 8, portraitH + 8);
    ctx.strokeStyle = dialogue.speakerAccent;
    ctx.lineWidth = 2;
    ctx.strokeRect(portraitX - 4, portraitY - 4, portraitW + 8, portraitH + 8);
    ctx.drawImage(portrait, portraitX, portraitY, portraitW, portraitH);
    ctx.restore();
  }

  ctx.fillStyle = dialogue.speakerAccent;
  ctx.font = '700 18px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
  ctx.fillText(dialogue.title, textX, H - 145);

  ctx.fillStyle = '#fff6da';
  ctx.font = '700 22px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
  ctx.fillText(line.speaker, textX, H - 114);

  ctx.fillStyle = '#f7f0ff';
  ctx.font = '700 18px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
  wrapText(line.text, textX, H - 82, textWidth, 26);

  ctx.fillStyle = '#b7adc9';
  ctx.font = '700 14px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
  ctx.fillText('Space で次へ', W - 154, H - 52);
  ctx.restore();
}

function drawBombEffect() {
  if (!state.bombEffect) {
    return;
  }

  const progress = clamp(1 - state.bombEffect.timer / 0.7, 0, 1);
  const radius = state.bombEffect.radius + progress * 180;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = `rgba(255, 245, 220, ${0.22 * (1 - progress)})`;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = `rgba(137, 244, 255, ${0.8 * (1 - progress)})`;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(state.bombEffect.originX, state.bombEffect.originY, radius, 0, TAU);
  ctx.stroke();

  ctx.fillStyle = `rgba(255, 137, 196, ${0.22 * (1 - progress)})`;
  ctx.beginPath();
  ctx.arc(state.bombEffect.originX, state.bombEffect.originY, radius * 0.55, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function wrapText(text, x, y, maxWidth, lineHeight) {
  const words = text.split('');
  let line = '';
  let cursorY = y;
  for (let i = 0; i < words.length; i += 1) {
    const testLine = line + words[i];
    if (ctx.measureText(testLine).width > maxWidth && line !== '') {
      ctx.fillText(line, x, cursorY);
      line = words[i];
      cursorY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, cursorY);
  }
}

function drawScene() {
  drawBackground();
  drawParticles();
  drawEnemyBullets();
  drawEnemies();
  drawBoss();
  drawPlayerBullets();
  drawPlayer();
  drawBombEffect();
  drawArenaFrame();
  drawHud();
  drawDialogue();

  if (state.scene === 'menu') {
    ctx.save();
    ctx.fillStyle = 'rgba(5, 4, 14, 0.44)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = '700 22px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('START して あそぼう！', W * 0.5, H * 0.5 + 160);
    ctx.textAlign = 'left';
    ctx.restore();
  }
}

function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

function gameLoop() {
  updateGame(1 / 60);
  drawScene();
  requestAnimationFrame(gameLoop);
}

startBtn.addEventListener('click', () => startGame());
restartBtn.addEventListener('click', () => {
  endOverlay.classList.add('hidden');
  startGame();
});

window.addEventListener('keydown', (event) => {
  if (state.scene === 'menu' && event.code === 'Enter') {
    startGame();
  }

  if (state.scene === 'playing' && event.code === 'KeyC' && !event.repeat && !state.dialogue) {
    if (state.bombStock > 0) {
      state.bombQueued = true;
    }
  }

  if (state.scene === 'clear' || state.scene === 'gameover') {
    if (event.code === 'Enter' || event.code === 'Space') {
      startGame();
    }
  }
});

enterMenu();
gameLoop();
