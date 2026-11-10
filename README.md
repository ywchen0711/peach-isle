# 桃源鬼島記 · Peachling and the Oni Isle

An original 16-bit style RPG in Traditional Chinese and English, loosely inspired by the old Japanese folk tale of the boy born from a peach. It plays in the browser at the old 256×224 resolution.

**Play:** https://ywchen0711.github.io/peach-isle/

## The story

An old woman washing clothes by the river sees a giant peach float past. Inside is a baby boy, and the old couple raise him as Momomaru. Fifteen years later, horned raiders in oni masks are stealing Kibi Village's millet, and a hunter has died trying to stop them. Momomaru sets out for the Oni Isle across the eastern sea with a bag of his grandmother's millet dumplings.

- **起** A peach on the river, a masked raid in the night, and a mask with a family crest carved inside.
- **承** Three friends join him, each with a hurt of their own:
  - Shiro, a dog who will not leave his master's grave;
  - Natsume, a monkey who steals to feed orphaned babies;
  - Kiji, a pheasant too frightened to fly since the wind knocked her down.
- **轉** The oni turn out to be starving. The raiders were Lord Kurogane's men in oni masks, and Kurogane has dammed the spring under the island's sacred peach tree to take the gold beneath it. Momomaru learns he is the tree's last fruit.
- **合** The fortress, a farewell under the withered tree, and one spring a year later.

The story, characters and dialogue are all original. Only the outline of the folk tale is borrowed: a child from a peach, a dog, a monkey, a pheasant, dumplings, and an island of oni.

## How it plays

- **Each friend has a skill on the map.**
  - Shiro sniffs out buried things: face a glinting patch of earth and press Z.
  - Natsume climbs vines up and down cliffs.
  - Kiji flies across gorges and moats to ring bells that lower bridges and open gates.
- **Dumplings.**
  - The healing items are dumplings you cook at a hearth from millet, honey, mugwort and peach petals.
  - Sharing dumplings with your friends at a hearth raises their bond. At bond 8, Momomaru can call a four-person Team Strike when everyone's gauge is at least half full.
- **Talk instead of fight.** Some oni were forced to fight for Kurogane. Choose Talk to try to persuade them; it works better once they are worn down. How many you spare changes the ending.
- **Battles** are seen from the side:
  - the monsters stand on the left and the party on the right;
  - skills cost Ki;
  - each hero's gauge fills in battle to unleash a special move;
  - monster strength is fixed and never scales with your level.

## Controls

| | Keyboard | Gamepad | Touch |
|---|---|---|---|
| Move | arrow keys / WASD | d-pad / stick | on-screen d-pad |
| Confirm, talk, use a friend's skill | Z / Enter / Space | A | A |
| Cancel, open the menu | X / Esc | B | B |

Switch between Chinese and English on the title screen or in Config.

## Files

- `js/story.js` holds every scene, conversation, cooking and sharing.
- `js/maps.js` holds every place, from the river to Kurogane Fortress, built from tiles with trees and houses placed on top.
- `js/field.js` covers walking, digging, vines, perches and bells.
- `js/battle.js` and `js/rules.js` run the battles.
- `js/data.js` holds the heroes, gear, dumplings, recipes and monsters.
- `js/assets.js`, `js/tiles.js`, `js/sprites.js` and `js/enemies.js` cut everything out of the art pack.
- `js/audio.js` plays the music tracks and makes the sound effects.
- `js/main.js` covers the title, the prologue and the ending.

There is no build step. Open `index.html` through any static web server.

## Credits

See [CREDITS.md](CREDITS.md). Art and music: the Ninja Adventure asset pack by Pixel-boy and AAA, released under CC0.
