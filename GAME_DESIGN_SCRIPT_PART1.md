# Дизайн-документ и Сценарий: Интерактивный квест для дизайнеров
**Формат:** Комедийный интерактивный FMV-квест (Choose Your Own Adventure)  
**Платформа:** Telegram Mini App (TMA) / Мобильный Web (PWA)  
**Стиль визуала:** Генеративные 9:16 вертикальные видео (Google Veo 3) на базе стартовых кадров (NanoBanana)  
**Аудио:** Бесплатный стабильный пайплайн с сохранением голосов персонажей  

---

## 1. Концепт и механики

### 1.1. Базовая идея
Сатира на культуру «успешного успеха», инфокурсы («Войти в IT за 3 дня с Бали на 300к») и реальные мучения начинающего дизайнера при работе с дешевыми клиентами.

### 1.2. Игровой UI / UX
* **Интерфейс мессенджера:** Основное взаимодействие стилизовано под Telegram.
* **Видео-кружочки с разворотом:** В чат прилетают видеосообщения-кружочки. При клике (или авто-воспроизведении) они плавно распахиваются в полноэкранное вертикальное видео (формат 9:16).
* **Пуш-уведомления:** Всплывающие уведомления в верхней части экрана (входящие сообщения от контактов, уведомления о переводах от банка).
* **Единый показатель выживания:** 
  * `Баланс карты: 48 ₽`
  * `Запас еды: 0 дошираков`  
  *(Никаких перегруженных шкал менталки и параметров — только осязаемые деньги на выживание).*

---

## 2. Бесплатный звуковой пайплайн (Консистентные голоса)

Чтобы голоса персонажей (Серёжа, Самвел, жена, будущие клиенты) звучали одинаково на протяжении всей игры без бюджета:

1. **Голосовая актерская игра (RVC — Retrieval-based Voice Conversion):**
   * Все реплики наговариваются создателем игры на микрофон смартфона с нужной комедийной интонацией, паузами и вздохами.
   * Через бесплатный опенсорсный RVC голос переводится в тембр конкретного персонажа (Серёжа, Самвел).
   * *Альтернатива:* **F5-TTS** (клонирование по 10-секундному эталонному образцу) или **Edge-TTS** (голоса `ru-RU-DmitryNeural`).
2. **Синхронизация губ (Lip-sync):**
   * Сгенерированное в Veo 3 видео прогоняется через **LivePortrait** или **Wav2Lip** (в бесплатном Google Colab) под готовую звуковую дорожку.
3. **SFX & Интершум:**
   * Бесплатные библиотеки: Freesound.org / Pixabay Audio (хлопки, скрип резины, писк домофона, шипение масла на гриле).

---

## 3. Сценарий: Часть 1. «Первый заказ»

---

### ШОТ 1: Реклама курса («Успешный успех»)
* **Формат:** Полноразмерное коммерческое видео (9:16). Дорогой продакшн.
* **Визуал:** Лазурный инфинити-бассейн на Бали, пальмы, закатное солнце. Загорелый парень (Серёжа) в яркой гавайской рубашке и солнечных очках вальяжно полулежит на гигантском розовом надувном фламинго с ноутбуком.
* **Звук:** Дорогая тропическая чилл-музыка.
* **Текст реплики (Русский):**
  > *«Хочешь работать 2 часа в день прямо с пляжа и зарабатывать от 300 тысяч рублей? Мой авторский курс "UX/UI Бог за 3 дня" сделает из тебя сеньора. Залетай по ссылке, забирай жизнь мечты!»*

---

### ПЕРЕХОД: «Бытовой слом»
* **Тайминг:** 0:06 – 0:08
* Серёжа заканчивает фразу, подмигивает в камеру и удерживает натянутую белозубую улыбку.
* **Звук перелома:** Из глубины квартиры доносится громкий бытовой голос молодой девушки:
  > *«Серёжа, ты скоро?! Мне тоже камера нужна-а-а!»*
* Серёжа мгновенно ломает позу, раздраженно закатывает глаза, улыбка сползает с лица.
* **Смэш-кат (мгновенная склейка):** Музыка резко выключается в тишину комнаты.

