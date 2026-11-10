// Every picture comes from the Ninja Adventure asset pack by Pixel-boy and AAA (CC0). This module loads them
// before anything else runs, so the tiles, characters and monsters can be cut out synchronously.
const TILESETS = ['field', 'floor', 'nature', 'house', 'water', 'relief', 'element', 'dungeon', 'towers', 'floordetail', 'villageabandoned', 'interior', 'interiorfloor', 'wallsimple', 'elements'];
export const CHARS = ['Boy', 'OldMan', 'OldMan2', 'OldMan3', 'OldWoman', 'Woman', 'Child', 'Princess', 'Villager', 'Villager2', 'Villager3', 'Villager4', 'Villager5', 'Villager6',
  'Monk', 'Monk2', 'Master', 'Hunter', 'Samurai', 'SamuraiBlue', 'NinjaDark', 'NinjaMasked', 'Noble', 'Caveman', 'Caveman2', 'Cavegirl', 'Cavegirl2', 'Shaman',
  'DemonGreen', 'GreenPig', 'Knight', 'Inspector', 'Sultan', 'Eskimo', 'MaskRacoon', 'Spirit', 'Statue', 'GoldStatue', 'Vampire', 'Skeleton',
  'DogBlackWhite', 'MonkeyBrown', 'ParrotRed', 'ParrotBlue', 'CatOrange', 'ChickenWhite', 'Frog', 'PigPink', 'DogYellow', 'HorseBrown'];
export const MONS = ['Axolot', 'AxolotBlue', 'Bamboo', 'BambooYellow', 'Bear', 'BlueBat', 'Butterfly', 'ButterflyBlue', 'Cyclope', 'Cyclope2', 'Dragon', 'DragonYellow',
  'Eye', 'Eye2', 'Fish', 'FishRed', 'Flam', 'Flam2', 'GoldRacoon', 'GreenOctopus', 'HeartGreen', 'HeartRed', 'KappaGreen', 'KappaRed', 'LanternGreen', 'LanternRed',
  'Mole', 'Mole2', 'Mollusc', 'Mollusc2', 'Mouse', 'MouseBlack', 'Mushroom', 'Mushroom2', 'Octopus', 'Octopus2', 'Owl', 'Owl2', 'Panda', 'Racoon', 'RedOctopus',
  'Skull', 'SkullBlue', 'Slime', 'Slime2', 'Slime3', 'Slime4', 'Snake', 'Snake2', 'Snake3', 'Snake4', 'SpiderRed', 'SpiderYellow', 'Spirit', 'Spirit2', 'YellowsBat'];
export const BOSSES = ['DemonCyclop', 'DemonCyclop2', 'GiantBamboo', 'GiantFlam', 'GiantFrog2', 'GiantRacoon', 'GiantRacoonGold', 'GiantRedSamurai', 'GiantBlueSamurai',
  'GiantSlime', 'GiantSpirit', 'SquidRed', 'SquidGreen', 'TenguRed', 'TenguBlue'];
export const FACES = ['Boy', 'OldMan', 'OldWoman', 'Princess', 'DogBlackWhite', 'MonkeyBrown', 'ParrotRed', 'Master', 'Hunter', 'Shaman', 'Noble', 'Monk', 'Caveman', 'DemonGreen', 'Woman', 'Child', 'Villager', 'Villager2', 'Villager3', 'Villager4', 'Villager5', 'Cavegirl', 'NinjaDark', 'Spirit', 'Samurai', 'SamuraiBlue'];

const load = (src) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => { console.warn('missing picture', src); res(null); }; im.src = src; });
const pairs = [
  ...TILESETS.map((n) => ['t:' + n, 'assets/tiles/' + n + '.png']),
  ...CHARS.map((n) => ['c:' + n, 'assets/chars/' + n + '.png']),
  ...MONS.map((n) => ['m:' + n, 'assets/mon/' + n + '.png']),
  ...BOSSES.map((n) => ['b:' + n, 'assets/boss/' + n + '_idle.png']),
  ...FACES.map((n) => ['f:' + n, 'assets/face/' + n + '.png']),
];
const got = await Promise.all(pairs.map(([, src]) => load(src)));
export const IMG = Object.fromEntries(pairs.map(([k], i) => [k, got[i]]));
export const tileset = (n) => IMG['t:' + n];
