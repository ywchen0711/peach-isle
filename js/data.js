// 桃源鬼島記 Peachling and the Oni Isle: the party, their gear, dumplings, and the creatures on the way.
// Enemy stats are fixed and never scale with the party.
import { localize } from './i18n.js';

// special ids are fixed names the battle code knows: peachblade (one foe), howl, monkeyrain (all foes), featherwind (heal all)
export const HEROES = {
  momo:    { name: '桃丸', title: '桃子裡的孩子', sprite: 'momo', base: { hp: 44, mp: 8, str: 12, def: 9, int: 6, agi: 10 }, grow: { hp: 11, mp: 1.8, str: 2.6, def: 1.9, int: 1.1, agi: 1.5 }, equip: { weapon: 'woodsword', armor: 'kimono', acc: null }, kinds: ['sword', 'light'], special: 'peachblade' },
  shiro:   { name: '小白', title: '獵人的狗', sprite: 'shiro', base: { hp: 40, mp: 6, str: 11, def: 7, int: 4, agi: 15 }, grow: { hp: 9, mp: 1.2, str: 2.4, def: 1.5, int: 0.8, agi: 2.2 }, equip: { weapon: 'fang', armor: 'collar', acc: null }, kinds: ['fang', 'beast'], special: 'howl' },
  natsume: { name: '棗', title: '山裡的猴子', sprite: 'natsume', base: { hp: 38, mp: 10, str: 9, def: 7, int: 8, agi: 13 }, grow: { hp: 8, mp: 2.2, str: 1.9, def: 1.4, int: 1.6, agi: 1.9 }, equip: { weapon: 'stick', armor: 'vest', acc: null }, kinds: ['staff', 'beast'], special: 'monkeyrain' },
  kiji:    { name: '雉', title: '不敢飛的雉雞', sprite: 'kiji', base: { hp: 32, mp: 18, str: 7, def: 6, int: 13, agi: 12 }, grow: { hp: 7, mp: 3.8, str: 1.3, def: 1.2, int: 2.6, agi: 1.7 }, equip: { weapon: 'talon', armor: 'plume', acc: null }, kinds: ['claw', 'beast'], special: 'featherwind' },
};
// what each learns as they grow
export const LEARN = {
  momo: [[3, 'peachcut'], [7, 'guard'], [12, 'blossom']],
  shiro: [[1, 'bark'], [5, 'bite'], [10, 'sniffout']],
  natsume: [[1, 'pebble'], [4, 'swipe'], [8, 'mischief'], [13, 'fruitrain']],
  kiji: [[1, 'heal'], [1, 'gust'], [3, 'cure'], [6, 'shield'], [9, 'healall'], [11, 'galeforce'], [14, 'revive']],
};
export const expFor = (L) => Math.floor(10 * Math.pow(L - 1, 2) + 12 * (L - 1));

