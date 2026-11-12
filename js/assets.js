// Every picture comes from the Ninja Adventure asset pack by Pixel-boy and AAA (CC0). This module loads them
// before anything else runs, so the tiles, characters and monsters can be cut out synchronously.
const TILESETS = ['field', 'floor', 'nature', 'house', 'water', 'relief', 'element', 'dungeon', 'towers', 'floordetail', 'villageabandoned', 'interior', 'interiorfloor', 'wallsimple', 'elements',
  'desert', 'floorb', 'boatbig', 'sail', 'flagred'];
export const CHARS = ['Boy', 'CamouflageGreen', 'CamouflageRed', 'Cat', 'CatBlack', 'CatOrange', 'CatWhite', 'CaveLion', 'Cavegirl', 'Cavegirl2', 'Caveman', 'Caveman2',
  'ChickenBrown', 'ChickenWhite', 'Child', 'CowWhite', 'DemonGreen', 'DemonRed', 'Dog', 'DogBlack', 'DogBlackWhite', 'DogOrange', 'DogYellow', 'DonkeyGrey', 'EggBoy', 'EggGirl', 'Eskimo',
  'FighterRed', 'FighterWhite', 'FishRed', 'FishWhite', 'FishYellow', 'Flam', 'Frog', 'GladiatorBlue', 'GoldStatue', 'GreenPig', 'Hamster', 'HorseBrown', 'Hunter', 'Inspector', 'Knight',
  'KnightGold', 'Lion', 'LionBoy', 'ManGreen', 'MaskFrog', 'MaskGoldRacoon', 'MaskRacoon', 'Master', 'Monk', 'Monk2', 'Monkey', 'MonkeyBlack', 'MonkeyBoxerBlue', 'MonkeyBoxerRed',
  'MonkeyBrown', 'MonkeyGrey', 'NinjaBlue', 'NinjaBlue2', 'NinjaBomb', 'NinjaDark', 'NinjaEskimo', 'NinjaFire', 'NinjaGray', 'NinjaGreen', 'NinjaLeaf', 'NinjaMageBlack', 'NinjaMageOrange',
  'NinjaMasked', 'NinjaRed', 'NinjaRed2', 'NinjaThunder', 'NinjaWater', 'NinjaYellow', 'Noble', 'OldMan', 'OldMan2', 'OldMan3', 'OldWoman', 'ParrotBlue', 'ParrotRed', 'Pig', 'PigPink',
  'Princess', 'Racoon', 'RedGladiator', 'RedNinja3', 'Samurai', 'SamuraiBlue', 'Shaman', 'ShamanLion', 'Skeleton', 'SkeletonDemon', 'SorcererBlack', 'SorcererOrange', 'Spirit', 'Statue',
  'Sultan', 'Sultan2', 'Tengu', 'Tengu2', 'Vampire', 'Village6', 'Villager', 'Villager2', 'Villager3', 'Villager4', 'Villager5', 'Villager6', 'WildBoar', 'Woman'];
export const MONS = ['Axolot', 'AxolotBlue', 'Bamboo', 'BambooYellow', 'Bear', 'BlueBat', 'Butterfly', 'ButterflyBlue', 'Cyclope', 'Cyclope2', 'Dragon', 'DragonYellow',
  'Eye', 'Eye2', 'Fish', 'FishRed', 'Flam', 'Flam2', 'GoldRacoon', 'GreenOctopus', 'HeartGreen', 'HeartRed', 'KappaGreen', 'KappaRed', 'LanternGreen', 'LanternRed',
  'Mole', 'Mole2', 'Mollusc', 'Mollusc2', 'Mouse', 'MouseBlack', 'Mushroom', 'Mushroom2', 'Octopus', 'Octopus2', 'Owl', 'Owl2', 'Panda', 'Racoon', 'RedOctopus',
  'Skull', 'SkullBlue', 'Slime', 'Slime2', 'Slime3', 'Slime4', 'Snake', 'Snake2', 'Snake3', 'Snake4', 'SpiderRed', 'SpiderYellow', 'Spirit', 'Spirit2', 'YellowsBat',
  'TRex', 'Grey Trex', 'Beast', 'Beast2', 'Larva', 'Larva2', 'Lizard', 'Lizard2', 'Reptile', 'Reptile2'];
export const BOSSES = ['DemonCyclop', 'DemonCyclop2', 'GiantBamboo', 'GiantBamboo2', 'GiantFlam', 'GiantFrog', 'GiantFrog2', 'GiantRacoon', 'GiantRacoonGold', 'GiantRedSamurai', 'GiantBlueSamurai',
  'GiantSlime', 'GiantSlime2', 'GiantSpirit', 'SquidRed', 'SquidGreen', 'TenguRed', 'TenguBlue'];
// the two dragons come in pieces: a head, two kinds of body ring, a tail tip and a wing
export const DRAGON_PARTS = ['Head', 'Body1', 'Body2', 'BodyEnd', 'Wing'];
// battle effects from the pack's FX folder: name -> [frame width, frame count]
export const FX = {
  explosion: [40, 9], flame: [25, 8], ice: [32, 10], thunder: [20, 8], pillar: [30, 9], spike: [54, 10], leaf: [30, 8], spirit: [32, 5],
  boost: [53, 8], spark: [27, 10], smoke: [32, 6], cutx: [32, 4], shield: [24, 6], rock: [30, 14], circle: [32, 4],
};
export const FACES = ['Boy', 'OldMan', 'OldWoman', 'Princess', 'DogBlackWhite', 'MonkeyBrown', 'ParrotRed'];

const load = (src) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => { console.warn('missing picture', src); res(null); }; im.src = src; });
const pairs = [
  ...TILESETS.map((n) => ['t:' + n, 'assets/tiles/' + n + '.png']),
  ...CHARS.map((n) => ['c:' + n, 'assets/chars/' + n + '.png']),
  ...MONS.map((n) => ['m:' + n, 'assets/mon/' + n + '.png']),
  ...BOSSES.map((n) => ['b:' + n, 'assets/boss/' + n + '_idle.png']),
  ...['DragonBlue', 'DragonGreen'].flatMap((d) => DRAGON_PARTS.map((p) => ['d:' + d + p, 'assets/boss/' + d + '_' + p + '.png'])),
  ...Object.keys(FX).map((n) => ['x:' + n, 'assets/fx/' + n + '.png']),
  ...FACES.map((n) => ['f:' + n, 'assets/face/' + n + '.png']),
  ['i:chest', 'assets/items/LittleTreasureChest.png'],
];
const got = await Promise.all(pairs.map(([, src]) => load(src)));
export const IMG = Object.fromEntries(pairs.map(([k], i) => [k, got[i]]));
export const tileset = (n) => IMG['t:' + n];
// small pictures that are only needed now and then (item icons, portraits in the bestiary) load on first use;
// until they arrive the caller simply draws nothing
const lazy = new Map();
export function lazyImg(src) {
  if (!lazy.has(src)) {
    const im = new Image(); im.ok = false; im.onload = () => { im.ok = true; }; im.onerror = () => { im.bad = true; }; im.src = src; lazy.set(src, im);
  }
  const im = lazy.get(src);
  return im.ok ? im : null;
}
