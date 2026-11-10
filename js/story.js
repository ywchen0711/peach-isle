// Story scripts for 桃源鬼島記 Peachling and the Oni Isle. Each one is async and gets E, the toolbox main.js
// hands over. Every line is written as L('中文', 'English').
import { ITEMS, RECIPES, SHOPS } from './data.js';
import { S, count } from './party.js';
import { L } from './i18n.js';

const actor = (E, id, x, y, dir, sprite = id) => E.spawn({ type: 'npc', id: 'a_' + id, sprite, x, y, dir });
const name = (id) => ({ momo: L('桃丸', 'Momomaru'), shiro: L('小白', 'Shiro'), natsume: L('棗', 'Natsume'), kiji: L('雉', 'Kiji') }[id]);
const friends = () => ['shiro', 'natsume', 'kiji'].filter((id) => S.members.some((m) => m.id === id));

export const SCRIPTS = {
  // ---------- generic ----------
  async chest(E, e) {
    if (e.open) { await E.say(null, L('箱子是空的。', 'The box is empty.')); return; }
    e.open = true; S.flags['chest:' + e.id] = true;
    E.sfx('chest');
    E.give(e.item, e.n || 1);
    await E.say(null, L(`找到了${ITEMS[e.item].name}！`, `Found ${ITEMS[e.item].name}!`));
  },
  // the hearth: cook dumplings, share them, rest and write in the travel diary
  async hearth(E) {
    for (;;) {
      const r = await E.ask(null, L('爐火暖暖地燒著。', 'The hearth fire burns warm.'), [L('做糰子', 'Make dumplings'), L('和夥伴分享糰子', 'Share dumplings'), L('休息', 'Rest'), L('寫旅行日記（存檔）', 'Write the diary (save)'), L('離開', 'Leave')]);
      if (r === 0) await cook(E);
      else if (r === 1) await share(E);
      else if (r === 2) { await E.rest(L('大家圍著火打了個盹。傷都好了。', 'Everyone dozed around the fire. All wounds are healed.')); }
      else if (r === 3) { E.save(); E.sfx('save'); await E.say(null, L('把今天的事寫進了日記。（已存檔）', "Today went into the diary. (Saved)")); }
      else return;
    }
  },
  // Shiro's nose: something is buried here
  async dig(E, e) {
    if (e.done) { await E.say(null, L('這裡已經挖過了。', 'This spot has been dug up.')); return; }
    if (!E.has('shiro')) { await E.say(null, L('土好像有被翻過的痕跡……要是有鼻子很靈的夥伴就好了。', 'The soil looks disturbed... if only someone with a good nose were here.')); return; }
    E.sfx('step'); await E.say(name('shiro'), L('（嗅嗅……嗅嗅……汪！）', '(Sniff... sniff... Woof!)'));
    E.sfx('push'); E.shake(6);
    e.done = true; S.flags['dig:' + e.id] = true;
    if (e.item === 'oldkey') { S.flags.forestKey = true; E.sfx('chest'); await E.say(null, L('小白挖出了一把生鏽的竹門鑰匙！', 'Shiro dug up a rusty key to a bamboo gate!')); return; }
    if (e.item === 'secret') {
      S.flags.fortDug = true; E.sfx('gate');
      await E.say(null, L('小白一路往下挖……挖穿了一條從門底下通過的排水溝！', 'Shiro digs and digs... right into a drain that runs under the gate!'));
      await E.reload(); return;
    }
    E.give(e.item); E.sfx('chest');
    await E.say(null, L(`小白挖出了${ITEMS[e.item].name}！`, `Shiro dug up ${ITEMS[e.item].name}!`));
  },
  // Natsume climbs, and the rest hold on to her tail
  async vine(E, e) {
    if (!E.has('natsume')) { await E.say(null, L('岩壁上垂著粗粗的藤蔓。爬上去的話……光靠自己的手可不行。', 'Thick vines hang down the rock face. Climbing them... not with your own two hands.')); return; }
    const up = E.p.y > e.y, [x, y] = up ? e.top : e.bottom;
    await E.say(name('natsume'), up ? L('抓緊我的尾巴！嘿咻、嘿咻──', 'Hold on to my tail! Heave, ho--') : L('下去囉，別往下看！', "Going down. Don't look!"));
    E.sfx('stairs');
    await E.warp(E.mapId(), x, y, up ? 'u' : 'd');
  },
  // Kiji flies across to ring a bell nobody can reach
  async perch(E, e) {
    if (!E.has('kiji')) { await E.say(null, L('一根停鳥用的木樁。對面的鈴鐺，從這裡怎麼也搆不到。', "A bird's perch. The bell on the far side is far out of reach from here.")); return; }
    const bell = E.entById(e.bell);
    if (!bell || S.flags[bell.flag]) { await E.say(name('kiji'), L('那邊的鈴鐺已經響過了喔。', 'That bell has already rung.')); return; }
    await E.say(name('kiji'), L('我、我來！……不要往下看、不要往下看──', "I-I'll go! ...Don't look down, don't look down--"));
    E.sfx('warp'); await E.wait(30);
    bell.swing = true; E.sfx('holy'); await E.wait(40);
    E.sfx('gate'); E.shake(14);
    S.flags[bell.flag] = true;
    await E.say(null, L('叮──鈴鈴！遠處傳來機關轉動的聲音。', 'Ding--a-ling! Far off, some old mechanism creaks into motion.'));
    await E.reload();
  },
  async bellpost(E) { await E.say(null, L('高高的木架上掛著一個鈴鐺。中間隔著深谷，走不過去。', 'A bell hangs high on a wooden frame. A gorge lies between, too wide to cross.')); },

  // ---------- 序: the peach on the river ----------
  async rv_intro(E) {
    E.hideParty(true);
    const ba = actor(E, 'ume', 9, 5, 'd', 'grandma');
    await E.wait(40);
    await E.say(null, L('從前從前，在黍之里的河邊，住著一對善良的老夫婦。', 'Long, long ago, by the river near Kibi Village, there lived a kind old couple.'));
    await E.say(null, L('老爺爺上山砍柴，老奶奶到河邊洗衣服。', 'The old man went up the hill to cut wood, and the old woman went down to the river to wash.'));
    await E.wait(30);
    // a peach floats down the river from the west
    const peach = E.spawn({ type: 'sprite', id: 'peachfloat', x: 0, y: 6, draw: (g, X, Y, f) => { const b = Math.round(Math.sin(f / 10) * 1.5); g.fillStyle = '#f8a8b8'; g.beginPath(); g.arc(X + 8, Y + 6 + b, 8, 0, Math.PI * 2); g.fill(); g.fillStyle = '#f8d0d8'; g.beginPath(); g.arc(X + 5, Y + 3 + b, 3, 0, Math.PI * 2); g.fill(); g.fillStyle = '#e07090'; g.fillRect(X + 8, Y - 1 + b, 1, 12); g.fillStyle = '#58a040'; g.fillRect(X + 9, Y - 4 + b, 5, 3); g.fillRect(X + 4, Y - 3 + b, 4, 2); } });
    for (let i = 0; i < 9 * 16; i += 2) { peach.px = i; await E.wait(1); }
    ba.dir = 'l';
    await E.say(L('梅奶奶', 'Granny Ume'), L('哎呀呀，好大的桃子！從上游一路漂下來的……', 'My, my, what a great big peach! Floating all the way down from upstream...'));
    await E.say(L('梅奶奶', 'Granny Ume'), L('來來，到奶奶這兒來。帶回去給老頭子嚐嚐。', "Come here, come to Granny. I'll take you home for the old man to taste."));
    E.removeEnt(peach); E.sfx('chest');
    await E.wait(20);
    await E.fadeTo('home', 4, 4, 'u');
    await SCRIPTS.hm_birth(E);
  },
  async hm_birth(E) {
    E.hideParty(true);
    const ji = E.ent('grandpa'), ba = E.ent('grandma');
    if (ji) { ji.x = 5; ji.y = 3; ji.px = 80; ji.py = 48; ji.dir = 'l'; }
    if (ba) { ba.x = 3; ba.y = 3; ba.px = 48; ba.py = 48; ba.dir = 'r'; }
    const peach = E.spawn({ type: 'sprite', id: 'peachbig', x: 4, y: 3, draw: (g, X, Y) => { g.fillStyle = '#f8a8b8'; g.beginPath(); g.arc(X + 8, Y + 6, 9, 0, Math.PI * 2); g.fill(); g.fillStyle = '#f8d0d8'; g.beginPath(); g.arc(X + 5, Y + 2, 3, 0, Math.PI * 2); g.fill(); g.fillStyle = '#58a040'; g.fillRect(X + 9, Y - 5, 5, 3); } });
    await E.say(L('竹爺爺', 'Grandpa Take'), L('這麼大的桃子，我活了七十年也沒見過。好，切開來看看……', "Seventy years I've lived and never seen a peach this big. Well then, let's cut it open..."));
    E.sfx('slash'); E.flash('#fff0f4', 30); E.removeEnt(peach);
    await E.wait(30);
    const baby = actor(E, 'baby', 4, 3, 'd', 'momo');
    E.sfx('heal');
    await E.say(null, L('桃子啪地裂開，裡面竟然躺著一個哇哇大哭的男嬰。', 'The peach split open, and inside lay a baby boy, crying at the top of his lungs.'));
    await E.say(L('梅奶奶', 'Granny Ume'), L('老天爺……我們求了一輩子的孩子，祂從河上送來了。', '...Heaven above. The child we prayed for all our lives, sent down the river.'));
    await E.say(L('竹爺爺', 'Grandpa Take'), L('從桃子裡生的，就叫「桃丸」吧。', 'Born from a peach... we shall call him Momomaru.'));
    await E.say(null, L('桃核上刻著一個奇怪的花紋。老奶奶把它收進了神龕。', 'A strange crest was carved on the peach stone. Granny put it away on the house shrine.'));
    await E.wait(30);
    E.removeEnt(baby);
    await E.fadeText(L('──十五年後。', '-- Fifteen years later.'));
    E.hideParty(false);
    await SCRIPTS.hm_morning(E);
  },
  async hm_morning(E) {
    const ji = E.ent('grandpa'), ba = E.ent('grandma');
    if (ji) { ji.x = 6; ji.y = 2; ji.px = 96; ji.py = 32; ji.dir = 'd'; }
    if (ba) { ba.x = 3; ba.y = 3; ba.px = 48; ba.py = 48; ba.dir = 'r'; }
    E.music('home');
    await E.say(L('梅奶奶', 'Granny Ume'), L('桃丸，起來啦。今天要教你做黍糰子喔，到爐灶這兒來。', "Momomaru, up you get. Today I'll teach you millet dumplings. Come over to the hearth."));
    S.flags.awake = true;
  },
  async hm_grandma(E) {
    if (!S.flags.cooked) {
      await E.talk(L('梅奶奶', 'Granny Ume'), L('黍米一份，揉圓了，放進鍋裡蒸。就這麼簡單。', 'One measure of millet, rolled round and steamed in the pot. That is all there is to it.'),
        L('不過啊，要一邊想著吃的人一邊揉，才會好吃喔。來，在爐灶試試看。', 'But you must think of whoever will eat it while you roll it. That is what makes it taste good. Go on, try at the hearth.'));
      return;
    }
    if (!S.flags.raid) { await E.say(L('梅奶奶', 'Granny Ume'), L('做得真好。村長說有事找你，去他家看看吧。他家在村子北邊。', 'Well done. The village head wants to see you. His house is on the north side of the village.')); return; }
    await E.say(L('梅奶奶', 'Granny Ume'), L('……你真的要去鬼之島？傻孩子。奶奶的糰子要帶夠喔。', '...You truly mean to go to the Oni Isle? Silly boy. Take plenty of Granny\'s dumplings.'));
  },
  async hm_grandpa(E) {
    if (!S.flags.raid) { await E.say(L('竹爺爺', 'Grandpa Take'), L('最近夜裡不平靜。說是鬼從海上來，搶村子的糧倉……唉。', 'The nights have not been peaceful. They say oni come from the sea and raid the granaries... ah.')); return; }
    await E.say(L('竹爺爺', 'Grandpa Take'), L('那把木刀是我年輕時削的。你拿去吧。別逞強，打不過就回家。', 'I carved that wooden sword when I was young. Take it. Do not be a hero. If you cannot win, come home.'));
  },
  // ---------- 黍之里 ----------
  async kb_elder(E) {
    if (S.flags.raid) { await E.say(L('村長', 'Village Head'), L('鬼之島在東邊的海上。要渡海，得先到潮見港。路上小心啊，桃丸。', 'The Oni Isle lies in the eastern sea. To cross, you must first reach Shiomi Harbour. Take care on the road, Momomaru.')); return; }
    await E.talk(L('村長', 'Village Head'), L('桃丸，你來得正好。這個月，村子的糧倉已經被搶了三次。', 'Momomaru, good. Three times this month the village granary has been raided.'),
      L('搶的是頭上長角、臉孔通紅的「鬼」。獵人源治為了擋住他們，死在森林裡了。', 'Those who raid it are "oni", horned and red-faced. Genji the hunter died in the forest trying to stop them.'),
      L('再這樣下去，今年冬天村子撐不過去……', 'If this goes on, the village will not last the winter...'));
    await E.say(null, L('就在這時──', 'Just then--'));
    await SCRIPTS.kb_raid(E);
  },
  async kb_raid(E) {
    E.night(); E.music('boss'); E.sfx('encounter'); E.shake(10);
    await E.say(L('村人', 'Villager'), L('鬼來了！鬼又來了──！', 'Oni! The oni are back--!'));
    const r1 = actor(E, 'raider1', 21, 9, 'l', 'NinjaDark'), r2 = actor(E, 'raider2', 23, 10, 'l', 'NinjaDark');
    await E.wait(20);
    await E.say(L('戴鬼面的人', 'Masked Raider'), L('呵呵，米都給我交出來！不然下一次就燒了這個村子！', 'Heh heh. Hand over the rice! Or next time we burn the village down!'));
    const r = await E.battle(['slime', 'mouse'], { bg: 'field', canFlee: false, story: true });
    void r;
    E.sfx('run');
    await E.say(L('戴鬼面的人', 'Masked Raider'), L('嘖，這小鬼還挺能打的……撤！', "Tch, the brat can fight... Fall back!"));
    E.removeEnt(r1); E.removeEnt(r2);
    E.give('oni_mask'); E.sfx('chest');
    await E.say(null, L('其中一個人掉了一張鬼面具。……面具的內側，刻著一個家紋。', 'One of them dropped an oni mask. ...On the inside, someone has carved a family crest.'));
    E.night(null); E.music('village');
    await E.talk(L('桃丸', 'Momomaru'), L('……我要去鬼之島。', "...I'm going to the Oni Isle."), L('去弄清楚他們為什麼要搶東西。要是能讓他們不再來，我就去。', "To find out why they steal. If I can make them stop coming, I'll go."));
    await E.say(L('村長', 'Village Head'), L('……好孩子。往東走，穿過白牙森林，就是去港口的路。', '...Good lad. Head east, past the White Fang Forest, and you will find the road to the harbour.'));
    S.flags.raid = true; S.flags.leftHome = true;
    E.give('kibi', 3); E.give('millet', 3); E.give('peachseal');
    E.sfx('chest');
    await E.say(null, L('奶奶連夜做了糰子塞進包袱。爺爺從神龕取下桃核交給你。\n得到了黍糰子×3、黍米×3、桃之印！', 'Granny made dumplings all night and packed them for you. Grandpa took the peach stone down from the shrine.\nGot 3 Millet Dumplings, 3 Millet and the Peach Seal!'));
  },
  async kb_elderdoor(E) { await E.say(null, L('村長家的門關著。村長站在門口。', "The village head's door is shut. He is standing outside.")); },
  async kb_shopdoor(E) { await E.say(null, L('雜貨鋪的老闆在門口擺攤。', 'The general store keeper has set up a stall out front.')); },
  async kb_shop(E) { await E.say(L('雜貨鋪', 'Store'), L('黍米、蜂巢、還有些防身的東西。看看吧。', 'Millet, honeycomb, a few things to keep you safe. Have a look.')); await E.shop(SHOPS.kibi); },
  async kb_priest(E) { await E.say(L('神社的和尚', 'Shrine Monk'), S.flags.ending ? L('鬼之島的桃花，聽說連海的這一邊都聞得到香味呢。', "They say you can smell the Oni Isle's peach blossoms even on this side of the sea.") : L('傳說海的另一邊有一棵永遠開花的桃樹。十五年前，那邊的花忽然謝了。', 'Legend says across the sea grows a peach tree that blooms forever. Fifteen years ago its flowers suddenly fell.')); },
  async kb_farmer(E) { await E.say(L('農夫', 'Farmer'), S.flags.raid ? L('今年的黍子又被搶走一半。孩子們要餓肚子了……', 'Half of this year\'s millet stolen again. The children will go hungry...') : L('黍子長得好啊。就怕鬼又來。', 'The millet is growing well. If only the oni would stay away.')); },
  async kb_girl(E) { await E.say(L('小女孩', 'Little Girl'), L('桃丸哥哥，鬼真的長角嗎？……可是我昨天看到，有一個鬼在小溪那邊把面具拿下來擦汗耶。', "Momomaru, do oni really have horns? ...Yesterday I saw one by the stream. He took his mask off to wipe his face.")); },
  async kb_wife(E) { await E.say(L('源治的妻子', "Genji's Widow"), S.flags.shiro ? L('小白跟著你啊……那孩子，原本只認我丈夫一個人的。', 'Shiro follows you now... That dog never trusted anyone but my husband.') : L('我丈夫死在森林裡。他的狗……到現在還守在他的墳前，怎麼叫都不回來。', 'My husband died in the forest. His dog... still guards his grave. It will not come home no matter how I call.')); },
  async kb_guard(E) { await E.say(L('守門的', 'Gatekeeper'), L('往東就是大路。路上有野獸，小心點。', 'East is the high road. There are beasts about, so mind yourself.')); },
  async kb_lad(E) { await E.say(L('村裡的年輕人', 'Village Lad'), L('鬼來的那晚，我聞到他們身上有鐵和魚的味道。鬼也吃魚嗎？', 'The night the oni came, they smelled of iron and fish. Do oni eat fish too?')); },

  // ---------- the road ----------
  async w_landslide(E) { await E.say(null, L('山洞口被落石堵住了。底下的土鬆鬆的……要是有會挖洞的夥伴就好了。', 'Fallen rocks block the cave mouth. The earth beneath is loose... if only someone here could dig.')); },
  async w_bridgeguard(E) { await E.say(L('修橋的人', 'Bridge Mender'), L('橋板被山上的猴子拆走了！沒有橋板，誰也過不了河啊。', 'The monkeys from the mountain made off with the bridge planks! Nobody can cross without them.')); },
  async w_cliffwind(E) { await E.say(null, L('通往崖上的小路吹著強風。……沒有理由的話，沒必要冒險爬上去。', 'A fierce wind sweeps the path up the cliff. ...No reason to risk the climb without a good one.')); },

  // ---------- 白牙森林 ----------
  async fo_meet(E) {
    await E.say(null, L('森林深處傳來低沉的吼聲。', 'A low growl comes from deeper in the forest.'));
  },
  async fo_grave(E) { await E.say(null, L('「獵人 源治 之墓」。墓前放著一雙磨破的草鞋。', '"Here lies Genji, hunter." A pair of worn straw sandals sits before it.')); },
  async fo_shiro(E, e) {
    if (!count('kibi')) {
      await E.say(L('白狗', 'White Dog'), L('（低吼……）', '(Growl...)'));
      await E.say(null, L('白狗瘦得只剩皮包骨，卻寸步不離地守著墓。……要是有能吃的東西就好了。', 'The white dog is skin and bone, yet will not take one step from the grave. ...If only you had something it could eat.'));
      return;
    }
    await E.say(L('白狗', 'White Dog'), L('（低吼……）', '(Growl...)'));
    const r = await E.ask(null, L('要分一顆黍糰子給牠嗎？', 'Share a millet dumpling with it?'), [L('分給牠', 'Share one'), L('不要', 'No')]);
    if (r !== 0) return;
    E.give('kibi', -1);
    await E.say(null, L('白狗嗅了嗅，猶豫了很久，才一口吃下。', 'The dog sniffed it, hesitated a long while, then ate it in one bite.'));
    await E.talk(L('小白', 'Shiro'), L('……汪。（這個味道……是主人常帶的糰子。）', '...Woof. (This smell... the dumplings my master always carried.)'),
      L('（主人是被「鬼」殺的。可是那天，那些鬼身上沒有野獸的味道。是人的味道。）', '(They say "oni" killed my master. But that day, those oni smelled of no beast at all. They smelled of people.)'),
      L('（我要找出是誰。主人的笛子被他們搶走了……我聞得到，就在森林深處。）', "(I will find who it was. They took my master's flute... I can smell it, deep in the forest.)"));
    await E.say(L('桃丸', 'Momomaru'), L('那我們一起去吧。我也想知道真相。', "Then let's go together. I want the truth too."));
    E.join('shiro', e);
    await E.say(null, L('小白成為了夥伴！\n小白能聞出埋在土裡的東西。面對閃亮的土堆按 Z 看看吧。', 'Shiro joined the party!\nShiro can sniff out things buried in the ground. Face a glinting patch of earth and press Z.'));
  },
  async fo_gate(E) {
    if (!S.flags.forestKey) { await E.say(null, L('竹子編的門上了鎖。……鎖頭上沾著土，鑰匙也許被埋在哪裡了。', 'A woven bamboo gate, locked. ...There is soil on the lock. Maybe the key was buried somewhere.')); return; }
    S.flags.forestGate = true; E.sfx('gate');
    await E.say(null, L('用挖出來的鑰匙打開了竹門。', 'The key Shiro dug up opens the bamboo gate.'));
    await E.reload();
  },
  async fo_boss(E) {
    await E.say(L('森之怨靈', 'Forest Grudge'), L('人類……燒我的樹……搶我的果……滾出去！', 'Humans... who burn my trees... who take my fruit... get OUT!'));
    const r = await E.battle(['forestking'], { bg: 'forest', boss: true });
    if (r !== 'win') return;
    S.flags.boss1 = true;
    await E.talk(L('森之怨靈', 'Forest Grudge'), L('……你們不是那些人。你們身上有桃子的香味。', '...You are not those men. You smell of peaches.'),
      L('戴鬼面的人在這裡紮營，砍樹生火，還埋了一個獵人的笛子……說要嫁禍給鬼。', 'Men in oni masks camped here, cut my trees for fire, and buried a hunter\'s flute... "Blame it on the oni," they said.'));
    E.give('flute'); E.sfx('chest');
    await E.say(null, L('得到了獵人的笛子！', "Got the Hunter's Flute!"));
    await E.say(L('小白', 'Shiro'), L('（主人的笛子……）嗚……汪！', "(Master's flute...) Whimper... Woof!"));
    await E.say(L('桃丸', 'Momomaru'), L('嫁禍給鬼……？那搶村子的，到底是誰？', 'Blame it on the oni...? Then who has been raiding the village?'));
    await E.say(null, L('東北邊的猿啼山，聽說有人看過戴面具的人進出。', 'People say masked men have been seen coming and going on Monkey-Cry Mountain to the north-east.'));
    E.reloadWorldSoon();
  },

  // ---------- 猿啼山 ----------
  async mo_enter(E) {
    E.sfx('miss');
    await E.say(null, L('咚！一顆栗子砸在頭上。', 'Bonk! A chestnut bounces off your head.'));
    await E.say(L('？？？', '???'), L('站住！這座山是我們的地盤，人類滾回去！', "Stop right there! This mountain is ours. Humans, go home!"));
  },
  async mo_natsume(E, e) {
    if (!S.flags.natsumeTalked) {
      await E.talk(L('母猴', 'She-Monkey'), L('我叫棗。拆了橋板的是我，偷了村子黍米的也是我。怎樣？', "I'm Natsume. I took the bridge planks. I took the village millet too. So what?"),
        L('山裡的栗子林被狸大王佔走了。這些小傢伙的爸媽都被他抓去當苦工……我不偷，牠們就要餓死。', "The Tanuki King took our chestnut groves. These little ones' parents were dragged off to work for him... If I don't steal, they'll starve."));
      S.flags.natsumeTalked = true;
    }
    if (!count('kibi')) { await E.say(L('棗', 'Natsume'), L('……沒帶吃的就別來煩我們。', "...Don't bother us if you didn't bring food.")); return; }
    const r = await E.ask(null, L('要把黍糰子分給小猴子們嗎？', 'Share a millet dumpling with the little monkeys?'), [L('分給牠們', 'Share'), L('不要', 'No')]);
    if (r !== 0) return;
    E.give('kibi', -1);
    await E.say(L('小猴子', 'Little Monkey'), L('吱吱！好香！', 'Squeak! It smells so good!'));
    await E.talk(L('棗', 'Natsume'), L('……你們這些人類真奇怪。自己都不夠吃了還分給別人。', "...You humans are strange. Barely enough for yourselves and you still share."),
      L('好吧。我帶你們上山，去揍那隻胖狸。山上的藤蔓我閉著眼睛都能爬。', "Fine. I'll take you up the mountain to punch that fat tanuki. I could climb these vines with my eyes shut."));
    E.join('natsume', e);
    await E.say(null, L('棗成為了夥伴！\n棗能爬上岩壁的藤蔓。面對藤蔓按 Z 吧。', 'Natsume joined the party!\nNatsume can climb the vines on the cliffs. Face a vine and press Z.'));
  },
  async mo_baby(E) { await E.say(L('小猴子', 'Little Monkey'), S.flags.boss2 ? L('吱吱！栗子林回來了！', 'Squeak! We got the chestnut groves back!') : L('吱……肚子餓……', 'Squeak... hungry...')); },
  async mo_boss(E) {
    await E.say(L('狸大王', 'Tanuki King'), L('嘿嘿嘿，黑鐵大人給的金子可真亮啊。這座山的糧食，全部都要運到港口去！', 'Heh heh heh. Lord Kurogane\'s gold sure is shiny. Every scrap of food on this mountain goes down to the harbour!'));
    const r = await E.battle(['tanuki'], { bg: 'mountain', boss: true });
    if (r !== 'win') return;
    S.flags.boss2 = true;
    await E.talk(L('狸大王', 'Tanuki King'), L('別、別打了！我也只是收錢辦事……', "S-stop! I was only paid to do it..."),
      L('黑鐵大將說，只要把糧食都囤起來，再讓大家以為是鬼搶的，村子就會求他出兵打鬼……', '"Hoard the food, make them think the oni took it, and the villages will beg me to march on the oni," Lord Kurogane said...'));
    await E.say(L('桃丸', 'Momomaru'), L('黑鐵大將……。鬼面具裡的家紋，就是他的嗎？', 'Lord Kurogane... Is the crest inside the oni mask his?'));
    await E.say(L('棗', 'Natsume'), L('橋板我會還回去的。……喂，桃丸，往港口走吧。那個黑鐵，在港口有一大堆船。', "I'll put the planks back. ...Hey, Momomaru. Head for the harbour. That Kurogane keeps a whole fleet there."));
    E.reloadWorldSoon();
  },

  // ---------- 潮見港 ----------
  async pt_inndoor(E) { await E.say(null, L('旅店的門口，老闆娘在招呼客人。', 'The innkeeper is greeting guests at the door.')); },
  async pt_shopdoor(E) { await E.say(null, L('道具屋的老闆在門口擺攤。', 'The tool shop keeper has a stall out front.')); },
  async pt_inn(E) { await E.say(L('旅店老闆娘', 'Innkeeper'), L('爐灶借你們用吧。累了就在火邊歇歇。', 'Use our hearth if you like. Rest by the fire when you are tired.')); },
  async pt_shop(E) { await E.say(L('道具屋', 'Tool Shop'), L('海邊的貨都在這了。', 'Everything from the coast is right here.')); await E.shop(SHOPS.port); },
  async pt_captain(E) {
    if (S.flags.kiji) {
      await E.say(L('老船長', 'Old Captain'), L('有雉雞在天上看路，就不怕迷霧了。……上船吧，孩子們。', 'With a pheasant watching the way from the sky, the fog holds no fear. ...All aboard, children.'));
      const r = await E.ask(null, L('要出發前往鬼之島嗎？', 'Set sail for the Oni Isle?'), [L('出發', 'Set sail'), L('再等等', 'Not yet')]);
      if (r === 0) { E.give('boatpass'); await E.fadeTo('ship', 5, 6, 'r'); }
      return;
    }
    await E.talk(L('老船長', 'Old Captain'), L('鬼之島？……那片海終年起霧，還住著海坊主。黑鐵家的船可以過，因為他們有天狗領路。', "The Oni Isle? ...Fog covers that sea all year, and the Umibozu lives there. Kurogane's ships get through because tengu guide them."),
      L('要我載你們也行，但得有能從天上看路的眼睛。', "I'll take you, but you'll need eyes that can see the way from above."),
      L('西南邊的天狗崖住著一隻雉雞，以前替漁船領過路……不過聽說牠受了傷，再也不飛了。', 'A pheasant lives at the Tengu Cliffs to the south-west. She used to guide the fishing boats... but they say she was hurt and never flew again.'));
    S.flags.captainAsked = true;
    E.reloadWorldSoon();
  },
  async pt_fisher(E) { await E.say(L('漁夫', 'Fisherman'), L('黑鐵家的船晚上出港，天亮才回來。船上堆滿了米袋……是從哪弄來的？', "Kurogane's ships leave at night and come back at dawn, piled high with sacks of rice... where do they get it all?")); },
  async pt_sailor(E) { await E.say(L('老水手', 'Old Sailor'), L('鬼之島的鬼？年輕時我見過一次。他們拿鮮魚換我們的米，比商人還老實喔。', 'Oni from the Oni Isle? I met one when I was young. Traded fresh fish for our rice. More honest than any merchant.')); },
  async pt_kid(E) { await E.say(L('港口的小孩', 'Harbour Kid'), L('我長大要當黑鐵大將那樣的武士！……可是他的武士常常踢我們家的狗。', "When I grow up I'll be a samurai like Lord Kurogane! ...But his samurai keep kicking our dog.")); },
  async pt_samurai(E) { await E.say(L('黑鐵家的武士', 'Kurogane Samurai'), S.flags.boss5 ? L('……鬼之島的事傳開了。大人他……', '...Word of the Oni Isle is spreading. My lord is...') : L('退開，小鬼。等大人除掉了鬼，那座島的泉水和金山就都是我們的了！', 'Out of the way, brat. Once my lord wipes out the oni, the island\'s spring and its gold will be ours!')); },

  // ---------- 天狗崖 ----------
  async cl_enter(E) { await E.say(null, L('海風呼呼地吹。崖上傳來鈴鐺的聲音。', 'The sea wind howls. From atop the cliffs comes the sound of bells.')); },
  async cl_kiji(E, e) {
    if (!S.flags.kijiTalked) {
      await E.talk(L('雉雞', 'Pheasant'), L('別、別過來！……你們是黑鐵家的人嗎？', "D-don't come near! ...Are you Kurogane's people?"),
        L('……不是？那就好。我叫雉。以前我天天在海上飛，替漁船找回港的路。', "...No? Good. I'm Kiji. I used to fly over the sea every day, guiding the fishing boats home."),
        L('可是有一天，天狗大人的風把我打了下來。從那以後，我一張開翅膀，腳就發抖……', 'But one day the tengu\'s wind knocked me from the sky. Ever since, my legs shake whenever I spread my wings...'));
      S.flags.kijiTalked = true;
    }
    if (!count('kibi')) { await E.say(L('雉', 'Kiji'), L('……肚子好餓，可是我連覓食都不敢飛遠。', "...I'm so hungry, but I'm too scared to fly far enough to find food.")); return; }
    const r = await E.ask(null, L('要分黍糰子給雉嗎？', 'Share a millet dumpling with Kiji?'), [L('分給牠', 'Share'), L('不要', 'No')]);
    if (r !== 0) return;
    E.give('kibi', -1);
    await E.talk(L('雉', 'Kiji'), L('……好吃。好像是很久以前，媽媽餵我的那種味道。', "...Delicious. Like something my mother fed me, a long time ago."));
    await E.say(L('桃丸', 'Momomaru'), L('跟我們走吧。害怕的話，就不要往下看，只要看著我們就好。', "Come with us. If you're scared, don't look down. Just look at us."));
    await E.say(L('雉', 'Kiji'), L('……只看著你們。……嗯。我試試看。', '...Just look at you. ...Mm. I\'ll try.'));
    E.join('kiji', e);
    await E.say(null, L('雉成為了夥伴！\n雉能飛到搆不到的地方。在停鳥木樁前按 Z，她會去敲響對面的鈴鐺。', "Kiji joined the party!\nKiji can fly where nobody can reach. Press Z at a bird's perch and she will ring the bell across the way."));
  },
  async cl_gate(E) { await E.say(null, L('通往崖頂的石門關著。門上的鈴鐺好像是開關。', 'The stone gate to the summit is shut. The bell above it seems to work it.')); },
  async cl_boss(E) {
    await E.say(L('赤天狗', 'Red Tengu'), L('又是黑鐵家的走狗嗎！偷了本座的羽扇，還敢上山！', "Another of Kurogane's curs! You stole my feather fan and still dare climb my mountain!"));
    const r = await E.battle(['tengu'], { bg: 'mountain', boss: true });
    if (r !== 'win') return;
    S.flags.boss3 = true;
    await E.talk(L('赤天狗', 'Red Tengu'), L('……你們沒有羽扇。你們身上……有神木的味道？', '...You do not have my fan. And you... you smell of the sacred tree?'),
      L('黑鐵用妖術奪了本座的羽扇，用它的風替他的船開路。那陣風，也把那隻雉雞打了下來……', "Kurogane stole my fan with sorcery and uses its wind to clear a path for his ships. That same wind knocked the pheasant out of the sky..."),
      L('對不起，小雉。去吧，海上的霧，本座替你們吹散。', 'Forgive me, little Kiji. Go. I will blow the fog off the sea for you.'));
    await E.say(L('雉', 'Kiji'), L('……不是天狗大人的錯。是我自己不敢飛。……可是現在，我想飛了。', "...It wasn't your fault. It was me who was afraid to fly. ...But now I want to."));
    E.give('geta'); E.sfx('chest');
    await E.say(null, L('天狗送了一雙天狗木屐！', 'The tengu gives you a pair of Tengu Clogs!'));
  },

  // ---------- the crossing ----------
  async sh_captain(E) { await E.say(L('老船長', 'Old Captain'), L('霧散了……天狗說話算話。小心，這一帶是海坊主的地盤。', "The fog's lifting... that tengu keeps his word. Careful now. These are the Umibozu's waters.")); },
  async sh_squid(E) {
    E.shake(20); E.sfx('quake');
    await E.say(null, L('船身猛烈地搖晃。漆黑的大浪裡，冒出了一個巨大的身影！', 'The ship lurches violently. From the black waves rises an enormous shape!'));
    await E.say(L('海坊主', 'Umibozu'), L('黑鐵的船……不，是新的船……統統沉下去吧……', "Kurogane's ship... no, a new ship... sink, all of you..."));
    const r = await E.battle(['squid'], { bg: 'storm', boss: true });
    if (r !== 'win') return;
    S.flags.boss4 = true;
    await E.say(L('海坊主', 'Umibozu'), L('……原來不是黑鐵的船。他每晚從島上運走泉水和金子，吵得我睡不著……', "...Not Kurogane's ship after all. Every night he hauls water and gold off that island, and the racket keeps me awake..."));
    await E.say(null, L('海坊主沉回了海底。霧的盡頭，一座灰色的島出現了。', 'The Umibozu sinks back into the deep. Beyond the fog, a grey island appears.'));
    await E.fadeTo('isle', 17, 25, 'u');
  },

  // ---------- 鬼之島 ----------
  async is_landing(E) {
    E.music('boss');
    const g = actor(E, 'gokiA', 17, 20, 'd', 'DemonGreen');
    await E.say(L('剛鬼', 'Goki'), L('人類！又來搶我們最後一點泉水了嗎！這次，就算拚了命也不讓你們過去！', 'Humans! Back to steal the last of our water? This time we stop you, even if it costs our lives!'));
    await E.say(L('桃丸', 'Momomaru'), L('等等，我們不是──', "Wait, we're not--"));
    const r = await E.battle(['goki'], { bg: 'isle', boss: true });
    if (r !== 'win') { E.removeEnt(g); return; }
    S.flags.boss5 = true;
    await E.say(L('剛鬼', 'Goki'), L('……可惡……可是你的刀，一次也沒有砍下來。', "...Curse you... but your sword never once came down on me."));
    const a = actor(E, 'akaneA', 15, 20, 'r', 'akane');
    await E.say(L('？？？', '???'), L('住手吧，剛鬼。……那孩子身上，有神木的香氣。', 'Enough, Goki. ...That boy carries the scent of the sacred tree.'));
    await E.talk(L('茜', 'Akane'), L('我是守護神木的巫女，茜。……請把你的桃之印給我看看。', 'I am Akane, shrine maiden of the sacred tree. ...Please, let me see your peach seal.'));
    E.sfx('holy'); E.flash('#fff0f8', 30);
    await E.talk(L('茜', 'Akane'), L('……果然。十五年前，神木結了最後一顆桃子。是我把它放到海流裡的。', "...So it is. Fifteen years ago the sacred tree bore its last peach. I was the one who set it on the current."),
      L('那時黑鐵大將佔了泉水的源頭，神木一天天枯萎。我想，至少要讓最後的種子逃出這座島。', 'Lord Kurogane had seized the source of the spring, and the tree was withering. I thought at least its last seed should escape the island.'),
      L('桃丸……你就是那顆桃子。你是神木的孩子。', 'Momomaru... you are that peach. You are the child of the sacred tree.'));
    await E.say(L('桃丸', 'Momomaru'), L('我……是樹的孩子？我不是人嗎……？', "I'm... the child of a tree? I'm not... human?"));
    await E.wait(30);
    if (E.has('shiro')) await E.say(L('小白', 'Shiro'), L('（汪。你是吃梅奶奶的糰子長大的桃丸。這樣就夠了。）', "(Woof. You're Momomaru, raised on Granny Ume's dumplings. That's enough.)"));
    if (E.has('natsume')) await E.say(L('棗', 'Natsume'), L('是樹是人有什麼關係。你分糰子給我家小鬼們的時候，可比誰都像個人。', "Tree or human, who cares? When you shared dumplings with my little ones, you were more human than anyone."));
    if (E.has('kiji')) await E.say(L('雉', 'Kiji'), L('你說過，害怕的時候只要看著我們。……現在換你看著我們吧。', "You said that when I'm scared I should just look at you. ...Now it's your turn to look at us."));
    await E.say(L('桃丸', 'Momomaru'), L('……嗯。謝謝大家。', '...Yeah. Thank you, everyone.'));
    await E.talk(L('茜', 'Akane'), L('搶你們村子的，是黑鐵的手下。他們戴上鬼的面具，讓人類恨我們。', 'The ones who raided your village were Kurogane\'s men. They wore oni masks so humans would hate us.'),
      L('等人類都恨透了鬼，他就能光明正大地「討伐」這座島，獨佔泉水下的金脈。', 'Once humans hated the oni enough, he could "purge" this island in the open and keep the gold beneath the spring for himself.'),
      L('他的砦就蓋在泉水上。……我們的人，有些還被抓去當了奴隸。', 'His fortress sits right over the spring. ...Some of our people were taken there as slaves.'));
    S.flags.akaneTold = true;
    E.removeEnt(g); E.removeEnt(a);
    E.music('isle');
    await E.say(null, L('村子在島的中央。……鬼們瘦得連站都站不穩。', 'The village lies in the middle of the island. ...The oni are so thin they can barely stand.'));
    await E.reload();
  },
  async is_akane(E) {
    await E.say(L('茜', 'Akane'), S.flags.boss6 ? L('黑鐵就在砦的最上面。……桃丸，拜託你了。', 'Kurogane waits at the very top of his fortress. ...Momomaru, I am counting on you.') : L('砦在島的東北邊。被抓走的人，如果你願意……請和他們說說話。他們不是自願拿刀的。', "The fortress is in the north-east of the island. The ones he took... if you are willing, talk to them. They did not take up their blades by choice."));
  },
  async is_goki(E) { await E.say(L('剛鬼', 'Goki'), L('我打輸了，所以我信你。……要是你也打輸了，我就自己殺上去。', "I lost, so I trust you. ...If you lose too, I'll storm the place myself.")); },
  async is_elder(E) { await E.say(L('鬼的長老', 'Oni Elder'), L('我們鬼，以前在每年桃花開的時候，划船到對岸和人類交換糧食。……已經十五年沒有開花了。', 'We oni used to row across each year when the peach blossoms opened, to trade food with the humans. ...It has not bloomed in fifteen years.')); },
  async is_kid(E) {
    if (S.flags.fedOniKid) { await E.say(L('鬼的小孩', 'Oni Child'), L('人類的糰子，甜甜的。我長大也要去對岸看看！', "The human dumpling was sweet. When I grow up I'll go see the other shore!")); return; }
    await E.say(L('鬼的小孩', 'Oni Child'), L('……你是人類？人類會吃小孩嗎？……我好餓。', '...Are you a human? Do humans eat children? ...I\'m so hungry.'));
    if (!count('kibi')) return;
    const r = await E.ask(null, L('要分黍糰子給鬼的小孩嗎？', 'Share a millet dumpling with the oni child?'), [L('分給他', 'Share'), L('不要', 'No')]);
    if (r !== 0) return;
    E.give('kibi', -1); S.flags.fedOniKid = true; S.flags.kindness = (S.flags.kindness || 0) + 1;
    await E.say(L('鬼的小孩', 'Oni Child'), L('……！好、好好吃！謝謝你，人類哥哥！', '...! S-so good! Thank you, human!'));
  },
  async is_mother(E) { await E.say(L('鬼的母親', 'Oni Mother'), L('我的丈夫被抓進了砦裡。……如果你看到一個額頭有疤的鬼，請告訴他，孩子們都還活著。', "My husband was taken into the fortress. ...If you see an oni with a scar on his brow, tell him the children are still alive.")); },
  async is_man(E) { await E.say(L('鬼的男人', 'Oni Man'), L('泉水被堵住之後，連井都乾了。我們只能喝雨水。', 'Since they dammed the spring, even the wells ran dry. We drink only rain.')); },
  async is_shop(E) { await E.say(L('鬼的商人', 'Oni Trader'), L('人類的錢？……能用。這些都是以前和對岸換來的東西。', 'Human money? ...It still spends. These are all things we traded for across the sea, long ago.')); await E.shop(SHOPS.isle); },
  async is_elderhut(E) { await E.say(null, L('茅草屋裡空蕩蕩的，只剩一個冷掉的灶。', 'The thatched hut is bare, with only a cold stove left.')); },
  async is_storehut(E) { await E.say(null, L('倉庫裡一粒米也沒有。', 'There is not a grain of rice in the storehouse.')); },
  async is_fortshut(E) { await E.say(null, L('黑鐵的砦。大門緊閉，門上掛著黑鐵家的家紋。……和鬼面具裡的一模一樣。', "Kurogane's fortress. The great door is shut, his family crest hung above it... identical to the one inside the oni mask.")); },

  // ---------- 黑鐵砦 ----------
  async kt_gate(E) { await E.say(null, L('鐵門關得死死的。門下面有水流的聲音……底下好像是空的。', 'The iron gate is shut tight. There is the sound of water beneath it... the ground below seems hollow.')); },
  async kt_innergate(E) { await E.say(null, L('通往天守的門。青鬼大將守在門前。', 'The door to the keep. The Blue General guards it.')); },
  async kt_seal(E) { await E.say(null, L('門被封住了。', 'The door is sealed.')); },
  async kt_climbed(E) { await E.say(L('棗', 'Natsume'), L('爬上來了！這裡是上層的走廊。', "We're up! This is the upper hall.")); await E.reload(); },
  async kt_samurai(E) {
    await E.say(L('青鬼大將', 'Blue General'), L('鬼的走狗……不，你是人類？為了鬼和自己人刀劍相向，蠢不可及！', "The oni's lapdog... no, you're human? Drawing steel on your own kind for the sake of oni? Utter folly!"));
    const r = await E.battle(['samurai'], { bg: 'fort', boss: true });
    if (r !== 'win') return;
    S.flags.boss6 = true;
    await E.say(L('青鬼大將', 'Blue General'), L('……我也曾經相信，大人是要守護人類。直到他叫我們戴上鬼面……', '...I too once believed my lord meant to protect our people. Until he made us wear the oni masks...'));
    await E.reload();
  },
  async kt_kurogane(E) {
    await E.talk(L('黑鐵大將', 'Lord Kurogane'), L('來了啊，桃子裡的小鬼。茜那個巫女，以為把種子放走就能救這棵樹？', 'So you came, little peach. Did that shrine maiden Akane think letting the seed go would save her tree?'),
      L('泉水下面是金脈。只要鬼消失，那些金子、這座島、甚至對岸的村子，全都會跪在我腳下！', 'Beneath the spring lies a vein of gold. Once the oni are gone, the gold, this island, even the villages across the sea, will all kneel at my feet!'));
    await E.say(L('桃丸', 'Momomaru'), L('你讓村子挨餓、讓小白的主人死掉、讓雉不敢飛、讓鬼的孩子喝雨水……全都是為了金子？', "You starved the village, killed Shiro's master, made Kiji afraid to fly, left oni children drinking rain... all for gold?"));
    await E.say(L('黑鐵大將', 'Lord Kurogane'), L('弱者的眼淚，值幾個錢？', "What are the tears of the weak worth? Not a coin."));
    const r = await E.battle(['kurogane'], { bg: 'fort', boss: true, music: 'final' });
    if (r !== 'win') return;
    S.flags.boss7 = true;
    E.shake(30); E.sfx('quake');
    await E.say(L('黑鐵大將', 'Lord Kurogane'), L('不可能……我的金子……我的……', 'Impossible... my gold... my...'));
    await E.say(null, L('堵住泉水的鐵閘裂開了。轟隆隆的水聲，從砦的底下一路衝向島的中心。', 'The iron sluice damming the spring cracks apart. With a roar, the water rushes from beneath the fortress toward the heart of the island.'));
    await E.fadeTo('isle', 17, 9, 'u');
    await SCRIPTS.is_tree(E);
  },
  // the sacred tree: water is back, but the tree has no heart left
  async is_tree(E) {
    E.music('sad');
    const a = actor(E, 'akaneT', 16, 8, 'r', 'akane'), g = actor(E, 'gokiT', 19, 9, 'l', 'DemonGreen');
    await E.talk(L('茜', 'Akane'), L('泉水回來了……可是，神木已經太老了。光有水，它也醒不過來。', 'The spring has returned... but the tree is too old now. Water alone cannot wake it.'),
      L('它需要一顆心。……十五年前，它把自己的心，放進了最後一顆桃子裡。', 'It needs a heart. ...Fifteen years ago, it put its own heart into its last peach.'));
    await E.say(L('桃丸', 'Momomaru'), L('……我知道了。是我，對吧。', "...I understand. It's me, isn't it."));
    await E.wait(30);
    E.sfx('door');
    const ji = actor(E, 'takeT', 17, 13, 'u', 'grandpa'), ba = actor(E, 'umeT', 18, 13, 'u', 'grandma');
    await E.say(L('梅奶奶', 'Granny Ume'), L('桃丸──！', 'Momomaru--!'));
    await E.say(L('竹爺爺', 'Grandpa Take'), L('港口的船長說你們渡海了，我們就搭了下一班船……老骨頭差點散了。', 'The harbour captain said you had crossed, so we caught the next boat... these old bones nearly fell apart.'));
    await E.talk(L('桃丸', 'Momomaru'), L('爺爺、奶奶……我是從這棵樹來的。現在，它需要我回去。', "Grandpa, Granny... I came from this tree. And now it needs me back."),
      L('如果我回到樹裡，鬼之島就會開花，對岸的村子也不用再挨餓了。', "If I go back into the tree, the Oni Isle will bloom again, and the village across the sea won't go hungry any more."));
    await E.say(L('梅奶奶', 'Granny Ume'), L('……傻孩子。奶奶從河裡把你撈起來的時候，就知道你總有一天要回到哪裡去的。', "...Silly boy. When I pulled you out of the river, I knew one day you would have to go back to wherever you came from."));
    await E.say(L('梅奶奶', 'Granny Ume'), L('來，最後一顆黍糰子。一邊想著你，一邊揉的。', "Here. One last millet dumpling. I rolled it thinking of you."));
    E.sfx('heal');
    await E.say(L('桃丸', 'Momomaru'), L('……奶奶的味道。我會一直記得的。', "...Granny's recipe. I'll remember it always."));
    for (const id of friends()) {
      if (id === 'shiro') await E.say(L('小白', 'Shiro'), L('（嗚……汪！汪！我會守在這棵樹下。就像守著主人那樣。）', "(Whimper... woof! Woof! I'll guard this tree. Just like I guarded my master.)"));
      if (id === 'natsume') await E.say(L('棗', 'Natsume'), L('……說好了喔，等你開花，第一顆桃子要給我家小鬼們吃。', "...It's a promise. When you bloom, the first peach goes to my little ones."));
      if (id === 'kiji') await E.say(L('雉', 'Kiji'), L('我會每天飛過來看你。不管颳多大的風。', "I'll fly over to see you every day. No matter how hard the wind blows."));
    }
    await E.say(null, L('桃丸把手貼在乾枯的樹幹上。', 'Momomaru lays his hand on the withered trunk.'));
    E.sfx('holy'); E.flash('#fff8fc', 60); E.shake(20);
    await E.wait(60);
    E.removeEnt(a); E.removeEnt(g); E.removeEnt(ji); E.removeEnt(ba);
    S.flags.ending = true;
    await E.ending();
  },

  // ---------- 合: one year later ----------
  async epilogue(E) {
    E.hideParty(true);
    await E.say(null, L('──一年後。', '-- One year later.'));
    const ba = actor(E, 'umeE', 9, 5, 'd', 'grandma');
    await E.say(null, L('鬼之島的桃樹開滿了花。每到春天，鬼們就划著船，載著鮮魚和桃子，到對岸的村子來。', "The peach tree of the Oni Isle bloomed in full. Each spring the oni row across with fresh fish and peaches for the village."));
    if ((S.flags.spared || 0) >= 4) await E.say(null, L('從黑鐵砦被救出來的鬼們，有的留在黍之里，和村人一起種黍子。', 'Some of the oni freed from Kurogane Fortress stayed in Kibi Village, growing millet beside the villagers.'));
    if (S.flags.fedOniKid) await E.say(null, L('那個吃過人類糰子的鬼小孩，每年都第一個跳下船。', 'The oni child who once ate a human dumpling is always the first to jump off the boat.'));
    await E.say(null, L('老奶奶今天也到河邊洗衣服。', 'And today, as ever, the old woman went down to the river to wash.'));
    await E.wait(20);
    const peach = E.spawn({ type: 'sprite', id: 'peachE', x: 0, y: 6, draw: (g, X, Y, f) => { const b = Math.round(Math.sin(f / 10) * 1.5); g.fillStyle = '#f8a8b8'; g.beginPath(); g.arc(X + 8, Y + 6 + b, 8, 0, Math.PI * 2); g.fill(); g.fillStyle = '#f8d0d8'; g.beginPath(); g.arc(X + 5, Y + 3 + b, 3, 0, Math.PI * 2); g.fill(); g.fillStyle = '#58a040'; g.fillRect(X + 9, Y - 4 + b, 5, 3); } });
    for (let i = 0; i < 9 * 16; i += 2) { peach.px = i; await E.wait(1); }
    ba.dir = 'l';
    await E.say(L('梅奶奶', 'Granny Ume'), L('……哎呀呀。', '...My, my.'));
    E.removeEnt(peach); E.sfx('heal'); E.flash('#fff0f4', 30);
    const momo = actor(E, 'momoE', 8, 5, 'r', 'momo');
    await E.wait(30);
    await E.say(L('桃丸', 'Momomaru'), L('奶奶，我回來了。', "Granny. I'm home."));
    await E.say(L('桃丸', 'Momomaru'), L('神木說，它已經有了好多好多人給的心。所以每年春天，它都讓我回家一趟。', "The tree said it has been given so many hearts now. So every spring, it lets me come home for a while."));
    await E.say(L('梅奶奶', 'Granny Ume'), L('……回來就好。回來就好。肚子餓了吧，奶奶做了糰子。', '...You are home. That is all that matters. You must be hungry. Granny made dumplings.'));
    const d = actor(E, 'shiroE', 15, 3, 'l', 'shiro'), n = actor(E, 'natsumeE', 16, 4, 'l', 'natsume'), k = actor(E, 'kijiE', 15, 5, 'l', 'kiji');
    E.sfx('level');
    await E.say(null, L('河岸的那一頭，一隻狗、一隻猴子和一隻雉雞，正朝這邊飛奔過來。', 'Along the riverbank, a dog, a monkey and a pheasant come racing toward them.'));
    void d; void n; void k; void momo;
    await E.wait(60);
  },
};