export const ITEMS = {
  // dumplings, cooked at a hearth (see RECIPES)
  kibi:     { name: '黍糰子', price: 0, use: 'heal', power: 50, target: 'ally', desc: '奶奶的味道。回復 50 HP' },
  honey:    { name: '蜂蜜糰子', price: 0, use: 'heal', power: 160, target: 'ally', desc: '甜甜的。回復 160 HP' },
  yomogi:   { name: '艾草糰子', price: 0, use: 'mp', power: 20, target: 'ally', desc: '回復 20 點氣' },
  sakura:   { name: '桃花糰子', price: 0, use: 'revive', power: 0.5, target: 'dead', desc: '讓倒下的同伴重新站起來' },
  sanshoku: { name: '三色糰子', price: 0, use: 'full', target: 'ally', desc: 'HP 與氣全滿' },
  // what goes into them
  millet:   { name: '黍米', price: 6, ingredient: true, desc: '做糰子的黍米' },
  honeycomb:{ name: '蜂巢', price: 30, ingredient: true, desc: '金黃的蜂蜜' },
  mugwort:  { name: '艾草', price: 0, ingredient: true, desc: '香香的野草' },
  petal:    { name: '桃花瓣', price: 0, ingredient: true, desc: '不會凋謝的桃花瓣' },
  // other things
  antidote: { name: '解毒草', price: 10, use: 'cure', target: 'ally', desc: '解除中毒' },
  smoke:    { name: '煙玉', price: 25, use: 'escape', target: 'none', desc: '戰鬥中必定逃跑' },
  // Momomaru's swords
  woodsword: { name: '木刀', price: 0, slot: 'weapon', kind: 'sword', atk: 5 },
  ironsword: { name: '鐵刀', price: 90, slot: 'weapon', kind: 'sword', atk: 11 },
  steelsword:{ name: '玉鋼刀', price: 300, slot: 'weapon', kind: 'sword', atk: 20 },
  peachsword:{ name: '桃木神刀', price: 0, slot: 'weapon', kind: 'sword', atk: 32, bonus: { int: 6 } },
  // Shiro's fangs
  fang:      { name: '乳牙', price: 0, slot: 'weapon', kind: 'fang', atk: 5 },
  ironfang:  { name: '鐵牙套', price: 100, slot: 'weapon', kind: 'fang', atk: 12, bonus: { agi: 2 } },
  wolffang:  { name: '狼王之牙', price: 0, slot: 'weapon', kind: 'fang', atk: 24, bonus: { agi: 4 } },
  // Natsume's sticks
  stick:     { name: '樹枝', price: 0, slot: 'weapon', kind: 'staff', atk: 4, bonus: { int: 1 } },
  bostaff:   { name: '棍', price: 110, slot: 'weapon', kind: 'staff', atk: 10, bonus: { int: 3 } },
  ruyi:      { name: '如意棒', price: 0, slot: 'weapon', kind: 'staff', atk: 22, bonus: { int: 6 } },
  // Kiji's talons
  talon:     { name: '小爪', price: 0, slot: 'weapon', kind: 'claw', atk: 3, bonus: { int: 2 } },
  steeltalon:{ name: '鋼爪', price: 120, slot: 'weapon', kind: 'claw', atk: 8, bonus: { int: 5 } },
  phoenix:   { name: '鳳凰爪', price: 0, slot: 'weapon', kind: 'claw', atk: 14, bonus: { int: 12 } },
  // what they wear
  kimono:    { name: '布衣', price: 0, slot: 'armor', kind: 'light', def: 2 },
  hakama:    { name: '武者袴', price: 80, slot: 'armor', kind: 'light', def: 7 },
  armor:     { name: '鬼皮胴', price: 260, slot: 'armor', kind: 'light', def: 14 },
  collar:    { name: '紅項圈', price: 0, slot: 'armor', kind: 'beast', def: 2 },
  vest:      { name: '小背心', price: 0, slot: 'armor', kind: 'beast', def: 2 },
  plume:     { name: '尾羽', price: 0, slot: 'armor', kind: 'beast', def: 1, bonus: { int: 1 } },
  furcoat:   { name: '獸皮護甲', price: 90, slot: 'armor', kind: 'beast', def: 6 },
  charmcoat: { name: '御守護甲', price: 240, slot: 'armor', kind: 'beast', def: 12, bonus: { int: 2 } },
  // charms
  powerband: { name: '力之頭巾', price: 0, slot: 'acc', kind: 'any', bonus: { str: 6 } },
  omamori:   { name: '平安御守', price: 0, slot: 'acc', kind: 'any', bonus: { def: 6 } },
  geta:      { name: '天狗木屐', price: 0, slot: 'acc', kind: 'any', bonus: { agi: 7 } },
  bell:      { name: '鈴鐺', price: 0, slot: 'acc', kind: 'any', bonus: { int: 7 } },
  // keys
  flute:     { name: '獵人的笛子', price: 0, key: true, desc: '小白的主人留下的竹笛。' },
  peachseal: { name: '桃之印', price: 0, key: true, desc: '包著桃丸的桃核上刻著的印記。' },
  boatpass:  { name: '渡船證', price: 0, key: true, desc: '潮見港的船長給的通行證。' },
  oni_mask:  { name: '鬼面具', price: 0, key: true, desc: '襲擊村子的「鬼」留下的面具。裡面寫著黑鐵家的家紋。' },
  sprout:    { name: '桃樹之心', price: 0, key: true, desc: '鬼之島神木的最後一顆種子。' },
};
// cooking at a hearth: what one dumpling takes
export const RECIPES = [
  ['kibi', { millet: 1 }],
  ['yomogi', { millet: 1, mugwort: 1 }],
  ['honey', { millet: 1, honeycomb: 1 }],
  ['sakura', { millet: 1, petal: 1 }],
  ['sanshoku', { millet: 1, honeycomb: 1, mugwort: 1, petal: 1 }],
];

