# 桃源鬼島記 · Peachling and the Oni Isle

An original 16-bit style RPG in Traditional Chinese and English, loosely inspired by the old Japanese folk tale of the boy born from a peach. It plays in the browser at the old 256×224 resolution.

**Play:** https://ywchen0711.github.io/peach-isle/

## The story

An old woman washing clothes by the river sees a giant peach float past. Inside is a baby boy, and the old couple raise him as Momomaru. Fifteen years later, horned raiders in oni masks are stealing Kibi Village's millet, and a hunter has died trying to stop them. Momomaru sets out for the Oni Isle across the eastern sea with a bag of his grandmother's millet dumplings.

### Part one: the Oni Isle

- **起** A peach on the river, a masked raid in the night, and a mask with a family crest carved inside.
- **承** Three friends join him, each with a hurt of their own:
  - Shiro, a dog who will not leave his master's grave;
  - Natsume, a monkey who steals to feed orphaned babies;
  - Kiji, a pheasant too frightened to fly since the wind knocked her down.
- **轉** The oni turn out to be starving. The raiders were Lord Kurogane's men in oni masks, and Kurogane has dammed the spring under the island's sacred peach tree to take the gold beneath it. Momomaru learns he is the tree's last fruit.

### Part two: the three roots

Kurogane falls, but the tree does not wake. Genmei, a black-robed monk who was banished from the island three hundred years ago, steps out of the shadows. He taught Kurogane his sorcery, and he wants the tree's heart, which is Momomaru, so that he can live forever. He curses the tree's three roots and withdraws into the Land of Endless Night.

- **The Fog Valley** is Shiro's story. Shiro follows a scent through fog that turns everyone else around. At the end of it he finds Kagemaru, the boy Genji the hunter took in, who stood by on the night Genji died. Shiro chooses whether to forgive him.
- **Homura**, the oni homeland, is Natsume's story. In the mines of its volcano she finds her mother and the strength to move boulders. Goki's elder brother Homuramaru has guarded the fire root alone for a hundred years and hates humans. He can be fought or talked down.
- **The village in the clouds** is Kiji's story. She meets the mother who thought she was dead and learns to carry everyone on the updrafts. At the top of the cloud road, the Blue Tengu is in the grip of the curse.
- **The Dragon Palace** lies beneath a whirlpool. The Umibozu, whom Momomaru fought in part one, gives him the pearl that lets him dive. Princess Shione asks him to wake her father, the sea dragon Soen.

### Part three: the peach festival and the Endless Night

With the three root-jewels gathered, humans and oni hold their first festival together in Kibi. On the night of the lanterns, Genmei carries off Granny Ume. The way to the Endless Night opens beneath the sacred tree.

- **Two endings.**
  - The people Momomaru helps along the way each add a heart's worth of kindness.
  - Ten kindnesses count: forgiving Kagemaru, bringing Genji's letter home, freeing the scarred oni, talking Homuramaru down, feeding the oni child, sparing the oni, a strong bond, feeding the castaway, pounding mochi at the festival, and returning magatama.
  - With six or more, the tree wakes on many hearts and Momomaru stays. With fewer, the old bittersweet ending plays.
- **After the credits** the adventure carries on. A stair at the bottom of the Endless Night leads to the dragon whose power Genmei stole.

The story, characters and dialogue are all original. Only the outline of the folk tale is borrowed: a child from a peach, a dog, a monkey, a pheasant, dumplings, and an island of oni.

## How it plays

- **Each friend has a skill on the map**, and each gains a second one in their own chapter.
  - Shiro digs up buried things, and in the Fog Valley he tracks scents through the fog.
  - Natsume climbs vines, and in the volcano she learns to shove great boulders onto plates and into pits.
  - Kiji flies across gorges to ring bells, and in the clouds she learns to ride updrafts from one cloud island to the next.
  - Momomaru's root-jewels break the seals of the Endless Night.
