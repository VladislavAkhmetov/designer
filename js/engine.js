/* =========================================================
   Движок «Симулятора дизайнера».
   Общие механики для всех уровней: звук, вибрация, пуши,
   чаты Telegram, видеосообщения, выбор макета и итог в Figma.
   Уровень описывает только сценарий и вызывает Engine.*.
   ========================================================= */
window.Engine = (() => {
  const $ = (id) => document.getElementById(id);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const tg = window.Telegram && window.Telegram.WebApp;
  const app = $('app');

  /* ---------- Telegram WebApp ---------- */
  if (tg) {
    tg.ready();
    tg.expand();
    tg.disableVerticalSwipes && tg.disableVerticalSwipes();
    try { tg.setHeaderColor('#000000'); tg.setBackgroundColor('#000000'); } catch (e) {}
  }

  /* ---------- Вибрация ---------- */
  const vib = (p) => navigator.vibrate && navigator.vibrate(p);
  const haptic = {
    tap:     () => (tg ? tg.HapticFeedback.impactOccurred('light') : vib(8)),
    medium:  () => (tg ? tg.HapticFeedback.impactOccurred('medium') : vib(14)),
    select:  () => (tg ? tg.HapticFeedback.selectionChanged() : vib(6)),
    success: () => (tg ? tg.HapticFeedback.notificationOccurred('success') : vib([12, 60, 12])),
    error:   () => (tg ? tg.HapticFeedback.notificationOccurred('error') : vib([30, 40, 30])),
  };

  /* ---------- Звук (WebAudio — стабильно на iOS) ---------- */
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = AC ? new AC() : null;
  const buffers = {}, volumes = {};

  /** Загрузить звуки: { имя: громкость }. Файлы — sounds/<имя>.mp3 */
  function loadSounds(map) {
    Object.assign(volumes, map);
    if (!ctx) return;
    Object.keys(map).forEach((name) => {
      fetch(`sounds/${name}.mp3`)
        .then((r) => r.arrayBuffer())
        .then((b) => new Promise((ok, no) => ctx.decodeAudioData(b, ok, no)))
        .then((buf) => { buffers[name] = buf; })
        .catch(() => {});
    });
  }
  function sfx(name) {
    if (!ctx || !buffers[name]) return;
    if (ctx.state === 'suspended') ctx.resume();
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = volumes[name] ?? 0.7;
    src.buffer = buffers[name];
    src.connect(gain).connect(ctx.destination);
    src.start();
  }

  /* ---------- Медиа ---------- */
  const player = $('player'), pv = $('pv'), pvSkip = $('pvSkip');

  /** Вызывать внутри жеста пользователя: разблокирует звук и видео на iOS */
  function unlock(videos = [], noteSrc) {
    if (ctx && ctx.state === 'suspended') ctx.resume();
    if (noteSrc) pv.src = noteSrc;
    [pv, ...videos].forEach((v) => {
      if (!v.src) return;
      v.play().then(() => { v.pause(); v.currentTime = 0; }).catch(() => {});
    });
  }
  /** Играть со звуком, а если браузер запретил — без звука */
  function play(video) {
    video.muted = false;
    return video.play().catch(() => { video.muted = true; return video.play(); });
  }

  /* ---------- Предзагрузка медиа (фоновый HTTP-кэш) ---------- */
  const prefetched = new Set();
  function prefetch(urls) {
    if (!urls) return;
    const list = Array.isArray(urls) ? urls : [urls];
    list.forEach((url) => {
      if (!url || prefetched.has(url)) return;
      prefetched.add(url);
      try {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.as = 'video';
        link.href = url;
        document.head.appendChild(link);
      } catch (e) {}
      try {
        fetch(url, { mode: 'no-cors' }).catch(() => {});
      } catch (e) {}
    });
  }

  /* ---------- Утилиты ---------- */
  /** Плавный счётчик. format(n) -> строка */
  function countUp(el, to, { dur = 900, from = 0, power = 3, format = (n) => n.toLocaleString('ru-RU') } = {}) {
    return new Promise((done) => {
      const t0 = performance.now();
      const step = (t) => {
        const p = Math.max(0, Math.min(1, (t - t0) / dur));
        el.textContent = format(Math.round(from + (to - from) * (1 - Math.pow(1 - p, power))));
        p < 1 ? requestAnimationFrame(step) : done();
      };
      requestAnimationFrame(step);
    });
  }

  const toastEl = $('toast');
  let toastTimer;
  function toast(text, ms = 2200) {
    toastEl.textContent = text;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), ms);
  }

  /** Кнопка Telegram с заполнением-прогрессом (.tg-main) */
  async function progressButton(btn, { total, dur = 1400, label = (n, t) => `Отправлено ${n} из ${t}` }) {
    const fill = btn.querySelector('.tg-main-fill');
    const text = btn.querySelector('.tg-main-label');
    const t0 = performance.now();
    await new Promise((done) => {
      const step = (t) => {
        const p = Math.max(0, Math.min(1, (t - t0) / dur));
        fill.style.width = `${p * 100}%`;
        text.textContent = label(Math.round(total * p), total);
        p < 1 ? requestAnimationFrame(step) : done();
      };
      requestAnimationFrame(step);
    });
  }

  /* ---------- Экраны ---------- */
  /** iOS-переход вперёд: from уезжает влево и темнеет, to въезжает справа */
  function pushScreen(from, to) {
    from && from.classList.add('is-behind');
    to.classList.add('is-active');
  }

  /* ---------- Пуши ---------- */
  const pushesEl = $('pushes');
  /**
   * push({ title, text, av, letter, ttl, onTap, sound })
   * av — класс аватара (av-red, av-green…), ttl=0 — висит до клика/clearPushes
   */
  function push({ title, text, av = 'av-gray', letter, ttl = 2600, onTap, sound = 'push' }) {
    sfx(sound);
    haptic.tap();
    const el = document.createElement('div');
    el.className = 'push' + (onTap ? ' is-tappable' : '');
    el.innerHTML = `<div class="avatar ${av}">${letter || title[0]}</div>
      <div><div class="push-title">${title}</div><div class="push-text">${text}</div></div>`;
    if (onTap) el.addEventListener('click', () => onTap(el));
    pushesEl.prepend(el);
    while (pushesEl.children.length > 3) pushesEl.lastChild.remove();
    if (ttl) setTimeout(() => dismissPush(el), ttl);
    return el;
  }
  function dismissPush(el) {
    el.classList.add('is-out');
    setTimeout(() => el.remove(), 400);
  }
  const clearPushes = () => [...pushesEl.children].forEach(dismissPush);

  /* ---------- Чат Telegram ---------- */
  const TICKS = '<span class="ticks-pill"><svg class="ticks" viewBox="0 0 16 10"><path d="M1 5.5l3 3 6-7"/><path d="M6 8.5l1 0 7-7"/></svg></span>';

  /** Обёртка над <section class="screen chat">: сообщения, статус, кружки */
  function chat(screen) {
    const feed = screen.querySelector('.tg-feed');
    const statusEl = screen.querySelector('.tg-status');
    const idle = statusEl ? statusEl.textContent : '';
    return {
      screen,
      feed,
      /** Временный статус в шапке: «печатает…», «записывает видео…» */
      async status(text, ms) {
        statusEl.textContent = text;
        statusEl.classList.add('is-active');
        await wait(ms);
        statusEl.textContent = idle;
        statusEl.classList.remove('is-active');
      },
      /** Текстовое сообщение: side = 'in' | 'out' */
      bubble(side, html) {
        const el = document.createElement('div');
        el.className = `bubble ${side}`;
        el.innerHTML = html;
        feed.appendChild(el);
        sfx(side === 'out' ? 'sent' : 'message');
        if (side === 'in') haptic.tap();
        return el;
      },
      /** Исходящая «картинка» — клон любого узла (например, макета) */
      async photo(node, readAfter = 800) {
        const el = document.createElement('div');
        el.className = 'bubble out photo';
        el.innerHTML = '<span class="photo-box"></span>';
        el.firstChild.appendChild(node.cloneNode(true));
        el.firstChild.insertAdjacentHTML('beforeend', TICKS);
        feed.appendChild(el);
        sfx('sent');
        await wait(readAfter);
        el.classList.add('is-read');
        return el;
      },
      /** Входящий кружок-заглушка; играть через Engine.playNote */
      note() {
        const el = document.createElement('div');
        el.className = 'note';
        el.innerHTML = `<svg class="note-ring" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" pathLength="100"/><circle cx="50" cy="50" r="48" pathLength="100"/></svg>
          <span class="note-time">0:00</span>`;
        feed.appendChild(el);
        sfx('message');
        haptic.tap();
        return el;
      },
    };
  }

  /* ---------- Видеосообщение: кружок -> полный экран -> кружок ---------- */
  let current = null; // { note, finish }

  // FLIP: полноэкранный плеер сжимается в квадрат, скругляется в круг и встаёт поверх кружка
  function placeOver(note) {
    const a = app.getBoundingClientRect();
    const r = note.getBoundingClientRect();
    const W = a.width, H = a.height, d = r.width;
    const cx = r.left - a.left + d / 2;
    const cy = r.top - a.top + d / 2;
    player.style.transform = `translate(${cx - W / 2}px, ${cy - H / 2}px) scale(${d / W})`;
    player.style.clipPath = `inset(${(H - W) / 2}px 0px round ${W / 2}px)`;
  }
  function expand() {
    player.classList.remove('is-circle');
    player.style.transform = 'translate(0px, 0px) scale(1)';
    player.style.clipPath = 'inset(0px 0px round 0px)';
  }
  function snapshot(note) {
    try {
      const vw = pv.videoWidth, vh = pv.videoHeight;
      if (!vw) return;
      const a = app.getBoundingClientRect();
      const scale = Math.max(a.width / vw, a.height / vh);
      const side = a.width / scale;
      const c = document.createElement('canvas');
      c.width = c.height = 360;
      c.getContext('2d').drawImage(pv, (vw - side) / 2, (vh - side) / 2, side, side, 0, 0, 360, 360);
      note.style.backgroundImage = `url(${c.toDataURL('image/jpeg', 0.82)})`;
    } catch (e) { /* без превью — не критично */ }
  }

  /**
   * Проиграть видео в кружке: появляется в чате, раскрывается на весь экран,
   * по окончании (или «Пропустить») сворачивается обратно. Промис — после сворачивания.
   */
  function playNote(note, src, { expandAfter = 1100 } = {}) {
    return new Promise((resolve) => {
      player.classList.add('no-anim', 'is-circle');
      player.hidden = false;
      placeOver(note);
      player.getBoundingClientRect();
      player.classList.remove('no-anim');

      pv.src = src;
      pv.currentTime = 0;
      play(pv);

      const me = { note, finish: null };
      me.finish = async () => {
        if (current !== me) return;
        current = null;
        note.querySelector('.note-time').textContent = fmt(pv.duration || 0);
        pv.pause();
        snapshot(note);
        player.classList.add('is-circle');
        placeOver(note);
        await wait(700);
        player.hidden = true;
        note.classList.add('is-played');
        resolve();
      };
      current = me;

      // Раскрываем только после старта воспроизведения, чтобы избежать чёрного экрана
      let expanded = false;
      const triggerExpand = () => {
        if (expanded || current !== me) return;
        expanded = true;
        setTimeout(() => {
          if (current === me) expand();
        }, expandAfter);
      };

      if (!pv.paused && pv.currentTime > 0) {
        triggerExpand();
      } else {
        pv.addEventListener('playing', triggerExpand, { once: true });
        // Страховка от редких сбоев браузера
        setTimeout(triggerExpand, expandAfter + 1200);
      }
    });
  }

  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  pv.addEventListener('timeupdate', () => {
    if (!pv.duration || !current) return;
    const p = pv.currentTime / pv.duration;
    current.note.querySelector('circle + circle').style.strokeDashoffset = 100 - p * 100;
    current.note.querySelector('.note-time').textContent = fmt(Math.max(0, pv.duration - pv.currentTime));
    // замираем на последнем кадре, а не на чёрном
    if (pv.duration - pv.currentTime < 0.15) current.finish();
  });
  pv.addEventListener('ended', () => current && current.finish());
  pvSkip.addEventListener('click', () => { haptic.tap(); current && current.finish(); });
  player.addEventListener('click', (e) => {
    if (e.target !== pvSkip && pv.muted) { pv.muted = false; haptic.tap(); }
  });

  /* ---------- Figma: выбор макета ---------- */
  const backdrop = $('backdrop');

  /** Открыть шторку (.sheet с .frame[data-choice]) и дождаться выбора. Возвращает data-choice */
  function choose(sheet, { shuffle = true } = {}) {
    return new Promise((resolve) => {
      const container = sheet.querySelector('.frames');
      if (container && shuffle && Math.random() < 0.5) {
        const items = [...container.querySelectorAll('.frame')];
        if (items.length === 2) {
          container.appendChild(items[0]);
        }
      }
      const frames = [...sheet.querySelectorAll('.frame')];
      sheet.classList.remove('is-picked');
      frames.forEach((f) => f.classList.remove('is-selected'));
      backdrop.classList.add('is-on');
      sheet.classList.add('is-open');
      sheet.setAttribute('aria-hidden', 'false');

      const onPick = async (e) => {
        const frame = e.currentTarget;
        frames.forEach((f) => f.removeEventListener('click', onPick));
        haptic.select();
        frame.classList.add('is-selected');
        sheet.classList.add('is-picked');
        await wait(650);
        sheet.classList.remove('is-open');
        sheet.setAttribute('aria-hidden', 'true');
        backdrop.classList.remove('is-on');
        await wait(350);
        resolve(frame.dataset.choice);
      };
      frames.forEach((f) => f.addEventListener('click', onPick));
    });
  }

  /* ---------- Figma: экран итога ---------- */
  const resultEl = $('result'), resultFrame = $('resultFrame'), amountEl = $('amount'), resultBtn = $('resultBtn');
  const commentText = $('commentText'), commentAvatar = $('commentAvatar');

  /**
   * result({ node, win, amount, comment, avatar: { letter, av }, button, onButton })
   * node — макет (клонируется), amount — сумма в ₽ (при win считается вверх)
   */
  function result({ node, win, amount = 0, comment, avatar = {}, button, onButton }) {
    resultFrame.innerHTML = '';
    resultFrame.appendChild(node.cloneNode(true));
    resultFrame.classList.toggle('is-rejected', !win);
    commentText.textContent = comment;
    commentAvatar.className = `avatar ${avatar.av || 'av-red'}`;
    commentAvatar.textContent = avatar.letter || 'К';
    amountEl.className = `amount ${win ? 'is-win' : 'is-zero'}`;
    amountEl.textContent = win ? '+0 ₽' : '0 ₽';
    resultBtn.textContent = button;
    resultBtn.onclick = () => { haptic.tap(); onButton && onButton(); };
    resultEl.classList.add('is-open');
    resultEl.setAttribute('aria-hidden', 'false');

    if (win) {
      setTimeout(() => {
        countUp(amountEl, amount, { format: (n) => `+${n.toLocaleString('ru-RU')} ₽` });
        sfx('cash');
        haptic.success();
      }, 700);
    } else {
      setTimeout(() => { sfx('fail'); haptic.error(); }, 750);
    }
  }
  function closeResult() {
    resultEl.classList.remove('is-open');
    resultEl.setAttribute('aria-hidden', 'true');
    return wait(300);
  }

  return {
    $, wait, tg, haptic,
    loadSounds, sfx, unlock, play, prefetch, countUp, toast, progressButton,
    pushScreen, push, clearPushes,
    chat, playNote, choose, result, closeResult,
  };
})();
