# Как собрать новый уровень

## Структура

```
styles/          общие стили (не трогать под конкретный уровень)
  base.css       токены (цвета, шрифты, размеры, easing), сброс, аватары, тост, затемнение
  start.css      стартовый экран и интро-видео
  telegram.css   чаты и каналы: шапка, пузыри, кружки, кнопка, поле ввода
  push.css       iOS-пуши
  player.css     плеер кружков (кружок <-> полный экран)
  figma.css      шторка выбора макетов и экран итога
js/engine.js     движок: window.Engine
levels/level-N/  только своё: levelN.css (макеты, спецэффекты) + levelN.js (сценарий)
```

Размеры и цвета меняются в `:root` в `styles/base.css` (`--tg-font-msg`, `--tg-note`, `--fg-blue`…).

## Разметка

- Чат: `<section class="screen chat" id="…">` с `.tg-head` (внутри `.tg-name`, `.tg-status`) и `.tg-feed`.
- Выбор: `<section class="sheet">` с `.frame[data-choice="…"]` → `.frame-box` → `.sign` (сам макет) + `.sel`.
- Макеты рисуются в единицах `cqw`, поэтому одинаково масштабируются в шторке, в сообщении и на итоге.

## API движка

```js
const E = Engine;
E.loadSounds({ push: 0.7, message: 0.6, sent: 0.6, cash: 0.8, fail: 0.7, ding: 0.9 });

E.unlock([video2], 'first-note.mp4'); // вызывать внутри клика: разблокирует звук и видео на iOS
E.play(video);                         // со звуком, если запрещено — без звука

const client = E.chat(document.getElementById('chatB'));
await client.status('записывает видео…', 900);
client.bubble('in', 'Текст');           // 'in' | 'out'
await client.photo(node);               // исходящая картинка-клон с галочками
const note = client.note();
await E.playNote(note, 'video.mp4');    // кружок → полный экран → обратно в кружок

E.pushScreen(fromScreen, toScreen);     // iOS-переход между экранами
E.push({ title, text, av: 'av-red', ttl: 2600, onTap, sound: 'push' });
E.clearPushes();

const choice = await E.choose(sheetEl); // вернёт data-choice
E.result({ node, win, amount: 1000, comment, avatar: { letter: 'М', av: 'av-gray' }, button: 'Дальше', onButton });
await E.closeResult();

E.toast('Текст'); E.countUp(el, 300000); E.progressButton(btn, { total: 142 });
E.haptic.tap() / medium() / select() / success() / error();
```

Пример полного сценария — `levels/level-1/level1.js`.