// skills: magic of a sort; 氣 is what they cost
export const SPELLS = {
  peachcut:  { name: '桃花斬', mp: 3, type: 'dmg', el: 'holy', power: 18, k: 1.2, target: 'enemy', fx: 'holy' },
  blossom:   { name: '落英繽紛', mp: 12, type: 'dmg', el: 'holy', power: 30, k: 1.4, target: 'enemies', fx: 'holy' },
  guard:     { name: '定心', mp: 4, type: 'buff', stat: 'def', target: 'self', fx: 'buff' },
  bark:      { name: '大吠', mp: 2, type: 'sleep', target: 'enemies', fx: 'sleep' },
  bite:      { name: '撕咬', mp: 4, type: 'dmg', el: 'none', power: 22, k: 1.0, target: 'enemy', fx: 'fire' },
  sniffout:  { name: '嗅出破綻', mp: 6, type: 'buff', stat: 'str', target: 'allies', fx: 'buff' },
  pebble:    { name: '丟石子', mp: 2, type: 'dmg', el: 'none', power: 12, k: 1.0, target: 'enemy', fx: 'ice' },
  swipe:     { name: '偷襲', mp: 4, type: 'dmg', el: 'none', power: 18, k: 1.0, target: 'enemies', fx: 'bolt' },
  mischief:  { name: '搗蛋', mp: 5, type: 'sleep', target: 'enemies', fx: 'sleep' },
  fruitrain: { name: '果實雨', mp: 12, type: 'heal', power: 40, k: 1.4, target: 'allies', fx: 'heal' },
  heal:      { name: '癒之歌', mp: 3, type: 'heal', power: 32, k: 2.0, target: 'ally', fx: 'heal' },
  gust:      { name: '風切', mp: 3, type: 'dmg', el: 'wind', power: 16, k: 1.3, target: 'enemy', fx: 'ice' },
  cure:      { name: '淨羽', mp: 2, type: 'cure', target: 'ally', fx: 'heal' },
  shield:    { name: '羽之帳', mp: 5, type: 'buff', stat: 'def', target: 'allies', fx: 'buff' },
  healall:   { name: '晨之歌', mp: 10, type: 'heal', power: 26, k: 1.6, target: 'allies', fx: 'heal' },
  galeforce: { name: '天狗風', mp: 12, type: 'dmg', el: 'wind', power: 32, k: 1.4, target: 'enemies', fx: 'bolt' },
  revive:    { name: '喚醒之鳴', mp: 15, type: 'revive', target: 'dead', fx: 'heal' },
};
export const SPECIALS = {
  peachblade:  { name: '桃源一閃', desc: '對一個敵人造成巨大傷害', target: 'enemy' },
  howl:        { name: '月下長嚎', desc: '撲向所有敵人', target: 'enemies' },
  monkeyrain:  { name: '百猿亂舞', desc: '一群猴子圍攻所有敵人', target: 'enemies' },
  featherwind: { name: '千羽之風', desc: '全體回復並解除異常', target: 'allies' },
};