---

### ШОТ 2: Бэкстейдж в квартире («Реальность»)
* **Формат:** Общий план со штативом в кадре (9:16).
* **Визуал:** Серёжа сидит на том же фламинго на полу светлой современной скандинавской квартиры. За его спиной — большой зеленый хромакей на стойках. Сверху светят студийные софтбоксы. На переднем плане — фотоаппарат на штативе.
* **Звук:** Гул вентилятора софита, скрип надувного фламинго по полу.
* **Действие:** Серёжа кричит в сторону коридора:
  > *«Да щас, пять минут, последний шот допишу!»*
* Поворачивается обратно в камеру, поднимает очки на макушку, говорит обычным усталым тоном:
  > *«Ну в общем... как сохранять в PNG ты понял, остальное нагуглишь. И держи главный секрет поиска заказов: открываешь телефонную книгу и делаешь рассылку всем подряд от "А" до "Я", мол, "я теперь дизайнер, сделаю логотип со скидкой". Работает безотказно. Бывай!»*

---

### ИНТЕРАКТИВ 1: Экран телефона игрока
* **Статус-бар вверху:** `Баланс: 48 ₽ | Дошики: 0 шт.`
* **Кнопка действия:**  
  👉 **`[ Сделать веерную рассылку по контактам ]`**
* **Событие после нажатия:** Каскад быстрых пушей сверху экрана:
  * 🔴 *Бывшая:* «Ты больной? Удали мой номер.»
  * 🔴 *Военкомат:* «Ждем на медкомиссию.»
  * 🔴 *Бабушка:* «Внучек, денег скинуть на суп?»
  * 🟢 **Крупный пуш (аватарка шаурмы):**  
    *Самвел (Шаурма у метро): прислал видеосообщение.*

---

### ШОТ 3: Кружочек Самвела («Бриф на шаурму»)
* **Формат:** Селфи-видео от первого лица (ракурс снизу, открывается на весь экран).
* **Визуал:** Самвел (48 лет, колоритный кавказец с пышными усами) в белом фартуке внутри тесного павильона шаурмы. Сзади крутится вертикальный вертел с шипящим мясом, валит пар. Самвел эмоционально машет щипцами для мяса в камеру.
* **Текст реплики (Русский, кавказский акцент, эмоционально):**
  > *«Здорово, дизайнер! Ты вовремя написал! Короче, мне на точку срочно нужна вывеска. Чтоб огонь был, чтоб мясо сочное прям в рот летело, и напиши крупно: "ШАУРМА — ЭТО ВАМ НЕ ЭТО". Плачу тыщу рублей наличкой и два донера с чесночным соусом. Сделай к вечеру, по-братски!»*

---

### ИНТЕРАКТИВ 2: Выбор концепта
Игроку предлагается выбрать макет для отправки Самвелу:

1. **[Вариант А: «Скандинавский минимализм»]**  
   *Описание: Бежевый фон, маленькая точка по центру, шрифт Helvetica 10pt.*
2. **[Вариант Б: «Народный люкс» (КАНОН)]**  
   *Описание: Адское клипарт-пламя, гигантская шаурма, золотой Comic Sans с двойной обводкой.*
3. **[Вариант В: «Поумничать про UX»]**  
   *Описание: Отправить голосовое с критикой слогана и теорией золотого сечения.*

---

### РАЗВЯЗКИ ВЫБОРА

#### Развилка А (Минимализм):
* **Видео-ответ:** Самвел щурится в экран телефона, стучит по нему пальцем:  
  *«Э, ты че мне прислал? Белый лист бумаги?! Где мясо?! Где искры?! Мой внук в пейнте лучше нарисует! Пошел вон, ничего не заплачу!»*
* **Итог:** `Баланс: 48 ₽` → **GAME OVER: Вы умерли с голоду, зато с идеальной типографикой.**

#### Развилка В (Поумничать):
* **Видео-ответ:** Самвел нервно курит на заднем дворе ларька:  
  *«Слышь, Баухаус недоделанный, ты кого учить вздумал? Я 15 лет мясо кручу, я лучше знаю, че моим людям надо! Я другого нашел.»*
