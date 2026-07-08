/* REYRO STUDIONS — логика сайта:
   лоадер, настройки (тема/звук/производительность), звук WebAudio,
   динамический слоган, частицы с реакцией на курсор, tilt витрины,
   ползунок прогресса скролла, telegram-FAB, бриф-форма. */

(function () {
  "use strict";

  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- защита текста: без копирования/выделения/контекстного меню ---------- */

  function isEditable(el) {
    return el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
  }

  document.addEventListener("copy", (e) => { if (!isEditable(e.target)) e.preventDefault(); });
  document.addEventListener("cut", (e) => { if (!isEditable(e.target)) e.preventDefault(); });
  document.addEventListener("contextmenu", (e) => { if (!isEditable(e.target)) e.preventDefault(); });
  document.addEventListener("selectstart", (e) => { if (!isEditable(e.target)) e.preventDefault(); });

  /* ---------- настройки (localStorage) ---------- */

  const defaults = { theme: "dark", sound: true, perf: "full" };
  let settings = { ...defaults };
  try {
    settings = { ...defaults, ...JSON.parse(localStorage.getItem("reyro-settings") || "{}") };
  } catch (_) { /* повреждённые данные — используем дефолт */ }

  function saveSettings() {
    localStorage.setItem("reyro-settings", JSON.stringify(settings));
  }

  const themeBtn = document.getElementById("themeBtn");
  const soundBtn = document.getElementById("soundBtn");
  const perfBtn = document.getElementById("perfBtn");
  const perfLabel = document.getElementById("perfLabel");

  function applySettings() {
    root.dataset.theme = settings.theme;
    root.dataset.perf = settings.perf;
    soundBtn.setAttribute("aria-pressed", String(settings.sound));
    perfBtn.setAttribute("aria-pressed", String(settings.perf === "lite"));
    perfLabel.textContent = settings.perf === "lite" ? "LITE" : "FULL";
  }

  themeBtn.addEventListener("click", () => {
    settings.theme = settings.theme === "dark" ? "light" : "dark";
    applySettings(); saveSettings(); blip(660);
  });

  soundBtn.addEventListener("click", () => {
    settings.sound = !settings.sound;
    applySettings(); saveSettings();
    if (settings.sound) blip(720);
  });

  perfBtn.addEventListener("click", () => {
    settings.perf = settings.perf === "lite" ? "full" : "lite";
    applySettings(); saveSettings(); blip(520);
  });

  applySettings();

  /* ---------- звук: мягкие UI-блипы ---------- */

  let audioCtx = null;

  function blip(freq = 560, dur = 0.07, gain = 0.045) {
    if (!settings.sound) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      g.gain.setValueAtTime(gain, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
      osc.connect(g).connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + dur);
    } catch (_) { /* нет WebAudio — молчим */ }
  }

  document.querySelectorAll(".btn, .nav__links a, .tg-fab").forEach((el) => {
    el.addEventListener("mouseenter", () => blip(760, 0.045, 0.02));
    el.addEventListener("click", () => blip(520, 0.09, 0.05));
  });

  /* ---------- лоадер ---------- */

  const loader = document.getElementById("loader");
  const loaderBar = document.getElementById("loaderBar");
  let progress = 0;

  const progressTimer = setInterval(() => {
    progress = Math.min(progress + 8 + Math.random() * 14, 92);
    loaderBar.style.width = progress + "%";
  }, 120);

  function finishLoader() {
    clearInterval(progressTimer);
    loaderBar.style.width = "100%";
    setTimeout(() => loader.classList.add("is-done"), 350);
    setTimeout(() => loader.remove(), 1100);
  }

  if (document.readyState === "complete") {
    setTimeout(finishLoader, reducedMotion ? 100 : 900);
  } else {
    window.addEventListener("load", () => setTimeout(finishLoader, reducedMotion ? 100 : 900));
  }

  /* ---------- динамический слоган ---------- */

  const slogans = [
    "САЙТЫ, КОТОРЫЕ НЕВОЗМОЖНО ЗАБЫТЬ.",
    "КИНЕМАТОГРАФИЧЕСКИЕ САЙТЫ, КОТОРЫЕ ХОЧЕТСЯ ДОСМОТРЕТЬ.",
    "WEBGL, MOTION И LUXURY-ИНТЕРФЕЙСЫ ПОД КЛЮЧ.",
    "DIGITAL EXPERIENCE, КОТОРЫЙ ПРЕВРАЩАЕТ ВНИМАНИЕ В ЗАЯВКИ.",
  ];
  const sloganEl = document.getElementById("dynamicSlogan");
  let sloganIdx = 0;

  setInterval(() => {
    sloganEl.classList.add("is-leaving");
    setTimeout(() => {
      sloganIdx = (sloganIdx + 1) % slogans.length;
      sloganEl.textContent = slogans[sloganIdx];
      sloganEl.classList.remove("is-leaving");
    }, 600);
  }, 5000);

  /* ---------- частицы: дрейф + разлетаются от курсора ---------- */

  const canvas = document.getElementById("particles");
  const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
  // полный DPR (retina/4K) — рендер чёткий на любом экране
  const DPR = Math.min(window.devicePixelRatio || 1, 2.5);
  const PARTICLE_ALPHA = 0.5;
  let W = 0, H = 0, dots = [];
  const mouse = { x: -9999, y: -9999 };

  function resizeCanvas() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    spawnDots();
  }

  function spawnDots() {
    const count = Math.min(Math.round((W * H) / 4200), 700);
    dots = Array.from({ length: count }, () => {
      const a = Math.random() * 0.4 + 0.14;
      const white = Math.random() < 0.22; // ~пятая часть — белые и поярче
      const hx = Math.random() * W;
      const hy = Math.random() * H;
      const baseR = Math.random() * 26 + 8;      // радиус орбиты вокруг «дома»
      const ang = Math.random() * Math.PI * 2;
      return {
        hx, hy,                                  // центр орбиты (дом) — не улетает
        ang,
        spd: (Math.random() < 0.5 ? 1 : -1) * (Math.random() * 0.008 + 0.004),
        baseR,
        orbR: baseR,                             // текущий радиус (плавно меняется)
        targR: baseR,
        x: hx + Math.cos(ang) * baseR,
        y: hy + Math.sin(ang) * baseR,
        r: white ? Math.random() * 1.9 + 2.5 : Math.random() * 2.6 + 1.5,
        cDark: white
          ? "rgba(255,255,255," + (Math.min(a + 0.35, 0.85) * PARTICLE_ALPHA).toFixed(3) + ")"
          : "rgba(150,190,255," + (a * PARTICLE_ALPHA).toFixed(3) + ")",
        cLight: white
          ? "rgba(70,110,190," + ((a + 0.25) * PARTICLE_ALPHA).toFixed(3) + ")"
          : "rgba(47,100,200," + (a * 0.85 * PARTICLE_ALPHA).toFixed(3) + ")",
      };
    });
  }

  window.addEventListener("pointermove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener("pointerleave", () => { mouse.x = -9999; mouse.y = -9999; });
  window.addEventListener("resize", resizeCanvas);

  const TWO_PI = Math.PI * 2;
  const INFLUENCE = 210;
  const INFLUENCE_SQ = INFLUENCE * INFLUENCE;

  /* взрыв: искры + ударная волна по орбитам ближайших шариков */
  const sparks = [];

  function burst(x, y) {
    if (reducedMotion || root.dataset.perf === "lite") return;

    for (let i = 0; i < 42; i++) {
      const ang = Math.random() * TWO_PI;
      const spd = Math.random() * 7 + 3;
      sparks.push({
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        r: Math.random() * 2.2 + 1,
        life: 1,
      });
    }

    // разгоняем орбиты шариков вокруг точки клика — «разлетаются»
    const RADIUS = 380;
    for (const d of dots) {
      const dx = d.hx - x;
      const dy = d.hy - y;
      const dist = Math.hypot(dx, dy);
      if (dist < RADIUS) {
        d.orbR += (1 - dist / RADIUS) * 220;
      }
    }
  }

  function tickParticles() {
    requestAnimationFrame(tickParticles);
    if (reducedMotion || root.dataset.perf === "lite") return;

    ctx.clearRect(0, 0, W, H);
    const light = root.dataset.theme === "light";
    const mx = mouse.x, my = mouse.y;

    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];

      // курсор рядом с домом — раздуваем орбиту (шарик не улетает, а меняет орбиту)
      const hdx = d.hx - mx;
      const hdy = d.hy - my;
      const hDistSq = hdx * hdx + hdy * hdy;
      if (hDistSq < INFLUENCE_SQ) {
        const t = 1 - Math.sqrt(hDistSq) / INFLUENCE;
        d.targR = d.baseR + t * 150;
      } else {
        d.targR = d.baseR;
      }

      // плавно тянем текущий радиус к целевому и крутим по орбите
      d.orbR += (d.targR - d.orbR) * 0.09;
      d.ang += d.spd;
      d.x = d.hx + Math.cos(d.ang) * d.orbR;
      d.y = d.hy + Math.sin(d.ang) * d.orbR;

      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, TWO_PI);
      ctx.fillStyle = light ? d.cLight : d.cDark;
      ctx.fill();
    }

    // искры взрыва: летят, тормозят, гаснут
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.x += s.vx; s.y += s.vy;
      s.vx *= 0.94; s.vy *= 0.94;
      s.life -= 0.022;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      ctx.globalAlpha = s.life;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TWO_PI);
      ctx.fillStyle = light ? "rgba(47,110,220,0.9)" : "#9CC5FF";
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  resizeCanvas();
  tickParticles();

  /* ---------- tilt-эффект витрины ---------- */

  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      if (reducedMotion || root.dataset.perf === "lite") return;
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${py * -5}deg) rotateY(${px * 6}deg)`;
    });
    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });

  /* ---------- скролл: шапка, левый ползунок, telegram-FAB ---------- */

  const nav = document.getElementById("nav");
  const scrollThumb = document.getElementById("scrollThumb");
  const tgFab = document.getElementById("tgFab");
  const rail = document.querySelector(".scroll-rail");
  const railDots = Array.from(document.querySelectorAll(".scroll-rail__dot"));

  // станции: позиция каждой секции на рейле
  function layoutDots() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    railDots.forEach((dot) => {
      const el = document.getElementById(dot.dataset.target);
      if (!el) return;
      const y = dot.dataset.target === "hero" ? 0 : Math.min(el.offsetTop - 72, max);
      dot._pos = Math.max(0, y);
      dot.style.top = (max > 0 ? (dot._pos / max) * 100 : 0) + "%";
    });
  }

  railDots.forEach((dot) => {
    dot.addEventListener("click", () => {
      window.scrollTo({ top: dot._pos, behavior: reducedMotion ? "auto" : "smooth" });
      blip(640, 0.06, 0.03);
    });
  });

  function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 24);
    tgFab.classList.toggle("is-visible", y > 320);

    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(y / max, 1) : 0;
    // заполнение сверху вниз по всей длине рейла
    scrollThumb.style.height = (p * rail.clientHeight) + "px";

    // активная станция — последняя, до которой доехали
    const probe = y + window.innerHeight * 0.35;
    let active = railDots[0];
    for (const dot of railDots) {
      if (dot._pos <= probe) active = dot;
    }
    railDots.forEach((dot) => {
      const passed = dot._pos <= probe;
      dot.classList.toggle("is-passed", passed);
      dot.classList.toggle("is-active", dot === active);
      dot.setAttribute("aria-current", dot === active ? "true" : "false");
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => { layoutDots(); onScroll(); });
  layoutDots();
  onScroll();

  /* ---------- методология: круги, взрыв, шкала, панель ---------- */

  const processSteps = [
    { num: "01", name: "DISCOVERY", text: "Разбираем задачу, аудиторию, продукт и цель сайта. Фиксируем, что именно должно продавать впечатление: доверие, заявку, премиальность или запуск нового бренда." },
    { num: "02", name: "ART DIRECTION", text: "Собираем визуальный язык: цвет, типографику, сетку, атмосферу, референсы и главный вау-образ, который будет отличать сайт от шаблонов." },
    { num: "03", name: "SALES FLOW", text: "Проектируем путь пользователя: первый экран, доказательства, витрина, CTA, форма и прямой контакт. Красота должна вести к действию." },
    { num: "04", name: "MOTION SYSTEMS", text: "Создаём анимации, parallax, переходы, hover/tap-состояния и кинематографичный ритм, чтобы сайт хотелось досмотреть до конца." },
    { num: "05", name: "DEVELOPMENT", text: "Собираем чистый фронтенд, WebGL, адаптив, интерактивные блоки, форму заявки и все состояния интерфейса." },
    { num: "06", name: "LAUNCH", text: "Оптимизируем скорость, проверяем mobile, подключаем аналитику/форму, тестируем сценарии и запускаем сайт под рекламу или презентацию." },
  ];

  const processOrbs = document.getElementById("processOrbs");
  const processPanel = document.getElementById("processPanel");
  const processBar = document.getElementById("processBar");
  let processIdx = 0;

  function setProcessProgress(idx) {
    const max = processSteps.length - 1;
    const progress = max > 0 ? (idx / max) * 100 : 0;
    processBar.style.setProperty("--progress", progress + "%");
  }

  function setProcessStep(idx, burstAt) {
    if (idx < 0 || idx >= processSteps.length) return;
    const step = processSteps[idx];

    if (burstAt) burst(burstAt.x, burstAt.y);
    if (idx === processIdx) { blip(600 + idx * 40, 0.07, 0.04); return; }

    processIdx = idx;

    // круги-этапы
    processOrbs.querySelectorAll(".process__orb").forEach((orb, i) => {
      const on = i === idx;
      orb.classList.toggle("is-active", on);
      orb.setAttribute("aria-selected", String(on));
    });

    // 6 шаров прогресса: все до текущего — залиты синим, текущий крупнее
    processBar.querySelectorAll("span").forEach((dot, i) => {
      dot.classList.toggle("is-filled", i <= idx);
      dot.classList.toggle("is-active", i === idx);
    });
    setProcessProgress(idx);

    // плавная смена панели
    processPanel.classList.add("is-leaving");
    setTimeout(() => {
      processPanel.innerHTML =
        "<h3><b>" + step.num + "</b> " + step.name + "</h3>" +
        "<p>" + step.text + "</p>";
      processPanel.classList.remove("is-leaving");
    }, reducedMotion ? 0 : 320);

    blip(600 + idx * 40, 0.07, 0.04);
  }

  processOrbs.querySelectorAll(".process__orb").forEach((orb, i) => {
    orb.addEventListener("click", (e) => {
      const rect = orb.getBoundingClientRect();
      setProcessStep(i, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    });
  });

  // стартовое состояние
  processBar.querySelectorAll("span").forEach((dot, i) => {
    dot.classList.toggle("is-filled", i === 0);
    dot.classList.toggle("is-active", i === 0);
  });
  setProcessProgress(0);

  document.querySelectorAll("[data-burst-card]").forEach((card) => {
    card.addEventListener("click", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX || rect.left + rect.width / 2;
      const y = e.clientY || rect.top + rect.height / 2;
      burst(x, y);
      blip(700, 0.08, 0.04);
    });
  });

  /* ---------- бриф-форма ---------- */

  // ползунки 02 и 04 + ручной ввод точной суммы и срока
  const budgetRange = document.getElementById("budgetRange");
  const budgetInput = document.getElementById("budgetInput");
  const budgetValue = document.getElementById("budgetValue");
  const termRange = document.getElementById("termRange");
  const termInput = document.getElementById("termInput");
  const termValue = document.getElementById("termValue");

  function fillTrack(input) {
    const p = ((input.value - input.min) / (input.max - input.min)) * 100;
    input.style.setProperty("--fill", p + "%");
  }

  const budgetMax = Number(budgetInput.max || budgetRange.max);
  let budget = 0;

  function renderBudget() {
    budgetValue.textContent = budget === 0
      ? "пропустить — обсудим после контакта"
      : budget.toLocaleString("ru-RU") + " ₽";
    budgetRange.value = Math.min(budget, Number(budgetRange.max));
    fillTrack(budgetRange);
  }

  budgetRange.addEventListener("input", () => {
    budget = Number(budgetRange.value);
    budgetInput.value = budget === 0 ? "" : budget;
    renderBudget();
  });

  budgetInput.addEventListener("input", () => {
    budget = Math.min(budgetMax, Math.max(0, Math.floor(Number(budgetInput.value) || 0)));
    budgetInput.value = budget === 0 ? "" : budget;
    renderBudget();
  });

  function daysWord(n) {
    const t = n % 100;
    if (t >= 11 && t <= 14) return "дней";
    switch (n % 10) {
      case 1: return "день";
      case 2: case 3: case 4: return "дня";
      default: return "дней";
    }
  }

  const termMax = Number(termInput.max || termRange.max);
  let term = 0; // срок в днях

  function renderTerm() {
    termValue.textContent = term === 0
      ? "не определились — обсудим"
      : term + " " + daysWord(term);
    termRange.value = Math.min(term, Number(termRange.max));
    fillTrack(termRange);
  }

  termRange.addEventListener("input", () => {
    term = Number(termRange.value);
    termInput.value = term === 0 ? "" : term;
    renderTerm();
  });

  termInput.addEventListener("input", () => {
    term = Math.min(termMax, Math.max(0, Math.floor(Number(termInput.value) || 0)));
    termInput.value = term === 0 ? "" : term;
    renderTerm();
  });

  renderBudget();
  renderTerm();

  // отправка: контакт обязателен
  const form = document.getElementById("briefForm");
  const goalInput = document.getElementById("goalInput");
  const contactInput = document.getElementById("contactInput");
  const notesInput = document.getElementById("notesInput");
  const formSuccess = document.getElementById("formSuccess");
  const formError = document.getElementById("formError");
  const submitBtn = form.querySelector('button[type="submit"]');
  const submitText = submitBtn.textContent;

  contactInput.addEventListener("input", () => {
    contactInput.classList.remove("is-error");
    formError.hidden = true;
  });

  function setSubmitting(on) {
    submitBtn.disabled = on;
    submitBtn.textContent = on ? "Отправляем..." : submitText;
  }

  function buildBriefPayload() {
    return {
      goal: goalInput.value.trim(),
      contact: contactInput.value.trim(),
      budget,
      term,
      notes: notesInput.value.trim(),
      page: location.href,
      createdAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    formError.hidden = true;

    if (contactInput.value.trim().length < 5) {
      contactInput.classList.remove("is-error");
      void contactInput.offsetWidth; // перезапуск shake-анимации
      contactInput.classList.add("is-error");
      contactInput.focus();
      blip(220, 0.12, 0.05);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBriefPayload()),
      });

      if (!res.ok) throw new Error("brief_send_failed");

      form.classList.add("is-sent");
      formSuccess.hidden = false;
      formSuccess.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
      blip(880, 0.12, 0.05);
    } catch (_) {
      formError.hidden = false;
      blip(220, 0.12, 0.05);
    } finally {
      setSubmitting(false);
    }
  });

})();
