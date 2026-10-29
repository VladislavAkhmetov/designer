/* =========================================================
   Уровень 2 — Михалыч и автосервис.
   Только сценарий: вся механика — в js/engine.js.
   ========================================================= */
(() => {
  const E = Engine;
  const { $, wait } = E;

  const mihalychScreen = $('chatC');
  const mihalych = E.chat(mihalychScreen);
  const MIHALYCH = { letter: 'М', av: 'av-gray' };
  const signOf = (choice) => $('sheet2').querySelector(`.frame[data-choice="${choice}"] .sign`);

  let mihalychOpened = false;

  async function openMihalych(state) {
    if (mihalychOpened) return;
    mihalychOpened = true;
    E.prefetch(['mihalych-win.mp4', 'mihalych-fail.mp4', 'anzhelika-start.mp4']);
    E.haptic.tap();
    E.clearPushes();

    const fromScreen = $('chatB');
    E.pushScreen(fromScreen, mihalychScreen);

    await wait(600);
    await mihalych.status('записывает видео…', 900);
    const brief = mihalych.note();
    await wait(450);
    await E.playNote(brief, 'mihalych.mp4');
    pickLoop(state);
  }

  async function pickLoop(state = { money: 1048, food: 2 }) {
    for (;;) {
      const choice = await E.choose($('sheet2'));
      await mihalych.photo(signOf(choice));
      await mihalych.status('записывает видео…', 1200);
      const answer = mihalych.note();
      await wait(450);

      const win = choice === 'brutal';
      await E.playNote(answer, win ? 'mihalych-win.mp4' : 'mihalych-fail.mp4');

      if (win) {
        state.money = (state.money || 1048) + 1500;
        E.result({
          node: signOf(choice),
          win: true,
          amount: 1500,
          avatar: MIHALYCH,
          comment: 'Вот это чётко! Бабки скинул.',
          button: 'Дальше',
          onButton: async () => {
            await E.closeResult();
            if (window.startLevel3) {
              window.startLevel3(state);
            } else {
              E.toast('Анжелика (Ноготочки) — скоро');
            }
          },
        });

        setTimeout(() => {
          E.push({
            title: 'Т-Банк',
            text: '+1 500 ₽ от Михаила П.',
            av: 'av-yellow',
            letter: 'Т',
            ttl: 3400,
            sound: 'ding'
          });
        }, 1200);
        return;
      }

      await new Promise((retry) => E.result({
        node: signOf(choice),
        win: false,
        avatar: MIHALYCH,
        comment: 'Я что, на ромашках сход-развал делаю?!',
        button: 'Переделать',
        onButton: retry,
      }));
      await E.closeResult();
    }
  }

  // Запуск Уровня 2 (вызывается из Уровня 1 при нажатии «Дальше»)
  window.startLevel2 = async (state) => {
    const samvelScreen = $('chatB');
    const samvel = E.chat(samvelScreen);
    await wait(300);
    samvel.bubble('in', 'Я Михалычу дал твой контакт, жди, ща напишет 🤙');
    await wait(1200);

    E.push({
      title: 'Михалыч · Автосервис',
      text: 'Видеосообщение',
      av: 'av-gray',
      letter: 'М',
      ttl: 0,
      onTap: () => openMihalych(state)
    });

    // Авто-открытие через 2.2 с, если игрок не нажал на пуш
    setTimeout(() => {
      if (!mihalychOpened) openMihalych(state);
    }, 2200);
  };

  // Режим быстрой отладки: если передан ?level=2 в URL
  if (window.location.search.includes('level=2')) {
    window.addEventListener('DOMContentLoaded', () => {
      const intro = $('intro');
      if (intro) {
        intro.classList.remove('is-active');
        intro.style.display = 'none';
      }
      mihalychScreen.classList.add('is-active');
      setTimeout(() => {
        openMihalych({ money: 1048, food: 2 });
      }, 400);
    });
  }
})();