// ---------- cooking ----------
async function cook(E) {
  for (;;) {
    const items = RECIPES.map(([id, need]) => {
      const ok = Object.entries(need).every(([k, v]) => count(k) >= v);
      const parts = Object.entries(need).map(([k, v]) => `${ITEMS[k].name}${v > 1 ? '×' + v : ''}`).join('+');
      return { label: ITEMS[id].name, right: count(id), disabled: !ok, desc: parts };
    });
    const r = await E.menu(items, { x: 40, y: 40, w: 176, title: L('要做哪一種？', 'Which kind?'), drawExtra: (i) => E.hint(items[i] && items[i].desc) });
    if (r < 0) return;
    const [id, need] = RECIPES[r];
    for (const [k, v] of Object.entries(need)) E.give(k, -v);
    E.give(id); E.sfx('heal'); S.flags.cooked = true;
    await E.say(null, L(`一邊想著大家，一邊揉……做好了${ITEMS[id].name}！`, `Rolled with everyone in mind... made a ${ITEMS[id].name}!`));
  }
}
// sharing raises the bond between Momomaru and his friends
async function share(E) {
  const fs = friends();
  if (!fs.length) { await E.say(null, L('現在還沒有可以分享的夥伴。', "There's nobody to share with yet.")); return; }
  if (count('kibi') < fs.length) { await E.say(null, L(`要和大家一起吃，需要 ${fs.length} 顆黍糰子。`, `Sharing with everyone takes ${fs.length} Millet Dumplings.`)); return; }
  if (S.flags.sharedAt !== undefined && S.steps - S.flags.sharedAt < 80) { await E.say(null, L('剛剛才一起吃過。走一段路再說吧。', 'You only just ate together. Walk a while first.')); return; }
  E.give('kibi', -fs.length); S.flags.sharedAt = S.steps;
  S.flags.bond = Math.min(12, (S.flags.bond || 0) + 1);
  const line = { shiro: L('小白搖著尾巴，把糰子分了一半推回給你。', 'Shiro wags his tail and nudges half his dumpling back to you.'), natsume: L('棗偷偷把一顆藏進了懷裡，說是要帶回去給小猴子。', 'Natsume quietly tucks hers away "for the little ones."'), kiji: L('雉一小口一小口地啄著，說：「和大家一起吃，比較好吃。」', 'Kiji pecks away in tiny bites. "It tastes better when we eat together."') };
  for (const id of fs) await E.say(null, line[id]);
  await E.say(null, S.flags.bond >= 8 ? L(`夥伴們的羈絆更深了！（羈絆 ${S.flags.bond}）\n四人都有一半以上的氣勢時，桃丸可以使出「四人合擊」！`, `Your bond grows deeper! (Bond ${S.flags.bond})\nWhen all four have half a gauge or more, Momomaru can call a Team Strike!`) : L(`夥伴們的羈絆更深了！（羈絆 ${S.flags.bond}）`, `Your bond grows deeper! (Bond ${S.flags.bond})`));
}
