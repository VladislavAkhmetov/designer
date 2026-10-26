/**
 * СИМУЛЯТОР ДИЗАЙНЕРА: ИГРОВОЙ ДВИЖОК
 * Интерактивный комедийный FMV-квест без скролла
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // ЗВУКОВОЙ ДВИЖОК
  // ==========================================
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let soundEnabled = true;

  function playTone(freq, type, duration, delay = 0, vol = 0.2) {
    if (!soundEnabled) return;
    try {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
      gain.gain.setValueAtTime(vol, audioCtx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime + delay);
      osc.stop(audioCtx.currentTime + delay + duration);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  function sfxClick() {
    playTone(750, 'sine', 0.05, 0, 0.15);
  }

  function sfxTgMessage() {
    playTone(880, 'sine', 0.08, 0, 0.25);
    playTone(1320, 'sine', 0.12, 0.06, 0.2);
  }

  function sfxPush() {
    playTone(659, 'triangle', 0.08, 0, 0.2);
    playTone(987, 'triangle', 0.15, 0.07, 0.2);
  }

  function sfxCash() {
    playTone(987, 'sine', 0.1, 0, 0.3);
    playTone(1318, 'sine', 0.15, 0.08, 0.3);
    playTone(1760, 'triangle', 0.25, 0.16, 0.35);
  }

  function sfxBuzzer() {
    playTone(180, 'sawtooth', 0.25, 0, 0.25);
    playTone(130, 'sawtooth', 0.35, 0.15, 0.25);
  }

  function sfxMailSend() {
    for (let i = 0; i < 4; i++) {
      playTone(550 + i * 150, 'sine', 0.04, i * 0.06, 0.1);
    }
  }

  // ==========================================
  // СОСТОЯНИЕ ИГРЫ
  // ==========================================
  const state = {
    money: 48.00,
    food: 0,
    fmvShot: 1,
    massMailDone: false,
    samvelPhase: 'idle' // 'idle' | 'start' | 'fail' | 'victory'
  };

  // Элементы
  const statMoney = document.getElementById('stat-money');
  const statFood = document.getElementById('stat-food');
  const soundToggle = document.getElementById('sound-toggle');

  const sceneIntro = document.getElementById('scene-intro');
  const introVideo = document.getElementById('intro-video');
  const introStartWrap = document.getElementById('intro-start-wrap');
  const startGameBtn = document.getElementById('start-game-btn');
  const introSkipBtn = document.getElementById('intro-skip-btn');
  const fmvPill = document.getElementById('fmv-pill');
  const introTimelineFill = document.getElementById('intro-timeline-fill');

  const sceneChat = document.getElementById('scene-chat');
  const pushLayer = document.getElementById('push-layer');
  const btnMassMail = document.getElementById('btn-mass-mail');
  const tgDock = document.getElementById('tg-dock');

  const samvelChatAnchor = document.getElementById('samvel-chat-anchor');
  const samvelVideoBox = document.getElementById('samvel-video-box');
  const samvelVideo = document.getElementById('samvel-video');
  const samvelSoundBadge = document.getElementById('samvel-sound-badge');
  const samvelSkipBtn = document.getElementById('samvel-skip-btn');
  const choiceOverlay = document.getElementById('choice-overlay');
  const resultOverlay = document.getElementById('result-overlay');
  const resultCard = document.getElementById('result-card');

  // ==========================================
  // СТАТИСТИКА
  // ==========================================
  function updateStats() {
    statMoney.textContent = `${state.money.toFixed(2)} ₽`;
    statFood.textContent = `${state.food} дошиков`;
  }

  soundToggle.addEventListener('click', () => {
    sfxClick();
    soundEnabled = !soundEnabled;
    soundToggle.textContent = soundEnabled ? '🔊' : '🔇';
    if (soundEnabled && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  });

  // ==========================================
  // ЭКРАН 1: FMV ИНТРО (ШОТ 1 -> ШОТ 2)
  // ==========================================
  startGameBtn.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    sfxClick();
    introStartWrap.classList.add('hidden');
    introSkipBtn.classList.remove('hidden');
    playFmvShot1();
  });

  function playFmvShot1() {
    state.fmvShot = 1;
    fmvPill.textContent = '🔴 Реклама: Успешный успех';
    fmvPill.style.background = 'rgba(220, 38, 38, 0.85)';
    introVideo.src = 'start-1.mp4';
    introVideo.currentTime = 0;
    introVideo.muted = false;
    introVideo.play().catch(e => {
      console.warn("Unmuted intro blocked, playing muted:", e);
      introVideo.muted = true;
      introVideo.play();
    });
  }

  function playFmvShot2() {
    state.fmvShot = 2;
    fmvPill.textContent = '⚠️ Бэкстейдж: Реальность';
    fmvPill.style.background = 'rgba(245, 158, 11, 0.85)';
    introVideo.src = 'start-2.mp4';
    introVideo.currentTime = 0;
    introVideo.muted = false;
    introVideo.play().catch(e => {
      introVideo.muted = true;
      introVideo.play();
    });
  }

  introVideo.addEventListener('timeupdate', () => {
    if (introVideo.duration) {
      const pct = (introVideo.currentTime / introVideo.duration) * 100;
      introTimelineFill.style.width = `${pct}%`;
    }
  });

  introVideo.addEventListener('ended', () => {
    if (state.fmvShot === 1) {
      playFmvShot2();
    } else {
      finishIntro();
    }
  });

  introSkipBtn.addEventListener('click', () => {
    sfxClick();
    if (state.fmvShot === 1) {
      playFmvShot2();
    } else {
      finishIntro();
    }
  });

  function finishIntro() {
    introVideo.pause();
    sceneIntro.classList.remove('active');
    sceneChat.classList.add('active');
    sfxTgMessage();
  }

  // ==========================================
  // ЭКРАН 2: ВЕЕРНАЯ РАССЫЛКА
  // ==========================================
  btnMassMail.addEventListener('click', () => {
    if (state.massMailDone) return;
    state.massMailDone = true;

    sfxClick();
    sfxMailSend();
    btnMassMail.innerHTML = '<span>⏳</span> Отправляем 142 контактам...';
    btnMassMail.style.opacity = '0.7';

    // Каскад пушей сверху
    const pushes = [
      {
        app: 'Telegram',
        title: '💔 Бывшая',
        text: 'Ты больной? Удали мой номер и верни кота.',
        avatar: '💔',
        bg: '#574b90',
        delay: 700
      },
      {
        app: 'Госуслуги',
        title: '🪖 Военкомат',
        text: 'Электронная повестка отправлена.',
        avatar: '🪖',
        bg: '#2c3e50',
        delay: 1700
      },
      {
        app: 'Telegram',
        title: '👵 Бабуля',
        text: 'Внучек, денег скинуть на супчик?',
        avatar: '👵',
        bg: '#16a085',
        delay: 2700
      },
      {
        app: 'Telegram',
        title: '🥙 Самвел (Шаурма 24)',
        text: '📹 Видеосообщение (0:10): «Здорово, дизайнер...»',
        avatar: '🥙',
        bg: '#b33939',
        delay: 3700,
        isSamvel: true
      }
    ];

    pushes.forEach(item => {
      setTimeout(() => {
        triggerPush(item);
      }, item.delay);
    });
  });

  function triggerPush(item) {
    sfxPush();
    const toast = document.createElement('div');
    toast.className = 'push-toast';
    toast.innerHTML = `
      <div class="push-avatar" style="background: ${item.bg}">${item.avatar}</div>
      <div class="push-details">
        <div class="push-title-row">
          <span>${item.title}</span>
          <span class="push-app">${item.app}</span>
        </div>
        <div class="push-body">${item.text}</div>
      </div>
    `;

    pushLayer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-16px)';
        setTimeout(() => toast.remove(), 250);
      }
    }, 3500);

    // КОГДА ПРИШЕЛ САМВЕЛ:
    if (item.isSamvel) {
      setTimeout(() => {
        showSamvelCircleAndExpand();
      }, 300);
    }
  }

  // ==========================================
  // АНИМАЦИЯ: КРУЖОЧЕК -> ПОЛНЫЙ ЭКРАН ВИДЕО
  // ==========================================
  function showSamvelCircleAndExpand() {
    state.samvelPhase = 'start';

    // 1. Появляется кружочек в чате
    samvelChatAnchor.classList.remove('hidden');
    tgDock.style.display = 'none'; // Скрываем нижнюю кнопку
    sfxTgMessage();

    // 2. Начинаем воспроизведение видео
    samvelVideo.src = 'samvel-start.mp4';
    samvelVideo.currentTime = 0;
    samvelVideo.muted = false;
    const playPromise = samvelVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch(e => {
        console.warn("Unmuted circle video blocked, playing muted:", e);
        samvelVideo.muted = true;
        samvelVideo.play();
        updateSoundBadge();
      });
    }
    updateSoundBadge();

    // 3. Плавный морфинг из кружочка в полный экран смартфона!
    setTimeout(() => {
      samvelVideoBox.classList.add('fullscreen');
      samvelSkipBtn.classList.remove('hidden');
    }, 600);
  }

  function updateSoundBadge() {
    samvelSoundBadge.textContent = samvelVideo.muted ? '🔇' : '🔊';
  }

  samvelSoundBadge.addEventListener('click', (e) => {
    e.stopPropagation();
    sfxClick();
    samvelVideo.muted = !samvelVideo.muted;
    updateSoundBadge();
  });

  // Кнопка пропуска текущего видео Самвела (бриф, фейл или победа)
  samvelSkipBtn.addEventListener('click', () => {
    sfxClick();
    if (state.samvelPhase === 'start') {
      freezeOnLastFrameAndShowChoices();
    } else if (state.samvelPhase === 'fail') {
      showFailResult();
    } else if (state.samvelPhase === 'victory') {
      showVictoryResult();
    }
  });

  // Завершение видео Самвела
  samvelVideo.addEventListener('ended', () => {
    if (state.samvelPhase === 'start') {
      freezeOnLastFrameAndShowChoices();
    } else if (state.samvelPhase === 'fail') {
      showFailResult();
    } else if (state.samvelPhase === 'victory') {
      showVictoryResult();
    }
  });

  samvelVideo.addEventListener('timeupdate', () => {
    if (samvelVideo.duration && (samvelVideo.duration - samvelVideo.currentTime) < 0.2) {
      if (state.samvelPhase === 'start' && choiceOverlay.classList.contains('hidden')) {
        freezeOnLastFrameAndShowChoices();
      } else if (state.samvelPhase === 'fail' && resultOverlay.classList.contains('hidden')) {
        showFailResult();
      } else if (state.samvelPhase === 'victory' && resultOverlay.classList.contains('hidden')) {
        showVictoryResult();
      }
    }
  });

  // Застывание на последнем кадре брифа и показ 2 вариантов
  function freezeOnLastFrameAndShowChoices() {
    if (state.samvelPhase !== 'start') return;
    samvelVideo.pause();
    samvelSkipBtn.classList.add('hidden');
    samvelSoundBadge.classList.add('hidden');
    
    // Всплывает оверлей выбора прямо поверх застывшего видео
    choiceOverlay.classList.remove('hidden');
    sfxTgMessage();
  }

  // ==========================================
  // ВЫБОР ВЕТКИ: 2 ВАРИАНТА (ПОБЕДА ИЛИ ФЕЙЛ)
  // ==========================================
  document.querySelectorAll('.choice-item').forEach(item => {
    item.addEventListener('click', () => {
      const choice = item.dataset.choice;
      handleChoice(choice);
    });
  });

  function handleChoice(choice) {
    choiceOverlay.classList.add('hidden');

    if (choice === 'lux') {
      // НАРОДНЫЙ ЛЮКС: Запускаем видео победы!
      state.samvelPhase = 'victory';
      samvelSkipBtn.classList.remove('hidden');
      samvelVideo.src = 'samvel-victory.mp4';
      samvelVideo.currentTime = 0;
      samvelVideo.muted = false;
      samvelVideo.play().catch(e => {
        console.warn("Victory unmuted play blocked:", e);
        samvelVideo.muted = true;
        samvelVideo.play();
      });

    } else if (choice === 'minimal') {
      // СКАНДИНАВСКИЙ МИНИМАЛИЗМ: Запускаем видео фейла!
      state.samvelPhase = 'fail';
      samvelSkipBtn.classList.remove('hidden');
      samvelVideo.src = 'samvel-fail.mp4';
      samvelVideo.currentTime = 0;
      samvelVideo.muted = false;
      samvelVideo.play().catch(e => {
        console.warn("Fail unmuted play blocked:", e);
        samvelVideo.muted = true;
        samvelVideo.play();
      });
    }
  }

  // Окончание видео фейла
  function showFailResult() {
    samvelVideo.pause();
    samvelSkipBtn.classList.add('hidden');
    sfxBuzzer();

    resultCard.innerHTML = `
      <div class="result-badge">💀</div>
      <div class="result-title" style="color: #ef4444;">САМВЕЛ В ШОКЕ: «ТЫ МНЕ ЛИСТ А4 ПРИСЛАЛ?!»</div>
      <div class="result-quote">
        «Э, ты надо мной прикалываешься?! Где мясо?! Где искры?! Мой внук в пейнте лучше нарисует! Пошел вон, ничего не заплачу!»
      </div>
      <div style="font-size: 12px; color: #94a3b8;">
        Баланс: 48.00 ₽. Вы умерли с голоду, зато с идеальной гельветикой.
      </div>
      <button class="result-action-btn" id="btn-retry-choice">
        ↺ Выбрать другой макет
      </button>
    `;

    resultOverlay.classList.remove('hidden');

    document.getElementById('btn-retry-choice').addEventListener('click', () => {
      sfxClick();
      resultOverlay.classList.add('hidden');
      // Возвращаем видео брифа на последний кадр
      state.samvelPhase = 'start';
      samvelVideo.src = 'samvel-start.mp4';
      samvelVideo.onloadedmetadata = () => {
        samvelVideo.currentTime = Math.max(0, samvelVideo.duration - 0.2);
        samvelVideo.pause();
        choiceOverlay.classList.remove('hidden');
      };
    });
  }

  // Окончание видео победы
  function showVictoryResult() {
    samvelVideo.pause();
    samvelSkipBtn.classList.add('hidden');
    sfxCash();
    state.money += 1000.00;
    state.food += 2;
    updateStats();

    // Анимация денег в шапке
    statMoney.style.transform = 'scale(1.25)';
    statMoney.style.color = '#2ecc71';
    statFood.style.transform = 'scale(1.25)';
    setTimeout(() => {
      statMoney.style.transform = 'scale(1)';
      statFood.style.transform = 'scale(1)';
    }, 800);

    // Пуш от банка
    setTimeout(() => {
      triggerPush({
        app: 'Тинькофф Банк',
        title: '💳 Перевод +1 000 ₽',
        text: 'Самвел А.: «На шаурму от души, художник!»',
        avatar: '💰',
        bg: '#27ae60'
      });
    }, 500);

    resultCard.innerHTML = `
      <div class="result-badge">🎉</div>
      <div class="result-title" style="color: #2ecc71;">САМВЕЛ В ВОСТОРГЕ! «ЭТО ПО-ДУБАЙСКИ!»</div>
      <div class="result-quote">
        «ВАХ, БРАТ! Вот это уровень! Мясо горит, буквы жирные — с трассы видно! Лови косарь на карту, за шаурмой сам зайдешь. Тут Михалыч из автосервиса звонит, ему тоже вывеска нужна...»
      </div>
      <div class="result-payout">
        💰 +1 000.00 ₽ на карту &nbsp;•&nbsp; 🥙 +2 сочных донера
      </div>
      <button class="result-action-btn win" id="btn-next-episode">
        📞 Ответить Михалычу (Часть 2) ➔
      </button>
    `;

    resultOverlay.classList.remove('hidden');

    document.getElementById('btn-next-episode').addEventListener('click', () => {
      sfxClick();
      alert('Поздравляем! Часть 1 успешно пройдена.\nСкоро: Клиент 2 — суровый Михалыч из автосервиса («эээ... машина там...»).');
    });
  }

  // Часы в статус-баре
  function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const el = document.getElementById('status-clock');
    if (el) el.textContent = `${h}:${m}`;
  }
  updateClock();
  setInterval(updateClock, 30000);

  updateStats();
});