- **Sailing.** Once the captain's boat is repaired, you sail the open sea between Shiomi Harbour, the Oni Isle, Homura, a castaway's island and the whirlpool over the Dragon Palace. There are random encounters at sea.
- **Dumplings and cooking.** Sixteen recipes are cooked at a hearth: dumplings, rice balls, grilled fish, sushi, takoyaki, eel on rice, fugu and matcha. Sharing dumplings, or a soak in Homura's hot spring, raises your friends' bond. At bond 8, everyone can call a Team Strike.
- **Fishing.** The old fisherman at the harbour gives you a rod.
  - Cast where fish are rippling. Strike when one bites, then press Z each time the needle crosses the green.
  - There are 13 kinds of fish across rivers, ponds, the sea, the palace pool, a hot spring, the sea of clouds and the river of the dead. The fish log keeps count.
- **The oni blacksmith** in Homura forges the best gear from materials: iron ore, oni horn, tengu feathers, pearls, dragon scales, spirit silk, a branch of the sacred tree.
- **The oni dojo** on the Oni Isle is run by the reformed Tanuki King. It has five ranks of three bouts each, with no rest between them. Losing costs nothing.
- **Magatama.** Twelve are hidden in the ground and in chests. The monk at Kibi's shrine rewards you for bringing them back.
- **The festival** has mochi pounding (a rhythm game), koi fishing, fortune slips and stalls.
- **Ninjutsu scrolls** teach any friend fire, water, lightning and earth styles, substitution or sealing. **Talismans** strike with fire, thunder, water or holy light. **Sacred peaches** raise a stat for good.
- **The bestiary** records every monster you meet: its picture, weaknesses, drops, how many you have beaten, and a line about it.
- **Talk instead of fight.** Some oni were forced to fight, and so were two bosses, Kagemaru and Homuramaru. Choose Talk once they are worn down.
- **Battles** are seen from the side:
  - the monsters stand on the left and the party on the right;
  - skills cost Ki;
  - each hero's gauge fills to unleash a special move;
  - monster strength is fixed and never scales with your level.
- **Bosses have patterns.**
  - The toad swallows a friend whole until you hit it hard. The Flame King gathers fire for a turn before it erupts.
  - The Cloud Mirage splits in two. The Blue Tengu switches between walls against blades and against magic.
  - The sea dragon dives out of reach and returns as a tsunami. Genmei calls up shadows and rises again in his true form.
  - The dragon at the bottom of the night acts twice once it is wounded.

## Controls

| | Keyboard | Gamepad | Touch |
|---|---|---|---|
| Move | arrow keys / WASD | d-pad / stick | on-screen d-pad |
| Confirm, talk, use a friend's skill | Z / Enter / Space | A | A |
| Cancel, open the menu | X / Esc | B | B |

Switch between Chinese and English on the title screen or in Config. The menu's Records page holds the bestiary, the fish log and your magatama count.

## Files

- **Story:** `js/story.js` holds part one and the cooking; `js/story2.js` holds parts two and three, the endings and the post-game.
- **Places:** `js/maps.js` holds the first eleven places; `js/maps2.js` holds the Fog Valley, the sea, Homura and its volcano, the clouds, the island, the Coral Road, the Dragon Palace, the dojo and the Endless Night.
- **Data:** `js/data.js` and `js/data2.js` hold the heroes, skills, gear, dishes, recipes, monsters, the forge, fishing waters, dojo ranks and bestiary lines.
- `js/minigames.js` runs fishing, mochi pounding, the bestiary, the fish log, the forge, the dojo and the magatama exchange.
- `js/field.js` covers walking, digging, vines, perches, bells, boulders, updrafts, currents, fog and the boat.
- `js/battle.js` and `js/rules.js` run the battles and the boss patterns.
- `js/assets.js`, `js/tiles.js`, `js/sprites.js` and `js/enemies.js` cut everything out of the art pack. Dragons are built from their separate parts.
- `js/audio.js` plays the music tracks and makes the sound effects.
- `js/main.js` covers the title, the prologue, the endings and the credits.

There is no build step. Open `index.html` through any static web server.

## Credits

See [CREDITS.md](CREDITS.md). Art, music and effects: the Ninja Adventure asset pack by Pixel-boy and AAA, released under CC0.
