// Language switching. Text is written in place as L('中文', 'English'); data tables get
// getters so .name and .desc follow the current language.

function initial() {
  try { const v = localStorage.getItem('peachisle-lang'); if (v === 'zh' || v === 'en') return v; } catch (e) { /* no storage */ }
  try { return /^zh/i.test(navigator.language) ? 'zh' : 'en'; } catch (e) { return 'zh'; }
}
export let LANG = initial();
const hooks = [];
export function onLang(f) { hooks.push(f); }
export function setLang(l) {
  LANG = l;
  try { localStorage.setItem('peachisle-lang', l); } catch (e) { /* private mode */ }
  try { document.documentElement.lang = l === 'en' ? 'en' : 'zh-Hant'; } catch (e) { /* node */ }
  for (const f of hooks) f(l);
}
export const isEn = () => LANG === 'en';
export const L = (zh, en) => (LANG === 'en' ? en : zh);

// table: { id: { name, desc, ... } }; en: { id: [name, desc] } or { id: { name, desc } }
export function localize(table, en, fields = ['name', 'desc']) {
  for (const [id, tr] of Object.entries(en)) {
    const o = table[id];
    if (!o) continue;
    const vals = Array.isArray(tr) ? Object.fromEntries(fields.map((f, i) => [f, tr[i]])) : tr;
    for (const [f, v] of Object.entries(vals)) {
      if (v === undefined) continue;
      const zh = o[f];
      Object.defineProperty(o, f, { get: () => (LANG === 'en' ? v : zh), enumerable: true, configurable: true });
    }
  }
}

// speaker names in dialogue
const NAMES = {
  桃丸: 'Momomaru', 小白: 'Shiro', 棗: 'Natsume', 雉: 'Kiji', 茜: 'Akane', 剛鬼: 'Goki', 梅奶奶: 'Granny Ume', 竹爺爺: 'Grandpa Take', 村長: 'Village Head',
  村人: 'Villager', 戴鬼面的人: 'Masked Raider', 雜貨鋪: 'Store', 神社的和尚: 'Shrine Monk', 農夫: 'Farmer', 小女孩: 'Little Girl', 源治的妻子: "Genji's Widow",
  守門的: 'Gatekeeper', 村裡的年輕人: 'Village Lad', 修橋的人: 'Bridge Mender', 白狗: 'White Dog', 森之怨靈: 'Forest Grudge', 母猴: 'She-Monkey', 小猴子: 'Little Monkey',
  狸大王: 'Tanuki King', 旅店老闆娘: 'Innkeeper', 道具屋: 'Tool Shop', 老船長: 'Old Captain', 漁夫: 'Fisherman', 老水手: 'Old Sailor', 港口的小孩: 'Harbour Kid',
  黑鐵家的武士: 'Kurogane Samurai', 雉雞: 'Pheasant', 赤天狗: 'Red Tengu', 海坊主: 'Umibozu', 鬼的長老: 'Oni Elder', 鬼的小孩: 'Oni Child', 鬼的母親: 'Oni Mother',
  鬼的男人: 'Oni Man', 鬼的商人: 'Oni Trader', 青鬼大將: 'Blue General', 黑鐵大將: 'Lord Kurogane', '？？？': '???',
  店員: 'Clerk', 玄冥: 'Genmei', 影丸: 'Kagemaru', 焰丸: 'Homuramaru', 汐音: 'Shione', 隱士: 'Hermit', 焰之鄉的長老: 'Homura Elder', 鍛冶師: 'Smith', 鬼的雜貨: 'Oni Store',
  溫泉的婆婆: 'Bath Keeper', 棗的媽媽: "Natsume's Mother", 額頭有疤的鬼: 'Scarred Oni', 炎王: 'Flame King', 雉的媽媽: "Kiji's Mother", 烏天狗: 'Crow Tengu', 老天狗: 'Old Tengu',
  茶屋的和尚: 'Teahouse Monk', 小烏天狗: 'Crow Tengu Chick', 青天狗: 'Blue Tengu', 漂流的老人: 'Castaway', '海龍 蒼淵': 'Soen the Sea Dragon', 鯛魚侍女: 'Bream Maid',
  黃魚: 'Yellowfish', 白魚: 'Whitefish', 老龜: 'Old Turtle', 水忍: 'Water Ninja', 龍宮的侍女: 'Palace Maid', 師範: 'Master', 道場的鬼: 'Dojo Oni', 鬼的姑娘: 'Oni Girl',
  搗麻糬的鬼: 'Mochi Oni', 撈金魚的小孩: 'Koi Kid', 祭典的攤販: 'Festival Stall', 神社的小和尚: 'Young Monk', 常闇之龍: 'Dragon of Endless Night',
};
export const speaker = (n) => (n && LANG === 'en' ? NAMES[n] || n : n);
