/* =========================================================
   Уровень 3 — Анжелика и студия ноготочков.
   Финал первой части симулятора дизайнера.
   ========================================================= */
(() => {
  const E = Engine;
  const { $, wait } = E;

  const anzhelikaScreen = $('chatD');
  const anzhelika = E.chat(anzhelikaScreen);
  const ANZHELIKA = { letter: 'А', av: 'av-violet' };
  const signOf = (choice) => $('sheet3').querySelector(`.frame[data-choice="${choice}"] .sign`);

  let anzhelikaOpened = false;

  async function openAnzhelika(state = { money: 2548, food: 2 }) {
    if (anzhelikaOpened) return;
    anzhelikaOpened = true;
    E.prefetch(['anzhelika-win.mp4', 'anzhelika-fail.mp4']);
    E.haptic.tap();
    E.clearPushes();

    const fromScreen = $('chatC');
    E.pushScreen(fromScreen, anzhelikaScreen);

    await wait(600);
    await anzhelika.status('записывает видео…', 900);
    const brief = anzhelika.note();
    await wait(450);
    await E.playNote(brief, 'anzhelika-start.mp4');
    pickLoop(state);
  }

  async function pickLoop(state) {
    for (;;) {
      const choice = await E.choose($('sheet3'));
      await anzhelika.photo(signOf(choice));
      await anzhelika.status('записывает видео…', 1200);
      const answer = anzhelika.note();
      await wait(450);

      const win = choice === 'glamour';
      await E.playNote(answer, win ? 'anzhelika-win.mp4' : 'anzhelika-fail.mp4');

      if (win) {
        state.money = (state.money || 2548) + 2500;
        E.result({
          node: signOf(choice),
          win: true,
          amount: 2500,
          avatar: ANZHELIKA,
          comment: 'Это просто разрыв! Ты краш!',
          button: 'Итоги Части 1 ➔',
          onButton: () => showOutro(state),
        });

        setTimeout(() => {
          E.push({
            title: 'Т-Банк',
            text: '+2 500 ₽ от Анжелика П.',
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
        avatar: ANZHELIKA,
        comment: 'Это что за надгробная плита?! Где блёстки?!',
        button: 'Переделать',
        onButton: retry,
      }));
      await E.closeResult();
    }
  }

  /* ---------- Финальный кадр (Outro) ---------- */
  async function showOutro(state = { money: 5048, food: 2 }) {
    await E.closeResult();
    const outroScreen = $('outro');
    E.pushScreen(anzhelikaScreen, outroScreen);
    E.sfx('cash');
    E.haptic.success();

    const finalMoney = $('finalMoney');
    if (finalMoney) {
      E.countUp(finalMoney, state.money || 5048, {
        dur: 1500,
        power: 3,
        format: (n) => `${n.toLocaleString('ru-RU')} ₽`
      });
    }

    const restartBtn = $('restartBtn');
    if (restartBtn) {
      restartBtn.onclick = () => {
        E.haptic.medium();
        window.location.href = window.location.pathname;
      };
    }
  }

  // Запуск Уровня 3 (вызывается из Уровня 2)
  window.startLevel3 = async (state) => {
    const mihalychScreen = $('chatC');
    const mihalych = E.chat(mihalychScreen);
    await wait(300);
    mihalych.bubble('in', 'Жена тебе ща наберёт, лови контакт 🤙');
    await wait(1200);

    E.push({
      title: 'Анжелика · Luxury Nails',
      text: 'Видеосообщение',
      av: 'av-violet',
      letter: 'А',
      ttl: 0,
      onTap: () => openAnzhelika(state)
    });

    setTimeout(() => {
      if (!anzhelikaOpened) openAnzhelika(state);
    }, 2200);
  };

  // Режимы быстрой отладки
  if (window.location.search.includes('level=3')) {
    window.addEventListener('DOMContentLoaded', () => {
      const intro = $('intro');
      if (intro) {
        intro.classList.remove('is-active');
        intro.style.display = 'none';
      }
      anzhelikaScreen.classList.add('is-active');
      setTimeout(() => openAnzhelika({ money: 2548, food: 2 }), 400);
    });
  } else if (window.location.search.includes('level=outro')) {
    window.addEventListener('DOMContentLoaded', () => {
      const intro = $('intro');
      if (intro) {
        intro.classList.remove('is-active');
        intro.style.display = 'none';
      }
      $('outro').classList.add('is-active');
      setTimeout(() => showOutro({ money: 5048, food: 2 }), 300);
    });
  }
})();