* **Итог:** `Баланс: 48 ₽` → **GAME OVER: Задушен собственной душнотой.**

#### Развилка Б (Народный люкс) — КАНОН:
* **Видео-ответ:** Самвел в полном восторге целует экран телефона:  
  *«ВАХ, БРАТ! Вот это уровень! Вот это по-дубайски! Мясо горит, буквы жирные — с трассы видно! Лови бабки на карту, за шаурмой сам заходи. Слушай, тут ко мне Михалыч из гаражей заходил, масло меняет... ему тоже логотип нужен, я ему дал твой номерок!»*
* **Пуш-уведомление банка:** `+1 000 ₽ от Самвел А. (Сообщение: На шаурму)`
* **Обновленный баланс:** `Баланс: 1 048 ₽ (+2 донера в инвентарь)`
* **Переход ко 2-й части:** Входящий вызов от контакта «Михалыч Автосервис».

---

## 4. Промпты для генерации (NanoBanana + Google Veo 3)

### Шот 1: Реклама курса на Бали

#### Статика (NanoBanana):
```text
Commercial advertisement shot, 9:16 vertical aspect ratio. Medium shot of a charismatic handsome 28-year-old tanned man with stylish short haircut and neat light stubble. He is relaxing on a large bright pink inflatable flamingo float in an infinity swimming pool overlooking tropical palm trees and ocean at golden hour. He is wearing a colorful stylish floral summer shirt and designer sunglasses, casually holding a sleek modern silver laptop on his lap. High-end luxury commercial aesthetics, clean cinematic lighting, vibrant saturated colors, shallow depth of field, 8k, professional color grading. --ar 9:16 --v 6.1
```

#### Анимация (Google Veo 3):
```text
Commercial ad video, 9:16 vertical. Smooth slow camera push-in. The charismatic man on the pink flamingo float talks engagingly directly to the camera, gesticulating confidently with one hand while holding the laptop. Gentle water ripples in the pool, soft golden sunlight reflecting on the water. Confident bright smile, natural eye contact, high-end commercial pacing.
[Dialogue spoken in Russian with energetic infobiz tone: "Хочешь работать 2 часа в день прямо с пляжа и зарабатывать от 300 тысяч рублей? Мой авторский курс 'UX/UI Бог за 3 дня' сделает из тебя сеньора. Залетай по ссылке, забирай жизнь мечты!"]. At the very end he winks and freezes with a fake commercial smile. 24fps, cinematic 4k.
```

---

### Шот 2: Бэкстейдж в квартире

#### Статика (NanoBanana / Image-to-Image на базе Шота 1):
```text
Wide behind-the-scenes commercial shoot, 9:16 vertical aspect ratio. Same handsome 28-year-old man from reference image with neat short hair, wearing the exact same colorful tropical floral Hawaiian shirt and shorts. He is sitting on the bright pink inflatable flamingo float placed directly on the clean light wooden laminate floor of a stylish, modern tidy apartment living room. Behind him, a large professional green screen backdrop spans across the entire back wall. Studio equipment around him: tall C-stands with big softboxes and an overhead warm spotlight angled down, casting a powerful artificial golden-hour sunlight glow directly on him. In the foreground, a professional cinema DSLR camera on a tripod is filming him from the back/side. Authentic filmmaking setup, modern Scandinavian interior visible at the edges, clean room, humorous contrast of fake staged tropical set inside a regular modern city apartment. High detail, 8k, cinematic lighting. --ar 9:16 --v 6.1
```

#### Анимация (Google Veo 3):
```text
Behind-the-scenes video in a modern apartment, 9:16 vertical. Static camera framing with the tripod camera in the foreground. The man sitting on the pink flamingo in the middle of the room drops his fake smile into an irritated, annoyed expression. He shouts towards the hallway off-camera:
[Dialogue spoken in Russian, annoyed tone: "Да щас, пять минут, последний шот допишу!"].
Then he pushes his sunglasses up onto his hair, turns back toward the camera with a casual tired attitude, gestures with his hand:
[Dialogue spoken in Russian, casual conversational tone: "Ну в общем... как сохранять в PNG ты понял, остальное нагуглишь. Открываешь контакты и делаешь рассылку всем подряд от А до Я. Работает безотказно. Бывай!"].
Natural authentic acting, comedic timing, 24fps.
```