// art: a sheet from the pack, or 'boss:' and a boss strip; oni can be talked out of fighting
export const ENEMIES = {
  // the fields around 黍之里
  slime:    { name: '黏黏', art: 'Slime', hp: 22, atk: 10, def: 3, int: 3, agi: 7, exp: 6, gold: 4, drop: ['millet', 0.3] },
  mouse:    { name: '偷米鼠', art: 'Mouse', hp: 18, atk: 11, def: 2, int: 2, agi: 15, exp: 7, gold: 5, drop: ['millet', 0.4] },
  butterfly:{ name: '鱗粉蝶', art: 'Butterfly', hp: 24, atk: 10, def: 3, int: 8, agi: 13, exp: 8, gold: 5, acts: [['atk', 3], ['spore', 1]] },
  snake:    { name: '草蛇', art: 'Snake', hp: 30, atk: 13, def: 5, int: 4, agi: 10, exp: 9, gold: 6, acts: [['atk', 3], ['spore', 1]], drop: ['antidote', 0.2] },
  // 白牙森林
  mushroom: { name: '毒蕈', art: 'Mushroom', hp: 44, atk: 16, def: 8, int: 8, agi: 6, exp: 13, gold: 9, acts: [['atk', 3], ['spore', 1]], drop: ['mugwort', 0.25] },
  bamboo:   { name: '竹妖', art: 'Bamboo', hp: 50, atk: 18, def: 12, int: 4, agi: 8, exp: 14, gold: 10 },
  lantern:  { name: '提燈妖', art: 'LanternRed', hp: 46, atk: 14, def: 6, int: 16, agi: 11, exp: 15, gold: 11, undead: true, weak: 'holy', acts: [['atk', 2], ['ember', 2]] },
  forestking:{ name: '森之怨靈', art: 'boss:GiantSpirit', boss: true, hp: 560, atk: 24, def: 12, int: 18, agi: 10, exp: 220, gold: 300, undead: true, weak: 'holy', acts: [['atk', 3], ['ember', 2], ['mist', 1]] },
  // 猿啼山
  bat:      { name: '山蝙蝠', art: 'BlueBat', hp: 60, atk: 22, def: 9, int: 6, agi: 19, exp: 18, gold: 12, acts: [['atk', 3], ['drain', 1]] },
  mole:     { name: '土龍', art: 'Mole', hp: 80, atk: 24, def: 16, int: 4, agi: 7, exp: 20, gold: 14, drop: ['honeycomb', 0.15] },
  racoon:   { name: '小狸', art: 'Racoon', hp: 70, atk: 22, def: 11, int: 12, agi: 14, exp: 20, gold: 16, acts: [['atk', 3], ['mist', 1]], drop: ['honeycomb', 0.2] },
  bear:     { name: '山熊', art: 'Bear', hp: 120, atk: 30, def: 14, int: 4, agi: 8, exp: 28, gold: 18, drop: ['honeycomb', 0.3] },
  tanuki:   { name: '狸大王', art: 'boss:GiantRacoon', boss: true, hp: 1300, atk: 34, def: 18, int: 16, agi: 10, exp: 400, gold: 500, acts: [['atk', 3], ['twin', 2], ['mist', 1], ['harden', 1]] },
  // 天狗崖 and the coast
  owl:      { name: '夜梟', art: 'Owl', hp: 110, atk: 32, def: 16, int: 20, agi: 18, exp: 34, gold: 22, acts: [['atk', 3], ['gale', 1]] },
  kappa:    { name: '河童', art: 'KappaGreen', hp: 140, atk: 36, def: 22, int: 12, agi: 12, exp: 38, gold: 26, acts: [['atk', 3], ['bubble', 1]], drop: ['honeycomb', 0.12] },
  crab:     { name: '石蟹', art: 'Mollusc', hp: 160, atk: 34, def: 30, int: 6, agi: 6, exp: 38, gold: 24, weak: 'wind' },
  tengu:    { name: '赤天狗', art: 'boss:TenguRed', boss: true, hp: 2000, atk: 42, def: 22, int: 26, agi: 20, exp: 650, gold: 700, acts: [['atk', 3], ['twin', 2], ['gale', 2], ['harden', 1]] },
  squid:    { name: '海坊主', art: 'boss:SquidRed', boss: true, hp: 2300, atk: 44, def: 24, int: 24, agi: 12, exp: 700, gold: 600, acts: [['atk', 2], ['twin', 1], ['wave', 2], ['ink', 1]] },
  // 鬼之島
  oni:      { name: '鬼兵', art: 'Cyclope', oni: true, hp: 230, atk: 48, def: 28, int: 10, agi: 12, exp: 60, gold: 0, acts: [['atk', 3], ['twin', 1]] },
  onimage:  { name: '鬼巫女', art: 'Cyclope2', oni: true, hp: 190, atk: 36, def: 22, int: 30, agi: 16, exp: 60, gold: 0, acts: [['atk', 1], ['ember', 2], ['mist', 1]] },
  goki:     { name: '鬼將 剛鬼', art: 'boss:DemonCyclop', boss: true, oni: true, hp: 2800, atk: 50, def: 28, int: 18, agi: 14, exp: 800, gold: 0, acts: [['atk', 3], ['twin', 2], ['quake', 1]] },
  // 黑鐵砦
  ninja:    { name: '黑鐵忍者', art: 'Skull', hp: 260, atk: 54, def: 30, int: 20, agi: 26, exp: 80, gold: 50, acts: [['atk', 3], ['twin', 1], ['ember', 1]], drop: ['honeycomb', 0.15] },
  spider:   { name: '機關蜘蛛', art: 'SpiderRed', hp: 300, atk: 52, def: 38, int: 10, agi: 16, exp: 82, gold: 52, acts: [['atk', 3], ['spore', 1]] },
  flame:    { name: '鬼火', art: 'Flam', hp: 240, atk: 40, def: 24, int: 34, agi: 18, exp: 84, gold: 50, undead: true, weak: 'water', acts: [['atk', 1], ['ember', 2]] },
  samurai:  { name: '青鬼大將', art: 'boss:GiantBlueSamurai', boss: true, hp: 2700, atk: 52, def: 32, int: 22, agi: 18, exp: 1000, gold: 900, acts: [['atk', 3], ['twin', 2], ['gale', 1], ['harden', 1]] },
  kurogane: { name: '黑鐵大將', art: 'boss:GiantRedSamurai', boss: true, hp: 3500, atk: 54, def: 34, int: 26, agi: 20, exp: 0, gold: 0, acts: [['atk', 3], ['twin', 2], ['quake', 1], ['ember', 1], ['drain', 1]] },
};
// monster techniques; rules.js knows kurogane's
export const TECHS = {
  spore:  { name: '毒粉', kind: 'status', status: 'poison', target: 'one', fx: 'spore' },
  ember:  { name: '鬼火', kind: 'magic', power: 14, k: 1.0, el: 'fire', target: 'one', fx: 'fire' },
  drain:  { name: '吸血', kind: 'drain', power: 1.0, target: 'one', fx: 'drain' },
  twin:   { name: '連擊', kind: 'twin', target: 'one', fx: 'slash' },
  bubble: { name: '水砲', kind: 'magic', power: 18, k: 0.7, el: 'water', target: 'all', fx: 'bubble' },
  harden: { name: '鐵壁', kind: 'buff', stat: 'def', target: 'self', fx: 'buff' },
  wave:   { name: '大浪', kind: 'magic', power: 28, k: 0.8, el: 'water', target: 'all', fx: 'bubble' },
  gale:   { name: '旋風', kind: 'magic', power: 30, k: 0.8, el: 'wind', target: 'all', fx: 'bolt' },
  mist:   { name: '幻術', kind: 'status', status: 'sleep', target: 'all', fx: 'sleep' },
  ink:    { name: '墨汁', kind: 'status', status: 'sleep', target: 'all', fx: 'abyss' },
  quake:  { name: '地裂', kind: 'magic', power: 34, k: 1.0, el: 'none', target: 'all', fx: 'abyss' },
};
// random encounters on the world map, by zone
export const GROUPS = {
  home: [[4, ['slime', 'slime']], [3, ['mouse']], [3, ['slime', 'mouse']], [2, ['butterfly']], [2, ['snake']], [1, ['mouse', 'mouse', 'slime']]],
  hills: [[3, ['bat', 'racoon']], [3, ['mole']], [2, ['racoon', 'racoon']], [1, ['bear']]],
  coast: [[3, ['kappa']], [3, ['crab']], [2, ['owl', 'kappa']], [1, ['crab', 'crab']]],
};
// the visible monsters in dungeons each carry their own group
export const TROOPS = {
  f1: ['mushroom', 'mushroom'], f2: ['bamboo'], f3: ['lantern', 'mushroom'], f4: ['bamboo', 'lantern'],
  m1: ['bat', 'bat'], m2: ['mole', 'racoon'], m3: ['bear'], m4: ['racoon', 'racoon', 'bat'],
  t1: ['owl'], t2: ['owl', 'owl'], t3: ['kappa', 'owl'],
  o1: ['oni'], o2: ['onimage', 'oni'], o3: ['oni', 'oni'],
  k1: ['ninja'], k2: ['spider', 'ninja'], k3: ['flame', 'flame'], k4: ['ninja', 'ninja'],
  boss1: ['forestking'], boss2: ['tanuki'], boss3: ['tengu'], boss4: ['squid'], boss5: ['goki'], boss6: ['samurai'], boss7: ['kurogane'],
};
export const SHOPS = {
  kibi: ['millet', 'honeycomb', 'antidote', 'smoke', 'ironsword', 'ironfang', 'hakama', 'furcoat'],
  port: ['millet', 'honeycomb', 'antidote', 'smoke', 'ironsword', 'ironfang', 'bostaff', 'steeltalon', 'hakama', 'furcoat'],
  isle: ['millet', 'honeycomb', 'antidote', 'smoke', 'steelsword', 'bostaff', 'steeltalon', 'armor', 'charmcoat'],
};

