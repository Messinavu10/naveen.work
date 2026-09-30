// Circuit navigation (highlights the turn for the section in view) and the photo lightbox.
(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Park the car on the start line for people who prefer less motion.
  if (reduceMotion) {
    document.querySelectorAll(".circuit svg, .dock-lap").forEach((svg) => {
      if (svg.pauseAnimations) { svg.pauseAnimations(); svg.setCurrentTime(0); }
    });
  }

  // ---- Local time in San Diego (Pacific Time, whatever the visitor's zone) ----
  const clock = document.querySelector(".local-time");
  if (clock && window.Intl) {
    const fmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit" });
    const out = clock.querySelector("time");
    const tick = () => { out.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 20000);
    clock.hidden = false;
    const fallback = document.querySelector(".based-fallback");
    if (fallback) fallback.remove();
  }

  // ---- Scroll spy ----
  const links = document.querySelectorAll("[data-section]");
  const sections = [...new Set([...links].map((a) => a.dataset.section))]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const labelNum = document.querySelector(".turn-num");
  const labelName = document.querySelector(".turn-name");
  const turns = [...document.querySelectorAll(".circuit .turn")];
  let activeId = null;
  const showLabel = (turn) => {
    if (!turn || !labelNum) return;
    labelNum.textContent = "Turn " + (turns.indexOf(turn) + 1);
    labelName.textContent = turn.dataset.name;
  };
  const activeTurn = () => turns.find((t) => t.dataset.section === activeId);
  turns.forEach((t) => {
    t.addEventListener("mouseenter", () => showLabel(t));
    t.addEventListener("focus", () => showLabel(t));
    t.addEventListener("mouseleave", () => showLabel(activeTurn()));
    t.addEventListener("blur", () => showLabel(activeTurn()));
  });

  const setActive = (id) => {
    activeId = id;
    showLabel(activeTurn());
    links.forEach((a) => {
      const on = a.dataset.section === id;
      a.classList.toggle("is-active", on);
      if (on) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  };

  // After a click, hold the chosen section until the smooth scroll settles,
  // so the label doesn't flash through every section it passes.
  let lockedUntilIdle = false;
  let idleTimer = null;
  const releaseSoon = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { lockedUntilIdle = false; update(); }, 180);
  };

  // The active section is the last one whose top has passed 40% of the viewport.
  const update = () => {
    if (lockedUntilIdle) return;
    const line = window.innerHeight * 0.4;
    let current = sections[0];
    for (const s of sections) {
      if (s.getBoundingClientRect().top <= line) current = s;
    }
    // At the very bottom, the last section wins even if it is short.
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
      current = sections[sections.length - 1];
    }
    if (current) setActive(current.id);
  };

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (lockedUntilIdle) { releaseSoon(); return; }
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { update(); ticking = false; });
  }, { passive: true });
  window.addEventListener("resize", update);
  links.forEach((a) => a.addEventListener("click", () => {
    setActive(a.dataset.section);
    lockedUntilIdle = true;
    releaseSoon(); // also releases if the page was already at that section and never scrolls
  }));
  update();

  // ---- Dock for small screens ----
  const dock = document.querySelector(".dock");
  const circuit = document.querySelector(".circuit");
  if (dock) {
    const pill = dock.querySelector(".dock-pill");
    const movePill = () => {
      const active = dock.querySelector("a.is-active");
      if (active && pill) pill.style.setProperty("--pill-x", active.offsetLeft + "px");
    };
    // setActive toggles .is-active on every [data-section] link, including these.
    new MutationObserver(movePill).observe(dock, { subtree: true, attributes: true, attributeFilter: ["class"] });
    movePill();
    // Show the dock only once the track in the card is off screen.
    const syncDock = () => {
      if (!circuit) { dock.classList.add("is-visible"); return; }
      const r = circuit.getBoundingClientRect();
      dock.classList.toggle("is-visible", r.bottom < 0 || r.top > window.innerHeight);
    };
    window.addEventListener("scroll", syncDock, { passive: true });
    window.addEventListener("resize", syncDock);
    syncDock();
  }

  // ---- Gallery scroll buttons ----
  const strip = document.querySelector(".gallery");
  const stripBtns = document.querySelectorAll(".gallery-btn");
  if (strip && stripBtns.length) {
    const step = () => {
      const tile = strip.querySelector(".shot");
      return tile ? (tile.getBoundingClientRect().width + 14) * 2 : 400;
    };
    const syncBtns = () => {
      const max = strip.scrollWidth - strip.clientWidth - 2;
      stripBtns[0].disabled = strip.scrollLeft <= 2;
      stripBtns[1].disabled = strip.scrollLeft >= max;
    };
    stripBtns.forEach((b) => b.addEventListener("click", () => {
      strip.scrollBy({ left: step() * Number(b.dataset.dir), behavior: reduceMotion ? "auto" : "smooth" });
    }));
    strip.addEventListener("scroll", syncBtns, { passive: true });
    window.addEventListener("resize", syncBtns);
    syncBtns();
  }

  // ---- Project dialogs (for work that isn't public yet) ----
  document.querySelectorAll("[data-opens]").forEach((trigger) => {
    const d = document.getElementById(trigger.dataset.opens);
    if (!d || typeof d.showModal !== "function") return;
    trigger.addEventListener("click", () => d.showModal());
    d.querySelector(".dialog-close").addEventListener("click", () => d.close());
    // Click on the dimmed backdrop to close.
    d.addEventListener("click", (e) => {
      const r = d.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) d.close();
    });
  });

  // ---- Lightbox ----
  const dialog = document.querySelector(".lightbox");
  if (!dialog || typeof dialog.showModal !== "function") return;
  const big = dialog.querySelector("img");
  const caption = dialog.querySelector(".lb-caption");
  const count = dialog.querySelector(".lb-count");
  const shots = [...document.querySelectorAll(".shot")];
  let index = 0;

  const show = (i) => {
    index = (i + shots.length) % shots.length;
    const shot = shots[index];
    const thumb = shot.querySelector("img");
    big.src = shot.dataset.full;
    big.alt = thumb ? thumb.alt : "";
    caption.textContent = shot.dataset.caption || "";
    count.textContent = shots.length > 1 ? `${index + 1} / ${shots.length}` : "";
    // Warm the next photo so arrowing through feels instant.
    const next = shots[(index + 1) % shots.length];
    if (next) new Image().src = next.dataset.full;
  };

  shots.forEach((shot, i) => shot.addEventListener("click", () => { show(i); dialog.showModal(); }));
  dialog.querySelector(".lb-close").addEventListener("click", () => dialog.close());
  dialog.querySelector(".lb-prev").addEventListener("click", () => show(index - 1));
  dialog.querySelector(".lb-next").addEventListener("click", () => show(index + 1));
  // Click outside the photo to close.
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog || e.target.tagName === "FIGURE") dialog.close();
  });
  dialog.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); show(index - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); show(index + 1); }
  });

  // Swipe on touch screens.
  let startX = null;
  dialog.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
  dialog.addEventListener("touchend", (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    startX = null;
  });
})();
