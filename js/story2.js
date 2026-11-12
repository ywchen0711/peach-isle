// Story scripts for acts two and three of 桃源鬼島記: the curse on the sacred tree, the Fog Valley (Shiro's story),
// Homura and its volcano (Natsume's story and the red oni), the clouds (Kiji's story), the Dragon Palace, the
// festival, the Land of Endless Night, the endings and what waits after them. Every line is L('中文', 'English').
import { ITEMS, SHOPS } from './data.js';
import { S, count, addItem, fullHeal } from './party.js';
import { L } from './i18n.js';
import { SCRIPTS } from './story.js';
import { fishing, mochiGame, forge, dojo, magatama } from './minigames.js';

const actor = (E, id, x, y, dir, sprite = id) => E.spawn({ type: 'npc', id: 'a_' + id, sprite, x, y, dir });
const N = {
  momo: () => L('桃丸', 'Momomaru'), shiro: () => L('小白', 'Shiro'), natsume: () => L('棗', 'Natsume'), kiji: () => L('雉', 'Kiji'), akane: () => L('茜', 'Akane'),
  goki: () => L('剛鬼', 'Goki'), ume: () => L('梅奶奶', 'Granny Ume'), take: () => L('竹爺爺', 'Grandpa Take'), genmei: () => L('玄冥', 'Genmei'), kage: () => L('影丸', 'Kagemaru'),
  homura: () => L('焰丸', 'Homuramaru'), captain: () => L('老船長', 'Old Captain'), shione: () => L('汐音', 'Shione'), blue: () => L('青鬼大將', 'Blue General'),
};
const say = (E, who, zh, en) => E.say(who ? N[who] ? N[who]() : who : null, L(zh, en));
const got = async (E, id, n = 1) => { E.give(id, n); E.sfx('chest'); await E.say(null, L(`得到了${ITEMS[id].name}${n > 1 ? '×' + n : ''}！`, `Got ${ITEMS[id].name}${n > 1 ? ' x' + n : ''}!`)); };
const jewels = () => ['jewel_fire', 'jewel_sky', 'jewel_sea'].filter((j) => S.flags[j]).length;
function gotJewel(id) { S.flags[id] = true; addItem(id); S.flags.jewel1 = true; if (jewels() >= 3) S.flags.jewel3 = true; }
// the kindnesses that add up to a heart for the tree; six or more of the ten open the true ending
export function hearts() {
  const f = S.flags;
  return [f.kageForgiven, f.widowLetter, f.fatherHome, f.redeemed_homuramaru, f.fedOniKid, (f.spared || 0) >= 4, (f.bond || 0) >= 8, f.castawayFed, f.mochiDone, (f.magaGiven || 0) >= 6].filter(Boolean).length;
}