---

### Шот 3: Кружочек Самвела (Бриф)

#### Статика (NanoBanana):
```text
Raw smartphone selfie video still, 9:16 vertical aspect ratio. Low angle shot looking slightly up at an expressive, friendly 48-year-old Caucasian/Armenian street food vendor with a thick mustache and cheerful eyes. He is wearing a slightly stained white apron and casual clothes. He is holding the phone in one hand inside a small, steamy street food kiosk. In the background: a large vertical rotating doner meat spit glowing with red electric heaters, smoke and steam rising, prep counter with ingredients. Dim warm fluorescent food-stall lighting, genuine realistic documentary texture, candid mobile video capture. --ar 9:16 --v 6.1
```

#### Анимация (Google Veo 3):
```text
Candid smartphone selfie video with realistic handheld camera motion, 9:16 vertical. The mustache vendor talks animatedly directly into the camera lens with exaggerated facial expressions, gesturing vigorously with stainless steel meat tongs held in his other hand. Hot steam and smoke rise behind him from the rotating meat spit.
[Dialogue spoken in Russian with enthusiastic Caucasian accent: "Здорово, дизайнер! Ты вовремя написал! Короче, мне на точку срочно нужна вывеска. Чтоб огонь был, чтоб мясо сочное прям в рот летело, и напиши крупно: 'ШАУРМА — ЭТО ВАМ НЕ ЭТО'. Плачу тыщу рублей наличкой и два донера с чесночным соусом. Сделай к вечеру, по-братски!"]. Natural head movements, passionate friendly energy, 24fps.
```

---

### Шот 4: Самвел (Победная реакция на «Народный люкс»)

#### Статика (NanoBanana):
```text
Smartphone selfie still, 9:16 vertical. The same 48-year-old mustache shawarma vendor looking at the phone screen with extreme joy, huge toothy grin, radiant ecstatic expression, eyes wide with delight. Still inside his steamy shawarma kiosk, background slightly blurred. Warm lighting, realistic mobile camera artifacting. --ar 9:16 --v 6.1
```

#### Анимация (Google Veo 3):
```text
High-energy selfie video, 9:16 vertical. The vendor laughs with pure excitement, brings the phone closer to his face and humorously kisses the screen, then pulls back, giving a big thumbs-up to the camera while shouting with joy and talking enthusiastically.
[Dialogue spoken in Russian with joyful Caucasian accent: "ВАХ, БРАТ! Вот это уровень! Вот это по-дубайски! Мясо горит, буквы жирные — с трассы видно! Лови бабки на карту, за шаурмой сам заходи. Тут ко мне Михалыч из гаражей заходил... ему тоже логотип нужен, я ему дал твой номерок!"]. Dynamic handheld shake, genuine comedic timing, joyful and authentic, 24fps.
```

---

## 5. Роадмап следующих клиентов (Часть 2 и далее)

1. **Клиент 2: Михалыч (Автосервис / Разборка):**
   * *Типаж:* Суровый неразговорчивый мужик в замасленном комбинезоне. Видео из темного гаража, камера смотрит в ноздрю, половину слов жует: *«Слышь... это... ну шоб машина там... поршень... эээ... ну шоб солидно, понял, да?»*.
2. **Клиент 3: Анжелика (Ноготочки / Реснички «Luxury Lash»):**
   * *Типаж:* Девушка с надутыми губами и бьюти-фильтром. Шепчет в камеру: *«Приветики, мне нужен логотипчик, но не банальный... шоб было дорого, воздушно, как перышко, но с золотой короной. Скину 500 референсов в Pinterest...»*.
3. **Клиент 4: Богдан (Школьник-стример, 12 лет):**
   * *Типаж:* Записывает кружочек в школьной форме с петличкой: *«Привет, чувак, я топ-1 СНГ по Бравл Старс, нужна шапка канала. Денег нет, но сделаешь за респект и пиар на стриме — ко мне 5 зрителей ходят!»*.