// ---------- English ----------
localize(HEROES, { momo: ['Momomaru', 'Child of the Peach'], shiro: ['Shiro', "The Hunter's Dog"], natsume: ['Natsume', 'Mountain Monkey'], kiji: ['Kiji', 'The Pheasant Who Would Not Fly'] }, ['name', 'title']);
localize(ITEMS, {
  kibi: ['Millet Dumpling', "Grandma's recipe. Restores 50 HP"], honey: ['Honey Dumpling', 'Sweet. Restores 160 HP'], yomogi: ['Mugwort Dumpling', 'Restores 20 Ki'],
  sakura: ['Blossom Dumpling', 'Gets a fallen friend back up'], sanshoku: ['Three-Colour Dumpling', 'Fully restores HP and Ki'],
  millet: ['Millet', 'For making dumplings'], honeycomb: ['Honeycomb', 'Golden honey'], mugwort: ['Mugwort', 'A fragrant wild herb'], petal: ['Peach Petal', 'A peach petal that never wilts'],
  antidote: ['Antidote Herb', 'Cures poison'], smoke: ['Smoke Ball', 'Always escape a battle'],
  woodsword: ['Wooden Sword'], ironsword: ['Iron Sword'], steelsword: ['Tamahagane Sword'], peachsword: ['Sacred Peachwood Sword'],
  fang: ['Puppy Teeth'], ironfang: ['Iron Fang Guard'], wolffang: ['Wolf King Fang'], stick: ['Twig'], bostaff: ['Bo Staff'], ruyi: ['Wish-Granting Staff'],
  talon: ['Little Talons'], steeltalon: ['Steel Talons'], phoenix: ['Phoenix Talons'],
  kimono: ['Cotton Kimono'], hakama: ['Warrior Hakama'], armor: ['Oni-Hide Cuirass'], collar: ['Red Collar'], vest: ['Little Vest'], plume: ['Tail Feathers'],
  furcoat: ['Hide Guard'], charmcoat: ['Charm Coat'], powerband: ['Headband of Strength'], omamori: ['Safety Charm'], geta: ['Tengu Clogs'], bell: ['Little Bell'],
  flute: ["Hunter's Flute", "The bamboo flute Shiro's master left behind."], peachseal: ['Peach Seal', 'The mark carved on the stone of the peach Momomaru came from.'],
  boatpass: ['Ferry Pass', 'A pass from the captain at Shiomi Harbour.'], oni_mask: ['Oni Mask', 'Left by the "oni" who raided the village. Inside is the crest of House Kurogane.'],
  sprout: ['Heart of the Peach Tree', 'The last seed of the sacred tree of the Oni Isle.'],
});
localize(SPELLS, {
  peachcut: ['Blossom Cut'], blossom: ['Falling Petals'], guard: ['Steady Heart'], bark: ['Big Bark'], bite: ['Bite'], sniffout: ['Sniff Out'],
  pebble: ['Pebble Toss'], swipe: ['Ambush'], mischief: ['Mischief'], fruitrain: ['Fruit Rain'], heal: ['Healing Song'], gust: ['Wind Blade'],
  cure: ['Clean Feather'], shield: ['Feather Veil'], healall: ['Morning Song'], galeforce: ['Tengu Wind'], revive: ['Wake-Up Call'],
});
localize(SPECIALS, {
  peachblade: ['Peach Flash', 'Huge damage to one enemy'], howl: ['Moonlit Howl', 'Leaps at every enemy'],
  monkeyrain: ['Hundred Monkeys', 'A troop of monkeys mobs every enemy'], featherwind: ['Thousand Feathers', 'Heals everyone and cures ailments'],
});
localize(ENEMIES, {
  slime: ['Goo'], mouse: ['Rice Thief'], butterfly: ['Dust Moth'], snake: ['Grass Snake'], mushroom: ['Toadstool'], bamboo: ['Bamboo Imp'], lantern: ['Lantern Ghost'],
  forestking: ['The Grudge of the Forest'], bat: ['Mountain Bat'], mole: ['Mole'], racoon: ['Tanuki Cub'], bear: ['Mountain Bear'], tanuki: ['The Tanuki King'],
  owl: ['Night Owl'], kappa: ['Kappa'], crab: ['Stone Crab'], tengu: ['The Red Tengu'], squid: ['The Umibozu'],
  oni: ['Oni Soldier'], onimage: ['Oni Shrine Maiden'], goki: ['Goki the Oni General'], ninja: ['Kurogane Ninja'], spider: ['Clockwork Spider'], flame: ['Will-o-Wisp'],
  samurai: ['The Blue General'], kurogane: ['Lord Kurogane'],
});
localize(TECHS, {
  spore: ['Poison Dust'], ember: ['Ghost Fire'], drain: ['Drink Blood'], twin: ['Double Hit'], bubble: ['Water Jet'], harden: ['Iron Wall'],
  wave: ['Great Wave'], gale: ['Whirlwind'], mist: ['Illusion'], ink: ['Ink Cloud'], quake: ['Earth Splitter'],
});