Object.assign(SCRIPTS, {
  // ---------- things anyone can use ----------
  async fishspot(E, e) {
    if (!count('rod')) { await say(E, null, '水面上有魚影在晃動。……要是有釣竿就好了。', 'Fish are rippling under the surface. ...If only you had a rod.'); return; }
    const r = await E.ask(null, L('要在這裡釣魚嗎？', 'Fish here?'), [L('釣魚', 'Fish'), L('不要', 'No')]);
    if (r !== 0) return;
    E.sfx('miss');
    await fishing(e.pool);
  },
  async updraft(E, e) {
    if (e.to) {
      await say(E, null, '赤天狗的羽扇一搧，強風把大家捲上了天！', "The Red Tengu's fan sweeps once, and a great wind lifts everyone into the sky!");
      E.sfx('warp'); await E.fadeTo(e.to, e.tx, e.ty, 'u'); return;
    }
    if (!E.has('kiji') || !S.flags.kijiGlide) { await say(E, null, '強勁的上升氣流呼呼地往上吹……要是有人能乘著它飛就好了。', 'A strong updraft roars upward... if only someone could ride it.'); return; }
    if (!S.flags.firstGlide) {
      S.flags.firstGlide = true;
      await say(E, 'kiji', '……底下什麼都沒有，只有雲。', '...There is nothing below. Only cloud.');
      await say(E, 'kiji', '以前我會怕得腳軟。可是現在，我背上有大家的重量。不往下看，只看著前面──', 'I used to go weak at the knees. But now I can feel all of you on my back. Not down. Only ahead--');
      await say(E, 'kiji', '抓好喔！', 'Hold tight!');
    } else await say(E, 'kiji', '抓緊我的羽毛！', 'Hold on to my feathers!');
    E.sfx('warp'); await E.warp(E.mapId(), e.tx, e.ty, 'd');
  },
  async heavyrock(E) {
    if (!S.flags.natsumeStrong) await say(E, null, '一塊巨大的岩石。光靠人的力氣，動也不動。', 'A huge boulder. It will not budge for any human.');
    else await say(E, null, '要是棗在的話，就推得動了。', 'With Natsume here, it would move.');
  },
  async seal(E) { await say(E, null, '一道發著光的結界擋住了去路。', 'A shining barrier bars the way.'); },
  async sign(E) { await say(E, null, '石碑上什麼也沒寫。', 'The stone says nothing.'); },
  async w_fog(E) { await say(E, null, '鳥居的另一頭是濃得化不開的霧。……現在沒有理由進去。', 'Beyond the torii hangs fog too thick to see through. ...No reason to go in now.'); },
  async is_cave(E) { await say(E, null, '岩壁上的洞窟。裡面傳出鬼的吆喝聲。……好像在練武。', 'A cave in the rock. Oni shouts echo inside... someone is training.'); },

  // ---------- 轉: the curse on the sacred tree (the end of act one) ----------
  async is_tree(E) {
    E.music('sad');
    const a = actor(E, 'akaneT', 16, 8, 'r', 'akane'), g = actor(E, 'gokiT', 19, 9, 'l', 'DemonGreen');
    await E.talk(N.akane(), L('泉水回來了……可是，神木已經太老了。光有水，它也醒不過來。', 'The spring has returned... but the tree is too old now. Water alone cannot wake it.'),
      L('它需要一顆心。……十五年前，它把自己的心，放進了最後一顆桃子裡。', 'It needs a heart. ...Fifteen years ago, it put its own heart into its last peach.'));
    await say(E, 'momo', '……我知道了。是我，對吧。', "...I understand. It's me, isn't it.");
    await E.wait(30);
    E.sfx('door');
    const ji = actor(E, 'takeT', 17, 13, 'u', 'grandpa'), ba = actor(E, 'umeT', 18, 13, 'u', 'grandma');
    await say(E, 'ume', '桃丸──！', 'Momomaru--!');
    await say(E, 'take', '港口的船長說你們渡海了，我們就搭了下一班船……老骨頭差點散了。', 'The harbour captain said you had crossed, so we caught the next boat... these old bones nearly fell apart.');
    await say(E, 'momo', '爺爺、奶奶……我是從這棵樹來的。現在，它需要我回去。', 'Grandpa, Granny... I came from this tree. And now it needs me back.');
    await say(E, null, '桃丸伸出手，要碰觸乾枯的樹幹──', 'Momomaru reaches out to touch the withered trunk--');
    // the one who was behind Kurogane all along
    E.music('reveal'); E.flash('#200030', 30); E.shake(16); E.sfx('abyss');
    const gm = actor(E, 'genmeiT', 16, 6, 'd', 'NinjaMageBlack');
    await E.talk(N.genmei(), L('呵呵呵……等一等。那顆心，是我的。', 'Heh heh heh... wait. That heart belongs to me.'),
      L('我是玄冥。黑鐵那個貪金的蠢貨，偷天狗羽扇的妖術，是我教他的。', 'I am Genmei. That gold-mad fool Kurogane? I taught him the sorcery to steal the tengu\'s fan.'),
      L('他要金子，我要的是神木的心──吃下它，就能永遠不死。', 'He wanted gold. I want the heart of the sacred tree. Eat it, and you never die.'));
    await say(E, 'akane', '玄冥……！三百年前，被逐出這座島的守木人……！', 'Genmei...! The tree-keeper banished from this island three hundred years ago...!');
    await E.talk(N.genmei(), L('我在三條樹根上都下了咒。火山、雲上、海底──等咒毒爬到樹心，這棵樹和它的孩子都會一起爛掉。', 'I have cursed all three of its roots. The volcano, the clouds, the sea. When the poison reaches the heart, the tree and its child rot together.'),
      L('想活命，就到常夜之國來找我吧，桃子。帶著你的心來。', 'If you want to live, come find me in the Land of Endless Night, little peach. And bring your heart.'));
    E.sfx('abyss'); E.flash('#000000', 40); E.removeEnt(gm);
    await say(E, null, '玄冥化成黑煙消失了。神木上僅剩的幾片葉子，一瞬間全變黑了。', 'Genmei dissolves into black smoke. The last few leaves on the sacred tree turn black in an instant.');
    E.music('isle');
    await E.talk(N.akane(), L('……神木的三條根，分別伸向鬼的故鄉「焰之鄉」的火山、天狗崖上的雲、還有海底的龍宮。', "...The tree's three roots reach the volcano of Homura, the oni homeland; the clouds above the Tengu Cliffs; and the Dragon Palace under the sea."),
      L('每條根的盡頭都有一顆「根之珠」。只要淨化三顆珠子，神木就能撐下去，也能打開通往常夜之國的門。', 'At the end of each root lies a root-jewel. Purify all three, and the tree will hold on, and the gate to the Endless Night will open.'),
      L('還有……我一直在想。也許神木要的，不一定是你一個人的心。', '...And I have been thinking. Perhaps what the tree needs is not your heart alone.'));
    await say(E, 'goki', '焰之鄉是我們祖先的島。我帶路。……船的話，叫島上的木匠幫那個老船長修吧。', 'Homura is the island of our ancestors. I will guide you. ...As for the ship, our carpenters will fix the old captain\'s boat.');
    const bl = actor(E, 'blueT', 21, 12, 'l', 'SamuraiBlue');
    await E.talk(N.blue(), L('……我來贖罪。黑鐵和那個和尚之間傳信的，是黑鐵的影之忍者「影丸」。', '...I have come to atone. The one who carried letters between Kurogane and that monk was his shadow ninja, Kagemaru.'),
      L('他逃進了黍之里南邊的霧之谷。……他也是殺死獵人源治那晚，在場的人。', 'He fled into the Fog Valley south of Kibi. ...And he was there the night Genji the hunter died.'));
    if (E.has('shiro')) await say(E, 'shiro', '（……主人的笛子上，有另一個人的味道。我記得。）', "(...There was another smell on master's flute. I remember it.)");
    await say(E, 'ume', '桃丸。不管你是桃子還是人，你都是我們的孩子。我們回黍之里等你。', 'Momomaru. Peach or boy, you are our child. We will go home to Kibi and wait for you.');
    await say(E, 'take', '別一個人扛。……要回家吃飯喔。', 'Don\'t carry it all alone. ...And come home for supper.');
    await say(E, 'momo', '……嗯。我一定會找到別的辦法。讓神木醒來，我也回家。', "...Right. I'll find another way. The tree wakes up, and I come home too.");
    E.removeEnt(a); E.removeEnt(g); E.removeEnt(ji); E.removeEnt(ba); E.removeEnt(bl);
    S.flags.act2 = true;
    await E.fadeText(L('── 第二部　三根之旅 ──', '-- Part Two: The Three Roots --'));
    await say(E, null, '目標：到黍之里南邊的霧之谷，找出影丸。', 'Goal: find Kagemaru in the Fog Valley south of Kibi.');
    await E.reload();
  },

  // ---------- 黍之里 in the later chapters ----------
  async kb_granny2(E) {
    if (S.flags.ending) { await say(E, 'ume', '肚子餓了吧？奶奶做了糰子喔。', 'Hungry? Granny made dumplings.'); return; }
    await say(E, 'ume', '路上有好好吃飯嗎？……來，帶著。', 'Are you eating properly on the road? ...Here, take these.');
    if (!S.flags.umeGift) { S.flags.umeGift = true; await got(E, 'kuri', 3); await say(E, 'ume', '栗子糰子的做法也教你吧：黍米一份，栗子一份。栗子啊，猿啼山上掉得到處都是。', "Let me teach you chestnut dumplings too: one millet, one chestnut. Chestnuts fall all over Monkey-Cry Mountain."); }
  },
  async kb_grandpa2(E) {
    if (S.flags.festivalOver && !S.flags.ending) { await say(E, 'take', '桃丸……那傢伙把老伴帶走了。拜託你，把她帶回來……', 'Momomaru... that creature took her. Please, bring her home...'); return; }
    await say(E, 'take', '聽說你們在找什麼「根之珠」？……我年輕時聽過，鬼之島的桃花開時，連天上的雲都是粉紅色的。', 'Looking for root-jewels, are you? ...When I was young they said that when the Oni Isle bloomed, even the clouds turned pink.');
  },
  async kb_kage(E) { await say(E, 'kage', '……我在替源治大嫂劈柴。這點事，比不上我欠的。', "...I'm chopping wood for Genji's widow. It is nothing next to what I owe."); },

  // ---------- 霧之谷: Shiro's story ----------
  async fv_enter(E) {
    await say(E, null, '濃霧像牛奶一樣，連自己的腳都看不清楚。', 'The fog is thick as milk. You can barely see your own feet.');
    await say(E, 'shiro', '（嗅嗅……這個味道。笛子上的那個味道！就在霧的深處。）', '(Sniff... that smell. The smell on the flute! Deep in the fog.)');
    await say(E, 'shiro', '（跟著我的鼻子走。我踩過的地方，你們踩。）', '(Follow my nose. Step where I step.)');
    S.flags.shiroTrack = true;
    E.sfx('level');
    await say(E, null, '小白學會了「追蹤」！\n霧裡會浮現小白聞到的腳印。離開腳印就會迷路。', "Shiro learned to Track!\nShiro's pawprints show the way through the fog. Stray from them and you will get lost.");
  },
  async fv_lost(E) {
    E.sfx('miss');
    await say(E, null, '四面八方都是白茫茫的霧……走著走著，又回到了入口。', 'White fog on every side... and before you know it, you are back at the entrance.');
    await E.warp('fogvale', 18, 24, 'u');
  },
  async fv_hut(E) { await say(E, null, '隱士的小屋。屋簷下吊著一串乾香魚。', "The hermit's hut. A string of dried sweetfish hangs under the eaves."); },
  async fv_hermit(E) {
    if (!S.flags.bossKage) {
      await say(E, '隱士', '霧之谷可不是普通人來的地方。……哦？你們有一隻好鼻子的狗。那就跟著牠吧。', 'The Fog Valley is no place for ordinary folk. ...Oh? You have a dog with a good nose. Then follow it.');
      await say(E, '隱士', '沼澤裡住著一隻大蝦蟆，會把人整個吞下去。被吞了別慌，狠狠揍牠的肚子，牠就會吐出來。', 'A great toad lives in the marsh. It swallows people whole. If it gets you, don\'t panic: hit it hard enough and it spits you out.');
      return;
    }
    await say(E, '隱士', '霧淡了些。……那個戴面具的年輕人，每天都去源治的舊屋前坐著。', 'The fog has thinned. ...That masked young man used to sit in front of Genji\'s old lodge every day.');
  },
  async fv_toad(E) {
    await say(E, null, '橋頭蹲著一隻比房子還大的蝦蟆。牠伸出長舌頭舔了舔嘴唇。', 'A toad bigger than a house squats at the head of the bridge. It licks its lips with a long tongue.');
    const r = await E.battle(['toad'], { bg: 'fog', boss: true });
    if (r !== 'win') return;
    S.flags.bossToad = true;
    await say(E, null, '大蝦蟆撲通一聲跳進沼澤，再也沒浮上來。', 'The great toad flops into the marsh with a splash and does not come back up.');
    await E.reload();
  },
  async fv_lodge(E) {
    await say(E, null, '「源治」──門牌上刻著獵人的名字。屋裡積滿了灰，牆上掛著一把小小的弓。', '"Genji" -- the hunter\'s name is carved by the door. Inside is thick with dust, and a little bow hangs on the wall.');
    if (E.has('shiro')) await say(E, 'shiro', '（主人以前在這裡住過……還有另一個人。小時候的那個人。）', '(Master used to live here... and someone else. Someone who was small then.)');
  },
  async fv_letter(E) {
    await say(E, null, '是一封泛黃的信。……是源治寫給妻子的。', "A yellowed letter... one Genji wrote to his wife.");
    await say(E, null, '「阿菊：我在山裡撿到一個被丟掉的孩子，取名叫影丸。他手腳很快，以後會是個好獵人。」', '"Kiku: In the hills I found a child someone had abandoned. I named him Kagemaru. He is quick of hand and foot. He will make a fine hunter."');
    await say(E, null, '「等他長大，我想帶他回村子，讓你也見見他。到時候，三個人一起吃糰子吧。」', '"When he is grown I want to bring him home to the village, so you can meet him too. Then the three of us will eat dumplings together."');
    await say(E, 'shiro', '（……影丸。是主人撿回來的那個孩子。）', '(...Kagemaru. The child master brought home.)');
  },
  async fv_kage(E) {
    E.music('melancholy');
    await say(E, 'kage', '……你們追到這裡來了啊。還有那隻狗。', "...So you followed me here. And the dog.");
    await say(E, 'shiro', '（……汪！！）', '(...WOOF!!)');
    await E.talk(N.kage(), L('沒錯，那天晚上我也在。黑鐵命令我們埋伏獵人，因為他發現了戴鬼面的是我們。', "Yes. I was there that night. Kurogane ordered us to ambush the hunter, because he had found out the masked raiders were us."),
      L('……我沒有拔刀。可是我也沒有阻止。師父看見我的臉，最後只說了一句「快逃」。', "...I never drew my blade. But I didn't stop it either. Master saw my face, and all he said was \"Run.\""),
      L('所以我逃了。逃到現在。……來吧，小白。替師父報仇吧。', "So I ran. I've been running ever since. ...Come on, Shiro. Avenge your master."));
    const r = await E.battle(['kagemaru'], { bg: 'fog', boss: true });
    if (r !== 'win') return;
    S.flags.bossKage = true;
    const talked = S.flags.lastRedeemed === 'kagemaru';
    await say(E, 'kage', talked ? '……為什麼。為什麼不讓我死在這裡。' : '……砍下來吧。我早就該死了。', talked ? '...Why. Why won\'t you let me die here.' : '...Finish it. I should have died long ago.');
    if (count('genjiletter')) await say(E, null, '小白叼出源治的信，放在影丸面前。', "Shiro takes Genji's letter in his teeth and lays it before Kagemaru.");
    const c = await E.ask(N.shiro(), L('（小白看著影丸。）', '(Shiro looks at Kagemaru.)'), [L('原諒他', 'Forgive him'), L('轉身離開', 'Turn away')]);
    if (c === 0) {
      S.flags.kageForgiven = true;
      await say(E, 'shiro', '（主人說「快逃」，是要你活下去。……不是要你逃一輩子。）', '(When master said "Run," he meant "Live." ...Not "run forever.")');
      await say(E, 'shiro', '（回黍之里去，向主人的妻子低頭。然後，好好活著。）', "(Go back to Kibi. Bow your head to master's wife. Then live properly.)");
      await say(E, 'kage', '……師父養的狗，跟師父一樣頑固啊。……我知道了。', "...Master's dog is as stubborn as master was. ...All right.");
      await got(E, 'hunterbell');
    } else await say(E, 'kage', '……也好。這樣比較輕鬆。', '...Fine. That is easier.');
    await E.talk(N.kage(), L('聽好，玄冥躲在神木底下的常夜之國。入口只有三顆根之珠到齊時才會打開。', 'Listen. Genmei hides in the Land of Endless Night beneath the sacred tree. The way in opens only when all three root-jewels are together.'),
      L('火之根在焰之鄉的火山，天之根在天狗崖頂上的雲裡，海之根在漩渦底下的龍宮。……他知道你們會去，一定設下了陷阱。', 'The fire root is in Homura\'s volcano, the sky root in the clouds above the Tengu Cliffs, the sea root in the Dragon Palace beneath the whirlpool. ...He knows you\'ll come. He will have set traps.'));
    E.music('fog');
    await say(E, null, '這時，一隻烏鴉飛來，腳上綁著老船長的信：「鬼的木匠修好了我的船，現在哪裡都能去！到潮見港來。」', 'Just then a crow arrives with a note from the old captain tied to its leg: "The oni carpenters have fixed my boat. Now we can sail anywhere! Come to Shiomi Harbour."');
    S.flags.sailing = true;
    await say(E, null, '目標：到潮見港找老船長，出海前往三條根。', 'Goal: meet the old captain at Shiomi Harbour and sail for the three roots.');
    await E.reload();
  },
  async kb_wife(E) {
    if (count('genjiletter') && !S.flags.widowLetter) {
      await say(E, '源治的妻子', '……這是，我丈夫的字。', "...That is my husband's hand.");
      await say(E, null, '她讀完信，把信緊緊抱在胸前，很久很久沒有說話。', 'She reads it, holds it tight to her chest, and says nothing for a long, long time.');
      await say(E, '源治的妻子', '他一直說，要帶一個孩子回來給我看……原來是真的。謝謝你，把他的話送回家。', 'He always said he would bring a child home for me to meet... So it was true. Thank you for bringing his words home.');
      addItem('genjiletter', -1); S.flags.widowLetter = true; E.sfx('heal');
      if (S.flags.kageForgiven) await say(E, '源治的妻子', '那個孩子……影丸，如果你見到他，告訴他：家裡的門是開著的。', 'That boy... Kagemaru. If you see him, tell him the door here is open.');
      return;
    }
    if (S.flags.widowLetter) { await say(E, '源治的妻子', S.flags.kageForgiven ? '影丸那孩子，每天都來幫我挑水。……跟我丈夫說的一樣，手腳很快。' : '我把信放在神龕上了。每天早上都讀一遍。', S.flags.kageForgiven ? 'That boy Kagemaru comes to fetch my water every day. ...Quick of hand and foot, just as my husband said.' : 'I keep the letter on the house shrine. I read it every morning.'); return; }
    await say(E, '源治的妻子', S.flags.shiro ? '小白跟著你啊……那孩子，原本只認我丈夫一個人的。' : '我丈夫死在森林裡。他的狗……到現在還守在他的墳前，怎麼叫都不回來。', S.flags.shiro ? 'Shiro follows you now... That dog never trusted anyone but my husband.' : 'My husband died in the forest. His dog... still guards his grave. It will not come home no matter how I call.');
  },
  async kb_priest(E) {
    if (S.flags.act2) {
      const r = await E.ask(L('神社的和尚', 'Shrine Monk'), S.flags.ending ? L('鬼之島的桃花，聽說連海的這一邊都聞得到香味呢。', "They say you can smell the Oni Isle's peach blossoms even on this side of the sea.") : L('神木的三條根……願神明保佑你們。', 'The three roots of the sacred tree... may the gods keep you.'), [L('交出勾玉', 'Hand over magatama'), L('聊聊', 'Chat'), L('離開', 'Leave')]);
      if (r === 0) await magatama(E);
      if (r === 1) await say(E, '神社的和尚', '古時候，人們把勾玉埋在各地，祈求神木的根伸得長長的。找到的話，帶來給我吧。', 'Long ago people buried magatama all over the land, praying the sacred tree\'s roots would reach far. If you find any, bring them to me.');
      return;
    }
    await say(E, '神社的和尚', '傳說海的另一邊有一棵永遠開花的桃樹。十五年前，那邊的花忽然謝了。', 'Legend says across the sea grows a peach tree that blooms forever. Fifteen years ago its flowers suddenly fell.');
  },
  async kb_shop(E) { await say(E, '雜貨鋪', S.flags.act2 ? '鬼的商人帶來了好多新貨！看看吧。' : '黍米、蜂巢、還有些防身的東西。看看吧。', S.flags.act2 ? 'The oni traders brought all sorts of new things! Have a look.' : 'Millet, honeycomb, a few things to keep you safe. Have a look.'); await E.shop(S.flags.act2 ? SHOPS.kibi2 : SHOPS.kibi); },

  // ---------- 潮見港 ----------
  async pt_fisher(E) {
    if (!count('rod')) {
      await say(E, '漁夫', '黑鐵家的船晚上出港，天亮才回來。船上堆滿了米袋……是從哪弄來的？', "Kurogane's ships leave at night and come back at dawn, piled high with sacks of rice... where do they get it all?");
      await say(E, '漁夫', '……你想釣魚？好啊，這支舊竿子送你。看到水面有魚影晃動，就站在旁邊按 Z。', "...You want to fish? Sure, have my old rod. When you see fish rippling, stand beside the water and press Z.");
      await got(E, 'rod');
      await say(E, '漁夫', '釣到五種魚就拿給我看看，我有好東西送你。十種的話……嘿嘿。', "Catch five kinds of fish and show me. I've something good for you. Ten kinds, and... heh heh.");
      return;
    }
    const kinds = Object.keys(S.fish).length;
    if (kinds >= 10 && !S.flags.fish10) { S.flags.fish10 = true; await say(E, '漁夫', '十種！你比我還會釣了。這是我年輕時從龍宮附近撈到的寶貝。', 'Ten kinds! You fish better than me. Here, a treasure I pulled up near the Dragon Palace when I was young.'); await got(E, 'seed_int'); await got(E, 'elixir', 2); return; }
    if (kinds >= 5 && !S.flags.fish5) { S.flags.fish5 = true; await say(E, '漁夫', '五種了！好樣的。這是獎品。', 'Five kinds! Well done. Your prize.'); await got(E, 'seed_agi'); return; }
    await say(E, '漁夫', `目前釣到 ${kinds} 種魚。龍宮的池子和常夜之國的河，聽說有很稀奇的魚喔。`, `${kinds} kinds caught so far. They say the Dragon Palace pond and the river of the Endless Night hold very strange fish.`);
  },
  async pt_captain(E) {
    if (S.flags.sailing) {
      const r = await E.ask(N.captain(), L('船修好了，比以前還快！要出海嗎？', "The boat's fixed and faster than ever! Shall we sail?"), [L('出海', 'Set sail'), L('再等等', 'Not yet')]);
      if (r === 0) await E.fadeTo('sea', 8, 20, 'r');
      return;
    }
    if (S.flags.act2) { await say(E, 'captain', '鬼的木匠正在修我的船。修好之前，我先載你們到鬼之島來回吧。', 'The oni carpenters are fixing my boat. Until then I can only ferry you to the Oni Isle and back.'); const r = await E.ask(null, L('要前往鬼之島嗎？', 'Go to the Oni Isle?'), [L('出發', 'Go'), L('再等等', 'Not yet')]); if (r === 0) await E.fadeTo('isle', 17, 25, 'u'); return; }
    if (S.flags.kiji) {
      await say(E, 'captain', '有雉雞在天上看路，就不怕迷霧了。……上船吧，孩子們。', 'With a pheasant watching the way from the sky, the fog holds no fear. ...All aboard, children.');
      const r = await E.ask(null, L('要出發前往鬼之島嗎？', 'Set sail for the Oni Isle?'), [L('出發', 'Set sail'), L('再等等', 'Not yet')]);
      if (r === 0) { E.give('boatpass'); await E.fadeTo('ship', 5, 6, 'r'); }
      return;
    }
    await E.talk(N.captain(), L('鬼之島？……那片海終年起霧，還住著海坊主。黑鐵家的船可以過，因為他們有天狗領路。', "The Oni Isle? ...Fog covers that sea all year, and the Umibozu lives there. Kurogane's ships get through because tengu guide them."),
      L('要我載你們也行，但得有能從天上看路的眼睛。', "I'll take you, but you'll need eyes that can see the way from above."),
      L('西南邊的天狗崖住著一隻雉雞，以前替漁船領過路……不過聽說牠受了傷，再也不飛了。', 'A pheasant lives at the Tengu Cliffs to the south-west. She used to guide the fishing boats... but they say she was hurt and never flew again.'));
    S.flags.captainAsked = true;
  },

  // ---------- the open sea ----------
  async sea_whirl(E) {
    if (!count('bubblecharm')) {
      E.shake(14); E.sfx('quake');
      await say(E, null, '船在漩渦邊緣打轉。……漆黑的海面下，冒出了一顆光溜溜的大頭。', 'The boat spins at the edge of the whirlpool. ...From the black water rises a great bald head.');
      await say(E, '海坊主', '……又是你們。上次的事，對不起。我被黑鐵的船吵得昏了頭。', '...You again. About last time: I\'m sorry. Kurogane\'s ships had driven me half mad.');
      await say(E, '海坊主', '要去龍宮嗎？那裡的海龍大人也病了……拿著這顆珠子。帶著它，海水就會讓路。', 'Going to the Dragon Palace? The sea dragon there has fallen ill too... Take this pearl. With it, the sea will part for you.');
      await got(E, 'bubblecharm');
      E.sfx('bubble');
    }
    const r = await E.ask(null, L('漩渦的底下，就是龍宮。要潛下去嗎？', 'The Dragon Palace lies beneath the whirlpool. Dive?'), [L('潛下去', 'Dive'), L('不要', 'No')]);
    if (r !== 0) return;
    E.sfx('bubble'); E.flash('#3070e0', 30);
    await E.fadeTo('reef', 16, 2, 'd');
  },

  // ---------- 焰之鄉 and the volcano: Natsume's story ----------
  async ho_arrive(E) {
    const g = actor(E, 'gokiH2', 17, 18, 'd', 'DemonGreen');
    await say(E, 'goki', '歡迎來到焰之鄉。……我們鬼的祖先，一百年前就是從這裡逃走的。', 'Welcome to Homura. ...A hundred years ago, our oni ancestors fled from here.');
    await E.talk(N.goki(), L('火山之靈「炎王」突然發狂，熔岩吞了一半的村子。留下來的人，就在這灰裡過日子。', 'The volcano\'s spirit, the Flame King, went mad, and lava swallowed half the village. Those who stayed have lived in the ash ever since.'),
      L('我的哥哥焰丸也留下了。他一個人守著火之根，一百年。……他恨人類。', 'My brother Homuramaru stayed too. He has guarded the fire root alone for a hundred years. ...He hates humans.'),
      L('去年黑鐵的人跑來挖礦，把村裡的鬼抓去當苦工。聽說還有一群從猿啼山賣過來的猴子。', 'Last year Kurogane\'s men came to dig the mines and dragged the oni off as labour. They say there was a troop of monkeys sold from Monkey-Cry Mountain too.'));
    if (E.has('natsume')) {
      await say(E, 'natsume', '猴子……？從猿啼山來的？……媽媽。媽媽說不定就在裡面！', "Monkeys...? From Monkey-Cry Mountain? ...Mama. Mama might be in there!");
      await say(E, 'natsume', '狸大王那個胖子，抓走小傢伙們的爸媽的時候，把媽媽也……！', 'When that fat Tanuki King took the little ones\' parents, he took Mama too...!');
    }
    E.removeEnt(g);
    await say(E, null, '目標：登上北邊的炎嶽，前往火之根。', 'Goal: climb Mount Homura to the north and reach the fire root.');
  },
  async ho_inndoor(E) { await say(E, null, '鬼的旅店。門口掛著溫泉的布簾。', 'An oni inn. A hot-spring curtain hangs over the door.'); },
  async ho_smithdoor(E) { await say(E, null, '鍛冶場裡熱氣騰騰，傳出鏗鏗的打鐵聲。', 'The smithy is sweltering, ringing with hammer blows.'); },
  async ho_goki(E) { await say(E, 'goki', S.flags.bossFlame ? (S.flags.redeemed_homuramaru ? '哥哥回村子了。……一百年了啊。謝謝你，桃丸。' : '火山安靜下來了。哥哥他……還是不肯下山。') : '炎嶽的入口在村子北邊。熔岩很燙，別掉下去。', S.flags.bossFlame ? (S.flags.redeemed_homuramaru ? 'My brother has come home. ...A hundred years. Thank you, Momomaru.' : 'The volcano has gone quiet. My brother... still will not come down.') : 'The way up Mount Homura is north of the village. The lava is hot. Don\'t fall in.'); },
  async ho_elder(E) { await say(E, '焰之鄉的長老', S.flags.bossFlame ? '火山又溫柔了。今年也許能種地瓜了。' : '炎王原本是溫柔的火神，替我們暖著土地。是有人在祂的心裡下了咒。', S.flags.bossFlame ? 'The volcano is gentle again. Perhaps this year we can grow sweet potatoes.' : 'The Flame King was once a gentle fire god who kept our soil warm. Someone put a curse in its heart.'); },
  async ho_smith(E) {
    if (!S.flags.smithMet) { S.flags.smithMet = true; await say(E, '鍛冶師', '人類？……算了，客人就是客人。拿材料來，我就替你打。鬼的手藝，可不輸人類喔。', "A human? ...Never mind. A customer's a customer. Bring me materials and I'll forge for you. Oni craft is a match for any human's."); }
    const r = await E.ask(L('鍛冶師', 'Smith'), L('要打造什麼？鐵礦、鬼角、龍鱗……材料齊了就行。', 'What shall I forge? Iron ore, oni horn, dragon scale... as long as you have the materials.'), [L('打造', 'Forge'), L('不用了', 'Never mind')]);
    if (r === 0) await forge(E);
  },
  async ho_shop(E) { await say(E, '鬼的雜貨', '火山的東西都在這了。防火符很好用喔。', 'Everything for the volcano is right here. The fireproof charm is very handy.'); await E.shop(SHOPS.homura); },
  async ho_onsen(E) {
    const r = await E.ask(L('溫泉的婆婆', 'Bath Keeper'), L('泡個溫泉吧。火山的熱水，什麼傷都能治好。', 'Have a soak. The volcano\'s water heals any wound.'), [L('泡溫泉', 'Soak'), L('不用了', 'No thanks')]);
    if (r !== 0) return;
    await E.rest(L('大家泡在熱騰騰的溫泉裡，傷和疲勞都消失了。', 'Everyone soaks in the steaming spring. All wounds and weariness melt away.'));
    if (!S.flags.onsenBond && S.members.length >= 4) {
      S.flags.onsenBond = true; S.flags.bond = Math.min(12, (S.flags.bond || 0) + 1);
      await say(E, 'natsume', '……喂，雉，你的羽毛濕了好好笑。', '...Hey, Kiji, you look so funny with wet feathers.');
      await say(E, 'kiji', '小白還不是一樣，整隻縮小了一圈！', 'So does Shiro, he shrank to half his size!');
      await say(E, 'shiro', '（……汪。）', '(...Woof.)');
      await say(E, null, `大家笑成一團。夥伴們的羈絆更深了！（羈絆 ${S.flags.bond}）`, `Everyone collapses laughing. Your bond grows deeper! (Bond ${S.flags.bond})`);
    }
  },
  async ho_kid(E) { await say(E, '鬼的小孩', S.flags.bossFlame ? '火山不再噴火了！我要去看鬼之島的桃花！' : '你是人類？……你的頭上沒有角耶。好可憐。', S.flags.bossFlame ? 'The volcano stopped erupting! I want to see the peach blossoms on the Oni Isle!' : "You're a human? ...You don't have any horns. Poor thing."); },
  async ho_inn(E) { const r = await E.ask(L('旅店老闆娘', 'Innkeeper'), L('要住一晚嗎？30 金幣。', 'Stay the night? 30 gold.'), [L('住宿', 'Stay'), L('不用了', 'No')]); if (r !== 0) return; if (S.gold < 30) { await say(E, '旅店老闆娘', '錢不夠喔。', "You haven't enough."); return; } S.gold -= 30; await E.rest(L('在鬼的旅店好好睡了一覺。', 'You sleep soundly at the oni inn.')); E.save(); await say(E, null, L('（已存檔）', '(Saved)'), ''); },
  async ho_mama(E) { await say(E, '棗的媽媽', '棗那孩子，以前連一顆栗子都捨不得分人……謝謝你們讓她變成這麼好的孩子。', 'My Natsume never used to share so much as a chestnut... Thank you for making her such a good girl.'); },
  async ho_homura(E) { await say(E, 'homura', '……一百年，我只看著火。現在，我想看看弟弟說的桃花。', '...For a hundred years I watched only fire. Now I want to see the peach blossoms my brother talks about.'); },
  async vo_sign(E) { await say(E, null, '石碑：「巨岩擋路時，把它推到發光的石板上。推錯了的話，走出火山再進來，岩石就會回到原位。」', 'Stone: "When boulders bar the way, push them onto the glowing plates. Push one wrong, and leave the mountain and return; the boulders will be back where they began."'); },
  async vo_mother(E) {
    await say(E, null, '岩石的另一頭，傳來微弱的叫聲。', 'From the far side of the boulder comes a faint cry.');
    await say(E, '？？？', '……有人嗎……救救我們……', '...Is anyone there... help us...');
    if (!E.has('natsume')) return;
    await say(E, 'natsume', '這個聲音……媽媽！？媽媽──！', 'That voice... Mama!? MAMA--!');
    await say(E, null, '棗撲上去推那塊巨岩。巨岩動也不動。', 'Natsume throws herself against the boulder. It does not move.');
    await say(E, 'natsume', '動啊……動啊！我偷了那麼多東西，學會那麼多壞事……可是我最想要的，就只有這個！', 'Move... MOVE! I stole so much, learned every bad trick there is... but this is all I ever really wanted!');
    await say(E, 'momo', '棗，我們跟你一起推！', "Natsume, we'll push with you!");
    E.sfx('quake'); E.shake(20);
    await say(E, null, '轟隆隆──巨岩滾開了！', 'Rumble-rumble-- the boulder rolls aside!');
    S.flags.natsumeStrong = true;
    E.sfx('level');
    await say(E, null, '棗學會了「怪力」！\n朝巨岩走過去，就能推動它。', 'Natsume found her Mighty Strength!\nWalk into a great boulder to push it.');
    const mama = actor(E, 'mamaV', 15, 30, 'd', 'MonkeyGrey');
    await say(E, '棗的媽媽', '棗……真的是棗嗎？長這麼大了……', 'Natsume... is it really you? You\'ve grown so...');
    await say(E, 'natsume', '……媽媽，對不起。我一直以為，是我不夠乖，你才不見的……', "...Mama, I'm sorry. I always thought you disappeared because I wasn't good enough...");
    await say(E, '棗的媽媽', '傻孩子。猿啼山的小傢伙們，都是你養大的吧？媽媽都聽說了。', 'Silly child. You raised all the little ones on Monkey-Cry Mountain, didn\'t you? Mama heard everything.');
    await say(E, '棗的媽媽', '礦坑裡還有一個額頭有疤的鬼，他一直護著我們……拜託你們也救救他。他在西邊的岩壁上。', 'There\'s an oni with a scar on his brow in the mine. He protected us all this time... Please save him too. He\'s up on the western rock face.');
    E.removeEnt(mama);
    S.flags.natsumeMom = true;
    await say(E, null, '棗的媽媽回焰之鄉去了。', "Natsume's mother heads back to Homura.");
    await E.reload();
  },
  async vo_father(E) {
    await say(E, '額頭有疤的鬼', '人類……？你們不是黑鐵的人？', "Humans...? You're not Kurogane's?");
    await say(E, 'momo', '鬼之島上，有一位媽媽託我們找你。她說孩子們都還活著。', 'On the Oni Isle, a mother asked us to find you. She said the children are all still alive.');
    await say(E, '額頭有疤的鬼', '……！孩子們……活著……', '...! The children... alive...');
    await say(E, '額頭有疤的鬼', '這是我從黑鐵眼皮底下藏起來的金子。拿去吧。我要回家了。', "Here, gold I hid right under Kurogane's nose. Take it. I'm going home.");
    S.flags.fatherFreed = true; S.flags.fatherHome = true;
    await got(E, 'gold');
    await E.reload();
  },
  async vo_homura(E) {
    E.music('boss');
    await E.talk(N.homura(), L('人類！一百年前燒我村子的是火山，去年抓我族人的是人類。你們每次來，都只會奪走東西！', 'Humans! A hundred years ago the volcano burned my village; last year humans took my people. Every time you come, you only take!'),
      L('火之根，誰也別想碰！', 'No one touches the fire root!'));
    await say(E, 'momo', '我們不是來奪走的！是來救神木的！剛鬼也……', "We're not here to take anything! We're here to save the sacred tree! Goki too--");
    await say(E, null, '（提示：焰丸也許聽得進話。把他打到一半以下，再試試「說服」。）', '(Hint: Homuramaru might listen. Wear him below half and try Talk.)');
    const r = await E.battle(['homuramaru'], { bg: 'volcano', boss: true });
    if (r !== 'win') return;
    S.flags.bossHomura = true;
    if (S.flags.lastRedeemed === 'homuramaru') {
      await say(E, 'homura', '……剛鬼那傢伙，寫信說「人類裡也有好傢伙」。我還以為他被騙了。', '...That Goki wrote to me: "There are good ones among the humans." I thought he\'d been fooled.');
      await say(E, 'homura', '去吧。炎王就在上面。……它也很痛苦。替我讓它安息。', "Go. The Flame King is up there. ...It is suffering too. Let it rest, for me.");
    } else await say(E, 'homura', '……哼。強者通行。隨你們吧。', '...Hmph. The strong may pass. Do as you like.');
    await E.reload();
  },
  async vo_flame(E) {
    await say(E, null, '火之根盤繞在熔岩裡。根的上方，一團巨大的火焰在痛苦地扭動。', 'The fire root coils through the lava. Above it, a vast flame writhes in pain.');
    await say(E, '炎王', '咒……好痛……全部……燒掉……！', 'The curse... it burns... burn... everything...!');
    await say(E, null, '（提示：炎王會先「聚火」，下一回合放出大噴火。看到聚火就快防禦！牠怕水。）', '(Hint: the Flame King gathers fire, then erupts the next turn. Guard when it gathers! It fears water.)');
    const r = await E.battle(['flameking'], { bg: 'volcano', boss: true });
    if (r !== 'win') return;
    S.flags.bossFlame = true;
    E.sfx('holy'); E.flash('#f8a040', 40);
    await say(E, null, '黑色的咒煙從火焰中散去。火焰縮成一盞溫暖的小火，落在根上。', 'Black cursed smoke drains out of the flame. It shrinks to a small, warm fire and settles on the root.');
    await say(E, '炎王', '……謝謝你，神木的孩子。拿去吧，這是根的心。', '...Thank you, child of the tree. Take it. This is the heart of the root.');
    gotJewel('jewel_fire'); E.sfx('chest');
    await say(E, null, `得到了火之珠！（根之珠 ${jewels()}/3）`, `Got the Fire Root-Jewel! (Root-jewels ${jewels()}/3)`);
    await got(E, 'flamestone', 2);
    if (S.flags.redeemed_homuramaru) {
      const h = actor(E, 'homuraV', 13, 4, 'r', 'DemonRed');
      await say(E, 'homura', '……火變溫柔了。跟一百年前一樣。我要下山了，回村子去。', '...The fire is gentle again. Just like a hundred years ago. I am going down the mountain, home.');
      E.removeEnt(h);
    }
    await E.reload();
  },

  // ---------- the clouds: Kiji's story ----------
  async cl_redtengu(E) {
    if (S.flags.windRoad) { await say(E, '赤天狗', '風之路一直為你們開著。弟弟就拜託了。', 'The wind road is open for you always. I leave my brother to you.'); return; }
    await E.talk(L('赤天狗', 'Red Tengu'), L('你們來了。……本座的弟弟青天狗，住在雲上之里，守著天之根。', "You've come. ...My younger brother, the Blue Tengu, lives in the village above the clouds and guards the sky root."),
      L('玄冥的咒爬上了天之根，弟弟被咒吞噬，把雲上的天狗都趕走了。', "Genmei's curse has climbed the sky root, and swallowed my brother. He has driven the other tengu from the clouds."),
      L('羽扇已經從黑鐵那裡拿回來了。用它打開風之路吧。……小雉，雲上之里住著你的族人。', "I have my fan back from Kurogane. Use it to open the wind road. ...Little Kiji, your own people live in the cloud village."));
    if (E.has('kiji')) await say(E, 'kiji', '……我的、族人？', '...My... people?');
    await got(E, 'windfan');
    S.flags.windRoad = true;
    await say(E, null, '崖頂吹起了一道向上的風。面對它按 Z，就能上到雲上。', 'A wind starts rising from the clifftop. Face it and press Z to ride up to the clouds.');
    await E.reload();
  },
  async sv_arrive(E) {
    await say(E, null, '腳底下踩的是軟綿綿的雲。天狗的屋子一棟棟浮在雲海上。', 'Under your feet is soft cloud. The tengu\'s houses float one by one on a sea of clouds.');
    if (E.has('kiji')) await say(E, 'kiji', '……這個味道。我記得。好小好小的時候，我在這裡……', '...This smell. I remember it. When I was very, very small, I was here...');
  },
  async sv_lodge(E) { await say(E, null, '天狗的屋子。門上掛著烏鴉的羽毛。', "A tengu's house. Crow feathers hang over the door."); },
  async sv_shrine(E) { await say(E, null, '雲之神社。供桌上放著一杯雲霧茶。', 'The cloud shrine. A cup of cloud tea sits on the altar.'); },
  async sv_mother(E) {
    if (S.flags.kijiMom) { await say(E, '雉的媽媽', '小雉，要回來吃飯喔。媽媽等你。', 'Little Kiji, come home for supper. Mama will be waiting.'); return; }
    await say(E, '雉雞', '……那個尾羽的花紋。你、你是……小雉？', "...That pattern on your tail. You... you're little Kiji?");
    if (!E.has('kiji')) return;
    await say(E, 'kiji', '……媽媽？', '...Mama?');
    await E.talk(L('雉的媽媽', "Kiji's Mother"), L('那年的暴風把你從巢裡捲走，我找了你好久好久……大家都說你掉進海裡了……', 'That year the storm swept you out of the nest, and I searched and searched... everyone said you fell into the sea...'),
      L('你……長大了。還會飛了嗎？', "You've... grown. Can you fly now?"));
    await say(E, 'kiji', '……有一陣子不敢了。可是我遇到了大家。只要看著他們，我就能飛。', "...For a while I didn't dare. But then I met everyone. As long as I look at them, I can fly.");
    await say(E, '雉的媽媽', '那媽媽教你最後一件事吧：雲上之道到處都是上升的氣流。張開翅膀乘上去，就能帶著同伴飛到別的雲上。', "Then let Mama teach you one last thing: the cloud road is full of rising winds. Spread your wings and ride them, and you can carry your friends to other clouds.");
    S.flags.kijiMom = true; S.flags.kijiGlide = true; E.sfx('level');
    await say(E, null, '雉學會了「乘風」！\n在雲上之道的上升氣流前按 Z，就能帶大家飛過去。', 'Kiji learned to Ride the Wind!\nPress Z at an updraft on the cloud road to fly everyone across.');
    await say(E, '雉的媽媽', '青天狗大人在雲上之道的最頂端。……祂原本是很溫柔的。拜託你們了。', 'Lord Blue Tengu is at the very top of the cloud road. ...He was always so gentle. Please help him.');
  },
  async sv_shop(E) { await say(E, '烏天狗', '雲上的貨。雷之符對雲裡的妖怪很有效喔。', 'Goods from the clouds. Thunder talismans work wonders on cloud spooks.'); await E.shop(SHOPS.sky); },
  async sv_elder(E) { await say(E, '老天狗', S.flags.bossBlue ? '青天狗大人醒過來了。雲又白了。' : '青天狗大人把我們趕下來之後，雲就一天天變灰了。上去的路在村子北邊。', S.flags.bossBlue ? 'Lord Blue Tengu has woken. The clouds are white again.' : 'Since Lord Blue Tengu drove us down, the clouds grow greyer every day. The way up is north of the village.'); },
  async sv_tea(E) { await say(E, '茶屋的和尚', '雲霧茶葉泡成抹茶，能解百毒，連睡意都趕得走。在爐灶做做看吧。', 'Brew cloud tea leaves into matcha and it cures any poison, even drowsiness. Try it at a hearth.'); },
  async sv_kid(E) { await say(E, '小烏天狗', '我長大要像赤天狗大人一樣，搧一下扇子就颳颱風！', "When I grow up I'll be like Lord Red Tengu and whip up a typhoon with one flap of my fan!"); },
  async sv_flock(E) { await say(E, '雉雞', S.flags.kijiMom ? '小雉回來了！今天要開宴會！' : '雲下面的世界是什麼樣子？聽說有一種叫糰子的東西……', S.flags.kijiMom ? "Little Kiji is back! Tonight we feast!" : "What's the world below the clouds like? They say there's a thing called a dumpling..."); },
  async cl_mirage(E) {
    await say(E, null, '雲橋上蹲著一團巨大的雲。中間有一隻眼睛眨了眨。', 'A huge cloud squats on the cloud bridge. An eye in its middle blinks.');
    const r = await E.battle(['cloudking'], { bg: 'cloud', boss: true });
    if (r !== 'win') return;
    S.flags.bossCloud = true;
    await say(E, null, '雲蜃散成了一片薄霧。', 'The Cloud Mirage breaks apart into a thin mist.');
    await E.reload();
  },
  async cl_blue(E) {
    await E.talk(L('青天狗', 'Blue Tengu'), L('走開……走開！這朵雲是我的！誰也不准靠近天之根！', 'Away... AWAY! This cloud is mine! No one comes near the sky root!'));
    await say(E, null, '（提示：青天狗會輪流張開「風之壁」（刀劍無效）和「金剛之壁」（法術無效）。看準了再出手。）', '(Hint: the Blue Tengu switches between a Wall of Wind, which turns blades, and a Diamond Wall, which turns magic. Watch which is up.)');
    const r = await E.battle(['bluetengu'], { bg: 'cloud', boss: true });
    if (r !== 'win') return;
    S.flags.bossBlue = true;
    E.sfx('holy'); E.flash('#e8f4ff', 40);
    await E.talk(L('青天狗', 'Blue Tengu'), L('……我做了什麼。把族人趕下雲，還把風颳向小雉……', "...What have I done. Driven my people from the clouds, and turned the wind on little Kiji..."),
      L('十五年前那場把你從巢裡捲走的暴風……也許，咒從那時就開始了。對不起。', "The storm fifteen years ago that tore you from the nest... perhaps the curse began even then. Forgive me."));
    if (E.has('kiji')) await say(E, 'kiji', '……如果沒有那陣風，我就不會掉下去，也不會遇到大家了。所以，沒關係。', "...If not for that wind, I'd never have fallen, and I'd never have met everyone. So it's all right.");
    gotJewel('jewel_sky'); E.sfx('chest');
    await say(E, null, `得到了天之珠！（根之珠 ${jewels()}/3）`, `Got the Sky Root-Jewel! (Root-jewels ${jewels()}/3)`);
    await got(E, 'tengufeather', 2);
    await E.reload();
  },

  // ---------- the castaway's island ----------
  async il_hut(E) { await say(E, null, '漂流木搭的小屋。牆上用炭畫了好多條線，數著日子。', 'A hut of driftwood. Charcoal tally marks cover the wall, counting the days.'); },
  async il_castaway(E) {
    if (S.flags.castawayFed) { await say(E, '漂流的老人', '我決定留在這座島上了。釣魚、看海……其實也不壞。', "I've decided to stay on this island. Fishing, watching the sea... it's not so bad."); return; }
    await say(E, '漂流的老人', '人、人類！十年了，我第一次看到人！', 'P-people! Ten years, and the first person I\'ve seen!');
    await say(E, '漂流的老人', '我是漁夫，船翻了漂到這裡……好想吃一口鯛魚啊。這附近的海，我怎麼釣都釣不到。', "I was a fisherman. My boat capsized and I washed up here... how I long for a bite of sea bream. However I fish these waters, I never catch one.");
    if (!count('f_tai')) return;
    const r = await E.ask(null, L('要把真鯛送給老人嗎？', 'Give the old man a red sea bream?'), [L('送給他', 'Give it'), L('不要', 'No')]);
    if (r !== 0) return;
    addItem('f_tai', -1); S.flags.castawayFed = true; E.sfx('heal');
    await say(E, '漂流的老人', '……這個味道。是家鄉的味道啊……謝謝你，年輕人。', "...This taste. The taste of home... Thank you, young man.");
    await say(E, '漂流的老人', '這是我在島上撿到的卷軸，送你吧。', 'Here, a scroll I found on the island. It\'s yours.');
    await got(E, 'scroll_kawarimi');
  },
  async il_bamboo(E) {
    await say(E, null, '竹林深處，一根巨大的竹子張開了嘴。', 'Deep in the grove, a giant bamboo opens its mouth.');
    const r = await E.battle(['bambooking'], { bg: 'islet', boss: true });
    if (r !== 'win') return;
    S.flags.bossBamboo = true;
    await say(E, null, '竹林之王倒下了，竹葉沙沙作響。', 'The Bamboo King falls, and the leaves rustle.');
    await E.reload();
  },

  // ---------- the Coral Road and the Dragon Palace ----------
  async rf_enter(E) { await say(E, null, '海水在避水珠周圍分開，形成一個大泡泡。……可以在海底呼吸了！', 'The sea parts around the pearl in a great bubble. ...You can breathe under the sea!'); },
  async rf_gate(E) { await say(E, null, '一個巨大的貝殼擋住了路。貝殼上有一個鑰匙孔形狀的凹槽。', 'A giant shell blocks the way. There is a keyhole-shaped groove in it.'); if (E.has('shiro')) await say(E, 'shiro', '（嗅嗅……鑰匙的味道，在西邊的沙子裡。）', '(Sniff... the key smells like it\'s in the sand to the west.)'); },
  async rf_ink(E) {
    await say(E, null, '狹窄的珊瑚縫裡，伸出了好幾條巨大的觸手。', 'Huge tentacles reach out of the narrow coral gap.');
    const r = await E.battle(['inklord'], { bg: 'reef', boss: true });
    if (r !== 'win') return;
    S.flags.bossInk = true;
    await say(E, null, '墨之主噴出最後一口墨，逃進了深海。', 'The Ink Lord squirts one last cloud of ink and flees into the deep.');
    await E.reload();
  },
  async pa_enter(E) { await say(E, null, '珊瑚與珍珠蓋成的宮殿。魚兒們在走廊上游來游去。', 'A palace of coral and pearl. Fish swim up and down the halls.'); },
  async pa_door(E) { await say(E, null, '通往深處的門緊閉著。門後傳來低沉的呻吟。', 'The door to the inner hall is shut tight. A low moan comes from behind it.'); },
  async pa_shione(E) {
    if (S.flags.bossDragon) { await say(E, 'shione', '父親大人恢復了。龍宮又能唱歌了。……桃丸，常夜之國很冷，要小心喔。', "Father has recovered. The palace can sing again. ...Momomaru, the Endless Night is cold. Take care."); return; }
    if (S.flags.shioneAsked) { await say(E, 'shione', '父親大人就在深處的大殿裡。……拜託你們了。', 'Father is in the great hall within. ...Please.'); return; }
    await E.talk(N.shione(), L('陸上來的客人？……我是龍宮的公主，汐音。', 'Guests from the land? ...I am Shione, princess of the Dragon Palace.'),
      L('我的父親，海龍蒼淵，守護著神木的海之根。可是一個月前，祂的眼睛忽然變得混濁，見誰咬誰……', 'My father, Soen the sea dragon, guards the sacred tree\'s sea root. But a month ago his eyes clouded over, and now he bites anyone who comes near...'),
      L('如果你們能讓父親醒過來……深處的門，我替你們打開。', 'If you can wake my father... I will open the inner door for you.'));
    S.flags.shioneAsked = true; E.sfx('gate');
    await say(E, null, '深處的門打開了。', 'The inner door opens.');
    await E.reload();
  },
  async pa_dragon(E) {
    await say(E, null, '大殿裡盤著一條青色的海龍。牠的眼睛裡，翻滾著黑色的咒。', 'A blue sea dragon lies coiled in the great hall. Black curses churn in its eyes.');
    await say(E, '海龍 蒼淵', '……出去……海之根……誰也……', '...Get out... the sea root... no one...');
    await say(E, null, '（提示：海龍會潛進深海躲開攻擊，下一回合帶著海嘯回來。牠怕雷。）', '(Hint: the sea dragon dives out of reach, then comes back as a tsunami the next turn. It fears thunder.)');
    const r = await E.battle(['seadragon'], { bg: 'palace', boss: true });
    if (r !== 'win') return;
    S.flags.bossDragon = true;
    E.sfx('holy'); E.flash('#a0e0ff', 40);
    await say(E, '海龍 蒼淵', '……我睡了好長一場噩夢。是你們叫醒我的嗎。謝謝。', '...I have had a long nightmare. Was it you who woke me? Thank you.');
    await say(E, '海龍 蒼淵', '這是海之根的珠子。玄冥那傢伙……三百年前，他也想偷我的鱗片去煉長生藥。', 'Here is the sea root\'s jewel. That Genmei... three hundred years ago he tried to steal my scales for an elixir of life too.');
    gotJewel('jewel_sea'); E.sfx('chest');
    await say(E, null, `得到了海之珠！（根之珠 ${jewels()}/3）`, `Got the Sea Root-Jewel! (Root-jewels ${jewels()}/3)`);
    await got(E, 'dragonscale', 2);
    await E.reload();
  },
  async pa_fish1(E) { await say(E, '鯛魚侍女', '龍宮的時間跟陸上不一樣喔。……開玩笑的，一樣的。', 'Time in the Dragon Palace runs differently from the land. ...Just kidding, it\'s the same.'); },
  async pa_fish2(E) { await say(E, '黃魚', '池子裡偶爾會游出龍魚喔！傳說吃了它……不，不能吃，它會變成龍。', 'Sometimes a dragonfish swims in the pond! They say if you eat one... no, you mustn\'t, it turns into a dragon.'); },
  async pa_fish3(E) { await say(E, '白魚', '咕嚕咕嚕……汐音公主每天都在哭。', 'Blub blub... Princess Shione cries every day.'); },
  async pa_turtle(E) { await say(E, '老龜', '三百年前，有一個年輕的守木人來過龍宮。他說他怕死，怕得睡不著……', 'Three hundred years ago a young tree-keeper came to the palace. He said he feared death so much he could not sleep...'); },
  async pa_shop(E) { await say(E, '水忍', '海底的貨。珊瑚棍輕又硬，猴子一定喜歡。', 'Goods from the deep. The coral staff is light and hard. A monkey would love it.'); await E.shop(SHOPS.palace); },
  async pa_inn(E) { const r = await E.ask(L('龍宮的侍女', 'Palace Maid'), L('要休息一下嗎？', 'Will you rest a while?'), [L('休息', 'Rest'), L('不用了', 'No')]); if (r === 0) { await E.rest(L('在珍珠的床上睡了一覺。', 'You sleep on a bed of pearl.')); E.save(); } },

  // ---------- the Oni Isle in the later chapters ----------
  async is_akane(E) {
    if (S.flags.ending) { await say(E, 'akane', '神木今年也開得很好。……謝謝你，桃丸。', 'The sacred tree blooms well again this year. ...Thank you, Momomaru.'); return; }
    if (S.flags.festivalOver) { await say(E, 'akane', '常夜之國的門開了。……梅奶奶就在裡面。桃丸，帶她回來！', 'The gate to the Endless Night is open. ...Granny Ume is in there. Momomaru, bring her home!'); return; }
    if (S.flags.jewel3) {
      await E.talk(N.akane(), L('三顆根之珠都到齊了……神木的咒退下去了一些。', 'All three root-jewels together... the curse on the tree has eased a little.'),
        L('以前，每年神木開花的時候，鬼會划船到對岸，和人類一起過祭典。神木最喜歡那個時候了。', 'In the old days, when the tree bloomed, the oni rowed across and held a festival with the humans. The tree loved that time most of all.'),
        L('打開常夜之門之前，我們辦一場祭典吧。人和鬼一起。讓神木再看一次大家的笑臉。', 'Before we open the gate of the Endless Night, let us hold a festival. Humans and oni together. Let the tree see everyone smiling once more.'));
      const r = await E.ask(null, L('前往黍之里的桃花祭嗎？', 'Go to the peach festival at Kibi?'), [L('出發', 'Go'), L('再等等', 'Not yet')]);
      if (r !== 0) return;
      S.flags.festival = true;
      await E.fadeText(L('── 第三部　桃花祭 ──', '-- Part Three: The Peach Festival --'));
      await E.fadeTo('kibi', 26, 13, 'u');
      await say(E, null, '黍之里掛滿了燈籠。鬼的船一艘接一艘靠岸，村子裡到處都是笑聲。', 'Kibi is hung with lanterns. Oni boats pull in one after another, and laughter fills the village.');
      await say(E, null, '目標：享受祭典。準備好了，就到神社旁找茜。', 'Goal: enjoy the festival. When you are ready, find Akane by the shrine.');
      return;
    }
    if (S.flags.act2) {
      const h = hearts();
      await say(E, 'akane', `根之珠 ${jewels()}/3。……火山、雲上、海底，坐船就能到。天狗崖頂的赤天狗會替你們打開風之路。`, `Root-jewels ${jewels()}/3. ...The volcano, the clouds, the sea. The boat can take you. The Red Tengu at the top of the Tengu Cliffs will open the wind road.`);
      await say(E, 'akane', h >= 6 ? '你的身上，有好多人的心意。……神木感覺得到。' : '神木在聽。聽你幫助過的每一個人的心意。……那些心意，也許能代替一顆心。', h >= 6 ? 'You carry so many people\'s kindness with you. ...The tree can feel it.' : "The tree is listening. To the kindness of everyone you help. ...That kindness might take the place of a heart.");
      return;
    }
    await say(E, 'akane', S.flags.boss6 ? '黑鐵就在砦的最上面。……桃丸，拜託你了。' : '砦在島的東北邊。被抓走的人，如果你願意……請和他們說說話。他們不是自願拿刀的。', S.flags.boss6 ? 'Kurogane waits at the very top of his fortress. ...Momomaru, I am counting on you.' : 'The fortress is in the north-east of the island. The ones he took... if you are willing, talk to them. They did not take up their blades by choice.');
  },
  async is_mother(E) {
    if (S.flags.fatherHome) { await say(E, '鬼的母親', '他回來了！額頭的疤一點都沒變……謝謝你，人類的孩子！', "He came home! The scar on his brow just the same... Thank you, child of the humans!"); return; }
    await say(E, '鬼的母親', S.flags.act2 ? '我丈夫……聽說黑鐵的人把抓去的鬼送到焰之鄉的礦坑去了。' : '我的丈夫被抓進了砦裡。……如果你看到一個額頭有疤的鬼，請告訴他，孩子們都還活著。', S.flags.act2 ? "My husband... they say Kurogane's men sent the oni they took to the mines of Homura." : "My husband was taken into the fortress. ...If you see an oni with a scar on his brow, tell him the children are still alive.");
  },
  async is_father(E) { await say(E, '額頭有疤的鬼', '孩子們長得好快。……我錯過了一年。剩下的，一天都不會再錯過了。', "The children have grown so fast. ...I missed a year. I won't miss another day."); },
  async is_homura(E) { await say(E, 'homura', '這就是桃花……不，還沒開啊。……我等。等了一百年，再等一下也沒關係。', 'So these are peach blossoms... no, not open yet. ...I will wait. A hundred years I waited. A little longer is nothing.'); },
  async is_shop(E) { await say(E, '鬼的商人', S.flags.act2 ? '對岸的貨又進來了！' : '人類的錢？……能用。這些都是以前和對岸換來的東西。', S.flags.act2 ? 'Goods from across the sea again!' : 'Human money? ...It still spends. These are all things we traded for across the sea, long ago.'); await E.shop(S.flags.act2 ? SHOPS.isle2 : SHOPS.isle); },
  async is_gate(E) {
    if (!S.flags.festivalOver) { await say(E, null, '神木的根之間，有一道發光的結界。', 'A shining barrier stands among the roots of the sacred tree.'); return; }
    const r = await E.ask(null, L('神木的根之間，開著一道通往常夜之國的門。要進去嗎？', 'Among the roots of the sacred tree, a gate to the Land of Endless Night stands open. Go in?'), [L('進去', 'Enter'), L('再等等', 'Not yet')]);
    if (r !== 0) return;
    E.sfx('abyss'); E.flash('#200030', 30);
    await E.fadeTo('yomi1', 16, 34, 'u');
  },

  // ---------- the oni dojo ----------
  async dj_master(E) {
    if (!S.flags.dojoMet) {
      S.flags.dojoMet = true;
      await say(E, '師範', '嘿嘿嘿，好久不見啊，桃子小子！……認不出來了？我就是猿啼山的狸大王！', "Heh heh heh, long time no see, peach boy! ...Don't recognise me? I'm the Tanuki King of Monkey-Cry Mountain!");
      await say(E, '師範', '被你們打醒之後，我把栗子林還給猴子，跑來這裡教鬼的小鬼們堂堂正正地打架。', 'After you knocked some sense into me, I gave the chestnut groves back to the monkeys and came here to teach the oni young ones to fight fair.');
      await say(E, '師範', '這是門生的名牌。想挑戰的話，隨時來！', 'Here, a student\'s name tag. Come and take a rank whenever you like!');
      await got(E, 'dojopass');
    }
    await dojo(E);
  },
  async dj_desk(E) { await say(E, '道場的鬼', '每一段都是三場連戰，中間不能休息、不能逃。輸了也不會死，放心吧。最高的「王之段」，師範會親自下場喔。', 'Each rank is three bouts in a row: no rest, no running. Losing won\'t kill you, don\'t worry. At the top, King\'s Rank, the master fights you himself.'); },
  async dj_fan(E) { await say(E, '鬼的姑娘', '師範練成金身之後，連剛鬼大人都打不贏他喔！', "Since the master took on his golden body, not even Lord Goki can beat him!"); },
  async dj_fan2(E) { await say(E, '鬼的小孩', '我也要拿到名牌！……可是我現在只會哭。', "I want a name tag too! ...But right now all I can do is cry."); },

  // ---------- 桃花祭: the festival ----------
  async fe_mochi(E) {
    const r = await E.ask(L('搗麻糬的鬼', 'Mochi Oni'), L('來搗麻糬吧！圈圈合上的時候揮下去。搗得好，有獎品喔！', 'Come pound some mochi! Swing as the ring closes. Pound well and there\'s a prize!'), [L('挑戰', 'Try it'), L('不要', 'No')]);
    if (r !== 0) return;
    const score = await mochiGame();
    S.flags.mochiDone = true;
    if (score >= 28 && !S.flags.mochiTop) { S.flags.mochiTop = true; await say(E, '搗麻糬的鬼', '太厲害了！這是祭典的特等獎！', 'Incredible! The festival\'s grand prize!'); await got(E, 'seed_str'); await got(E, 'mochi', 3); }
    else if (score >= 20) { await say(E, '搗麻糬的鬼', '好手藝！帶幾個麻糬走吧。', 'Fine work! Take some mochi with you.'); await got(E, 'mochi', 2); }
    else { await say(E, '搗麻糬的鬼', '哈哈，麻糬都跑到臉上去啦！再來一次吧。', 'Ha ha, more mochi on your face than in the mortar! Try again.'); await got(E, 'mochi'); }
  },
  async fe_goldfish(E) {
    await say(E, '撈金魚的小孩', '池子裡放了錦鯉喔！用釣竿在池邊釣，釣到金錦鯉就太幸運了！', 'They put koi in the pond! Fish from the edge with your rod. A golden koi is the luckiest catch!');
    if (S.fish.f_koi && !S.flags.koiPrize) { S.flags.koiPrize = true; await say(E, '撈金魚的小孩', '你釣到金錦鯉了！好厲害！這個給你！', "You caught a golden koi! Amazing! This is for you!"); await got(E, 'luckycoin'); }
  },
  async fe_shop(E) { await say(E, '祭典的攤販', '祭典限定！麻糬、符咒，什麼都有！', 'Festival specials! Mochi, talismans, everything!'); await E.shop(SHOPS.festival); },
  async fe_omikuji(E) {
    const r = await E.ask(L('神社的小和尚', 'Young Monk'), L('抽一支籤吧？10 金幣。', 'Draw a fortune? 10 gold.'), [L('抽籤', 'Draw'), L('不要', 'No')]);
    if (r !== 0) return;
    if (S.gold < 10) { await say(E, '神社的小和尚', '錢不夠喔。', "You haven't enough."); return; }
    S.gold -= 10; E.sfx('switch');
    const k = Math.random();
    if (k < 0.1) { await say(E, null, '大吉！「心想事成。神木庇佑。」', 'Great blessing! "Your wishes will come true. The sacred tree watches over you."'); await got(E, 'elixir'); }
    else if (k < 0.4) { await say(E, null, '中吉。「與人分享，福氣加倍。」', 'Middle blessing. "Share with others, and your luck doubles."'); await got(E, 'mochi'); }
    else if (k < 0.8) { await say(E, null, '小吉。「走路小心腳下。」', 'Small blessing. "Watch your step."'); await got(E, 'kibi'); }
    else await say(E, null, '凶……「釣魚時線會斷。」把籤綁在樹上吧。', 'Bad luck... "Your fishing line will snap." Tie it to the tree and leave it there.');
  },
  async fe_goki(E) { await say(E, 'goki', '人類的祭典真熱鬧！……喂，那個叫「章魚燒」的東西，裡面真的有章魚嗎？', "Human festivals are so lively! ...Hey, that thing called takoyaki, is there really octopus inside?"); },
  async fe_onikid(E) { await say(E, '鬼的小孩', S.flags.fedOniKid ? '人類哥哥！我說過我要來對岸的！你看，我來了！' : '這就是對岸！好多人類……好多好吃的！', S.flags.fedOniKid ? "Human! I said I'd come to the other shore! Look, here I am!" : 'So this is the other shore! So many humans... so much food!'); },
  async fe_granny(E) { await say(E, 'ume', '鬼的孩子們吃糰子的樣子，跟你小時候一模一樣呢。', 'The way the oni children eat their dumplings is just how you used to, when you were little.'); },
  async fe_grandpa(E) { await say(E, 'take', '活到這把年紀，還能跟鬼一起喝酒。……人生真是不知道會發生什麼啊。', 'At my age, drinking sake with the oni. ...You never know what life will bring.'); },
  async fe_akane(E) {
    const h = hearts();
    await say(E, 'akane', `祭典很開心吧？……神木也在笑。你帶來的心意，現在有 ${h} 份了。`, `Isn't the festival wonderful? ...The tree is smiling too. The kindness you carry now adds up to ${h}.`);
    if (h < 6) await say(E, 'akane', '那些心意……幫助過的人、原諒過的人、分享過的糰子。如果再多一點，也許……', 'That kindness... the people you helped, the ones you forgave, the dumplings you shared. If there were a little more, perhaps...');
    const r = await E.ask(null, L('祭典的最後是放燈籠。要開始了嗎？（之後就會前往常夜之國）', 'The festival ends with the lantern release. Begin? (After this, the way to the Endless Night opens.)'), [L('開始', 'Begin'), L('再逛逛', 'Not yet')]);
    if (r !== 0) return;
    E.music('festival');
    await say(E, null, '人和鬼一起，把一盞盞燈籠放上夜空。燈火飄向海的那一邊，飄向鬼之島。', 'Humans and oni together send lantern after lantern up into the night. The lights drift out over the sea, toward the Oni Isle.');
    await E.wait(40);
    E.music('reveal'); E.sfx('abyss'); E.shake(20); E.night('rgba(10,0,20,0.6)');
    await say(E, null, '突然，所有的燈籠一齊熄滅了。', 'Suddenly every lantern goes out at once.');
    const gm = actor(E, 'genmeiF', 6, 11, 'r', 'NinjaMageBlack');
    await say(E, 'genmei', '真是溫暖的光景啊。……溫暖得讓人想吐。', 'What a warm scene. ...So warm it makes me sick.');
    await say(E, 'genmei', '桃子，你遲遲不來，我只好來請你了。──這個老太婆，就借我一下。', "Little peach, you were slow in coming, so I've come to invite you. I'll borrow this old woman for a while.");
    E.sfx('drain'); E.flash('#000000', 30);
    const ume = E.ent('festgranny'); if (ume) ume.gone = true;
    await say(E, 'ume', '桃丸──！', 'Momomaru--!');
    await say(E, 'genmei', '想救她，就到常夜之國的最深處來。帶著你的心。', 'If you want her back, come to the very depths of the Endless Night. And bring your heart.');
    E.removeEnt(gm); E.sfx('abyss');
    await say(E, 'take', '老伴……！老伴──！', 'My dear...! MY DEAR--!');
    await say(E, 'momo', '……玄冥。我絕對不會原諒你。', "...Genmei. I will never forgive you.");
    await say(E, 'akane', '神木的門……開了！桃丸，從鬼之島的神木底下，就能進入常夜之國！', "The tree's gate... it's opened! Momomaru, beneath the sacred tree on the Oni Isle lies the way into the Endless Night!");
    S.flags.festivalOver = true; S.flags.umeTaken = true;
    E.night(null);
    await say(E, null, '目標：前往鬼之島，從神木下的門進入常夜之國。', 'Goal: go to the Oni Isle and enter the Endless Night through the gate beneath the sacred tree.');
    await E.reload();
  },

  // ---------- 常夜之國 ----------
  async yo_enter(E) {
    await say(E, null, '沒有太陽、也沒有月亮的地方。青白色的鬼火，照著一條長長的石路。', 'A place with no sun and no moon. Pale blue ghost-lights show a long road of stone.');
    if (E.has('kiji')) await say(E, 'kiji', '……好冷。可是梅奶奶一定更冷。走吧。', "...So cold. But Granny Ume must be colder. Let's go.");
  },
  async yo_kage(E) {
    if (!S.flags.kageForgiven) return;
    const k = actor(E, 'kageY', 18, 30, 'l', 'NinjaMasked');
    await say(E, 'kage', '……我來了。師父的大嫂叫我來的。她說：「去幫那孩子。」', "...I've come. Master's widow sent me. She said: \"Go help that boy.\"");
    await say(E, 'kage', '常夜之國的影子們，我替你們擋著。這些拿去用吧。', "I'll hold back the shadows of the Endless Night for you. Take these.");
    await got(E, 'elixir', 2); await got(E, 'smoke', 2);
    await say(E, 'shiro', '（……汪。）', '(...Woof.)');
    E.removeEnt(k);
  },
  async yo_sign(E) { await say(E, null, '石碑：「巨岩上石板，門自開。推錯了，就離開再來。」', 'Stone: "Boulders on the plates, and the door opens. Push wrong, then leave and return."'); },
  async yo_seal(E, e) {
    const j = e.jewel;
    await say(E, null, '一道結界擋住了路。結界上浮著一個圓形的凹槽。', 'A barrier bars the way. A round hollow floats in it.');
    if (!count(j)) { await say(E, null, '……少了一顆根之珠。', '...A root-jewel is missing.'); return; }
    await say(E, 'momo', `${ITEMS[j].name}……拜託了！`, `${ITEMS[j].name}... please!`);
    E.sfx('holy'); E.flash('#fff0f8', 30);
    S.flags['seal_' + j] = true;
    await say(E, null, '根之珠發出光芒，結界碎成了桃花瓣。', 'The root-jewel shines, and the barrier breaks apart into peach petals.');
    await E.reload();
  },
  async yo_granny(E) { await say(E, 'ume', '桃丸……別管奶奶了，快逃……！', 'Momomaru... never mind Granny, run...!'); },
  async yo_genmei(E) {
    E.music('reveal');
    await E.talk(N.genmei(), L('來了啊，桃子。……你知道嗎？三百年前，我也是守護神木的人。', 'So you came, little peach. ...Did you know? Three hundred years ago I too kept the sacred tree.'),
      L('我每天看著它開花、結果、落葉，又開花。它不會死。可是我會。', 'Every day I watched it bloom, fruit, shed its leaves and bloom again. It never dies. But I do.'),
      L('我只是想吃一顆它的果實。就為了這個，他們把我丟進了這片黑暗。', 'All I wanted was to eat one of its fruits. For that, they cast me into this darkness.'),
      L('在這裡，我找到了一條沉睡的黑龍，偷了牠的力量。現在，只差神木的心了！', 'Here I found a sleeping black dragon and stole its power. Now all I lack is the heart of the tree!'));
    await say(E, 'momo', '……你一直很害怕吧。害怕死掉，害怕一個人。', "...You've always been afraid, haven't you. Afraid of dying. Afraid of being alone.");
    await say(E, 'momo', '可是你不能拿奶奶來換！不管害怕什麼，都不能傷害別人！', "But you can't trade Granny for it! Whatever you're afraid of, you can't hurt other people!");
    await say(E, 'genmei', '說得好聽！那就讓我看看，你的心有多硬！', 'Fine words! Then let me see how hard your heart is!');
    const r = await E.battle(['genmei'], { bg: 'yomi', boss: true, music: 'boss' });
    if (r !== 'win') return;
    S.flags.bossGenmei = true;
    E.sfx('holy'); E.flash('#ffffff', 50); E.shake(20);
    await say(E, 'genmei', '……不可能……我的……永遠……', '...Impossible... my... forever...');
    await say(E, null, '玄冥的身體化成了黑霧。黑霧裡，傳來一聲小小的嘆息：「……好累啊。」', "Genmei's body dissolves into black mist. From within it comes a small sigh: \"...I am so tired.\"");
    await say(E, 'ume', '桃丸！', 'Momomaru!');
    await say(E, 'momo', '奶奶！……我們回家吧。', "Granny! ...Let's go home.");
    await E.fadeTo('isle', 17, 9, 'u');
    await SCRIPTS.is_final(E);
  },
  // the sacred tree, the hearts, and which ending it is
  async is_final(E) {
    E.music('sad');
    const a = actor(E, 'akaneF', 16, 8, 'r', 'akane'), g = actor(E, 'gokiF', 19, 9, 'l', 'DemonGreen');
    const ji = actor(E, 'takeF', 17, 12, 'u', 'grandpa'), ba = actor(E, 'umeF', 18, 12, 'u', 'grandma');
    await E.talk(N.akane(), L('咒消失了。可是神木……還是需要一顆心才能醒來。', 'The curse is gone. But the tree... still needs a heart to wake.'));
    await say(E, 'momo', '……嗯。我已經決定了。', "...Mm. I've made up my mind.");
    await say(E, null, '桃丸走向乾枯的樹幹。這時，夥伴們一個一個站到了他的身邊。', 'Momomaru walks toward the withered trunk. One by one, his friends come to stand beside him.');
    const h = hearts();
    if (h >= 6) {
      S.flags.trueEnding = true;
      await say(E, 'shiro', '（我的心也分一點給神木。主人教我的：守護，就是把自己的一部分交出去。）', "(I'll give the tree a piece of my heart too. Master taught me: guarding means giving a part of yourself.)");
      await say(E, 'natsume', '我也是！我的心大得很，分一半也還夠用！', "Me too! My heart's plenty big, half is more than enough!");
      await say(E, 'kiji', '我的也拿去吧。……一點點勇氣，也是心喔。', '...Take some of mine. A little courage is a heart too.');
      await say(E, 'goki', '鬼的心也算一份！', "An oni's heart counts too!");
      await say(E, 'ume', '老太婆的心雖然皺巴巴的，也拿去吧。', "An old woman's heart is a bit wrinkled, but take it anyway.");
      await say(E, null, `桃丸一路上遇見的人──原諒過的、幫助過的、分享過糰子的──那些心意化成了 ${h} 道光，流進了神木。`, `The people Momomaru met along the way -- those he forgave, those he helped, those he shared dumplings with -- their kindness becomes ${h} streams of light that flow into the tree.`);
      E.sfx('holy'); E.flash('#fff8fc', 60); E.shake(20);
      await E.wait(40);
      await say(E, null, '乾枯的枝頭，冒出了第一個花苞。然後第二個、第三個……整棵神木，像燃燒一樣開滿了桃花。', 'On the withered branches the first bud appears. Then a second, a third... the whole sacred tree bursts into bloom as if it were on fire.');
      await say(E, 'akane', '……神木醒了。用的不是一顆心，而是好多好多的心。', '...The tree is awake. Not with one heart, but with many, many hearts.');
      await say(E, 'momo', '……我還在這裡？', "...I'm still here?");
      await say(E, 'ume', '當然在這裡。來，回家吃糰子吧。', 'Of course you are. Come, let\'s go home and eat dumplings.');
    } else {
      await say(E, 'shiro', '（嗚……汪！汪！我會守在這棵樹下。就像守著主人那樣。）', "(Whimper... woof! Woof! I'll guard this tree. Just like I guarded my master.)");
      await say(E, 'natsume', '……說好了喔，等你開花，第一顆桃子要給我家小鬼們吃。', "...It's a promise. When you bloom, the first peach goes to my little ones.");
      await say(E, 'kiji', '我會每天飛過來看你。不管颳多大的風。', "I'll fly over to see you every day. No matter how hard the wind blows.");
      await say(E, 'ume', '……傻孩子。奶奶從河裡把你撈起來的時候，就知道你總有一天要回到哪裡去的。', '...Silly boy. When I pulled you out of the river, I knew one day you would have to go back to wherever you came from.');
      await say(E, 'ume', '來，最後一顆黍糰子。一邊想著你，一邊揉的。', 'Here. One last millet dumpling. I rolled it thinking of you.');
      await say(E, 'momo', '……奶奶的味道。我會一直記得的。', "...Granny's recipe. I'll remember it always.");
      await say(E, null, '桃丸把手貼在乾枯的樹幹上。', 'Momomaru lays his hand on the withered trunk.');
      E.sfx('holy'); E.flash('#fff8fc', 60); E.shake(20);
      await E.wait(60);
    }
    E.removeEnt(a); E.removeEnt(g); E.removeEnt(ji); E.removeEnt(ba);
    S.flags.ending = true;
    await E.ending();
  },
  // the true ending's spring
  async epilogueTrue(E) {
    E.hideParty(true);
    await say(E, null, '──一年後。', '-- One year later.');
    const ba = actor(E, 'umeE', 9, 5, 'd', 'grandma'), momo = actor(E, 'momoE', 8, 5, 'r', 'momo');
    await say(E, null, '鬼之島的神木，今年也開滿了花。每到春天，人和鬼就在海的兩岸輪流辦祭典。', 'The sacred tree of the Oni Isle bloomed in full again this year. Every spring, humans and oni take turns holding the festival on either shore.');
    if ((S.flags.spared || 0) >= 4) await say(E, null, '從黑鐵砦被救出來的鬼們，有的留在黍之里，和村人一起種黍子。', 'Some of the oni freed from Kurogane Fortress stayed in Kibi Village, growing millet beside the villagers.');
    if (S.flags.kageForgiven) await say(E, null, '源治的屋子裡，現在住著一個戴面具的年輕獵人，和一位常常笑的寡婦。', "Genji's house is home now to a young masked hunter and a widow who smiles often.");
    if (S.flags.redeemed_homuramaru) await say(E, null, '焰之鄉的火山不再發怒。焰丸每年都划船來看桃花，看得比誰都久。', "Homura's volcano rages no more. Every year Homuramaru rows over to see the blossoms, and watches them longer than anyone.");
    if (S.flags.fatherHome) await say(E, null, '額頭有疤的鬼，每天都牽著孩子們的手。', 'The oni with the scar on his brow holds his children\'s hands every day.');
    if (S.flags.fedOniKid) await say(E, null, '那個吃過人類糰子的鬼小孩，每年都第一個跳下船。', 'The oni child who once ate a human dumpling is always the first to jump off the boat.');
    await say(E, null, '而今天，老奶奶也到河邊洗衣服。身邊，多了一個幫忙擰衣服的少年。', 'And today, as ever, the old woman went down to the river to wash. Beside her, a boy helps wring out the clothes.');
    await say(E, 'momo', '奶奶，今天也有桃子漂下來嗎？', 'Granny, will a peach float down today too?');
    await say(E, 'ume', '呵呵。已經不用了。我最想要的桃子，已經在這裡了。', 'Ho ho. No need any more. The peach I wanted most is right here.');
    const d = actor(E, 'shiroE', 15, 3, 'l', 'shiro'), n = actor(E, 'natsumeE', 16, 4, 'l', 'natsume'), k = actor(E, 'kijiE', 15, 5, 'l', 'kiji');
    E.sfx('level');
    await say(E, null, '河岸的那一頭，一隻狗、一隻猴子和一隻雉雞，正朝這邊飛奔過來。', 'Along the riverbank, a dog, a monkey and a pheasant come racing toward them.');
    await say(E, 'momo', '大家！……今天也一起吃糰子吧！', "Everyone! ...Let's eat dumplings together today too!");
    void d; void n; void k; void ba; void momo;
    await E.wait(60);
  },

  // ---------- after the end: the bottom of the night ----------
  async ab_dragon(E) {
    await say(E, null, '深淵的底部，一條漆黑的巨龍睜開了眼睛。玄冥偷走的力量，正一點一點回到牠的身上。', 'At the bottom of the abyss, a pitch-black dragon opens its eyes. The power Genmei stole is flowing back into it, bit by bit.');
    await say(E, '常闇之龍', '……小小的光。是你們打倒了那個小偷嗎。', '...Little lights. Was it you who struck down that thief?');
    await say(E, '常闇之龍', '我睡了一千年，醒來心情很差。……陪我活動一下筋骨吧。', 'I slept a thousand years and woke in a foul mood. ...Stretch my limbs with me a while.');
    const r = await E.ask(null, L('要和常闇之龍戰鬥嗎？（非常強大）', 'Fight the Dragon of Endless Night? (Very strong)'), [L('戰鬥', 'Fight'), L('還是算了', 'Not now')]);
    if (r !== 0) return;
    const res = await E.battle(['nightdragon'], { bg: 'abyss', boss: true, music: 'final' });
    if (res !== 'win') return;
    S.flags.bossNight = true;
    E.sfx('holy'); E.flash('#ffffff', 40);
    await say(E, '常闇之龍', '……哈哈哈！好久沒這麼痛快了。小小的光，你們比太陽還亮。', '...Ha ha ha! I have not enjoyed myself like that in ages. Little lights, you shine brighter than the sun.');
    await say(E, '常闇之龍', '收下吧。我要再睡一千年了。……醒來的時候，記得再來陪我玩。', 'Take these. I will sleep another thousand years. ...When I wake, come and play again.');
    for (const it of ['seed_str', 'seed_def', 'seed_int', 'seed_agi', 'seed_hp']) await got(E, it);
    S.gold += 9999;
    await say(E, null, '常闇之龍沉沉睡去。常夜之國的天空，第一次出現了星星。', 'The Dragon of Endless Night sinks into sleep. For the first time, stars appear in the sky of the Endless Night.');
    await E.reload();
  },
});

// Shiro's nose finds a few special things in the later chapters
const baseDig = SCRIPTS.dig;
SCRIPTS.dig = async (E, e) => {
  if (!e.done && E.has('shiro') && e.item === 'shellkey') {
    await E.say(N.shiro(), L('（嗅嗅……嗅嗅……汪！）', '(Sniff... sniff... Woof!)'));
    E.sfx('push'); E.shake(6);
    e.done = true; S.flags['dig:' + e.id] = true; S.flags.shellKey = true; E.sfx('gate');
    await E.say(null, L('小白挖出了一把貝殼形狀的鑰匙！遠處傳來貝殼打開的聲音。', 'Shiro dug up a shell-shaped key! Far off, a great shell creaks open.'));
    await E.reload(); return;
  }
  const was = e.done;
  await baseDig(E, e);
  if (!was && e.done && e.item === 'genjiletter') await SCRIPTS.fv_letter(E);
  if (!was && e.done && e.item === 'magatama' && !S.flags.magaHint) { S.flags.magaHint = true; await E.say(null, L('古老的勾玉。……黍之里神社的和尚好像在收集這個。', "An old magatama. ...The monk at Kibi's shrine collects these, they say.")); }
};
void fullHeal;
