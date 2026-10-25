(function Lucent(attempt) {
  attempt = attempt || 0;
  if (!(window.Spicetify && Spicetify.Player && Spicetify.Player.addEventListener)) {
    if (attempt < 100) setTimeout(() => Lucent(attempt + 1), 300);
    return;
  }
  const KEY = "lucent:settings";
  const root = document.documentElement;
  // Weak machine? Start on the lightest glass style, aurora off.
  const LOW =
    (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
  const FALLBACK = '"Segoe UI Variable Display", "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';
  // gf = Google Fonts query (loaded only for the chosen font); null = no download needed
  const FONTS = {
    figtree: { label: "Figtree (rounded, bold)", gf: "Figtree:wght@400;500;600;700;800", name: "Figtree" },
    outfit: { label: "Outfit (geometric)", gf: "Outfit:wght@400;500;600;700;800", name: "Outfit" },
    jakarta: { label: "Plus Jakarta Sans (modern)", gf: "Plus+Jakarta+Sans:wght@400;500;600;700;800", name: "Plus Jakarta Sans" },
    manrope: { label: "Manrope (clean)", gf: "Manrope:wght@400;500;600;700;800", name: "Manrope" },
    inter: { label: "Inter (neutral)", gf: "Inter:wght@400;500;600;700;800", name: "Inter" },
    nunito: { label: "Nunito (soft, rounded)", gf: "Nunito:wght@400;500;600;700;800", name: "Nunito" },
    system: { label: "System (Segoe UI, works offline)", gf: null, name: null },
    default: { label: "Spotify default", gf: null, name: null, keep: true },
  };
  const DEFAULTS = {
    ver: 3,
    font: "jakarta",
    mode: LOW ? "smooth" : "crystal",
    opacity: 0.14,
    radius: 16,
    bgDim: 0.35,
    artBackdrop: true,
    vinyl: false,
    pill: true,
    aurora: false,
    dynButtons: true,
    wcW: 140,
    accentMode: "adaptive",
    customAccent: "#8ab4ff",
  };
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const num = (v, min, max, d) => (Number.isFinite(Number(v)) ? clamp(Number(v), min, max) : d);
  const bool = (v, d) => (typeof v === "boolean" ? v : d);

  function loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "{}");
      let v = s && typeof s === "object" && !Array.isArray(s) ? s : {};
      // settings saved before the glass rebuild keep their toggles but pick up the new look
      if (v.ver !== 3) { v = { ...v }; delete v.bgDim; delete v.opacity; delete v.mode; delete v.radius; }
      return {
        ver: 3,
        font: Object.prototype.hasOwnProperty.call(FONTS, v.font) ? v.font : DEFAULTS.font,
        mode: ["ultra", "crystal", "smooth", "minimal"].includes(v.mode) ? v.mode : DEFAULTS.mode,
        opacity: num(v.opacity, 0, 0.4, DEFAULTS.opacity),
        radius: num(v.radius, 0, 36, DEFAULTS.radius),
        bgDim: num(v.bgDim, 0.2, 0.9, DEFAULTS.bgDim),
        artBackdrop: bool(v.artBackdrop, DEFAULTS.artBackdrop),
        vinyl: bool(v.vinyl, DEFAULTS.vinyl),
        pill: bool(v.pill, DEFAULTS.pill),
        aurora: bool(v.aurora, DEFAULTS.aurora),
        dynButtons: bool(v.dynButtons, DEFAULTS.dynButtons),
        wcW: num(v.wcW, 0, 260, DEFAULTS.wcW),
        accentMode: ["adaptive", "custom"].includes(v.accentMode) ? v.accentMode : DEFAULTS.accentMode,
        customAccent:
          typeof v.customAccent === "string" && /^#[0-9a-f]{6}$/i.test(v.customAccent)
            ? v.customAccent
            : DEFAULTS.customAccent,
      };
    } catch (e) {
      console.warn("[Lucent] Could not load saved settings; using defaults.", e);
      return { ...DEFAULTS };
    }
  }

  let settings = loadSettings();
  const DEFAULT_ACCENT = "138, 180, 255";
  const DEFAULT_ACCENT2 = "112, 82, 214";
  let accent = DEFAULT_ACCENT;
  let accent2 = DEFAULT_ACCENT2;
  let vinylBtn = null;
  const colorCache = new Map(); // uri -> [primaryHex, secondaryHex]

  function debounce(fn, ms) {
    let t;
    return () => {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  }
  const save = debounce(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn("[Lucent] Could not save settings.", e);
    }
  }, 300);

  /* ---------- colour helpers ---------- */
  function parseHex(hex) {
    const h = String(hex).replace("#", "");
    const n3 = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    if (!/^[0-9a-f]{6}$/i.test(n3)) return [138, 180, 255];
    const n = parseInt(n3, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHsl([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (mx + mn) / 2;
    if (mx !== mn) {
      const d = mx - mn;
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h /= 6;
    }
    return [h, s, l];
  }
  function hslToRgb([h, s, l]) {
    if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = (t) => {
      t = (t + 1) % 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map((v) => Math.round(v * 255));
  }
  // make sure an accent is bright enough to read on the dark glass
  function lift([r, g, b]) {
    const m = Math.max(r, g, b, 1);
    if (m >= 110) return [r, g, b];
    const k = 110 / m;
    return [r, g, b].map((c) => Math.min(255, Math.round(c * k + 10)));
  }
  // a second tone that is always harmonious: hue-shifted version of the accent
  function shifted(rgb) {
    const [h, s, l] = rgbToHsl(rgb);
    return hslToRgb([(h + 0.12) % 1, clamp(s, 0.35, 0.9), clamp(l, 0.35, 0.6)]);
  }
  const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
  const str = (rgb) => rgb.join(", ");
  const toHex = (rgb) => "#" + rgb.map((c) => c.toString(16).padStart(2, "0")).join("");

  /* ---------- backdrop: one static blurred layer, cross-faded ---------- */
  let bg = null, layers = [], layerIdx = 0, artToken = 0;
  function ensureBg() {
    if (bg && bg.isConnected) return;
    bg = document.createElement("div");
    bg.id = "lucent-bg";
    layers = [document.createElement("div"), document.createElement("div")];
    layers.forEach((l) => (l.className = "lc-layer"));
    const aur = document.createElement("div");
    aur.className = "lc-aurora";
    aur.append(document.createElement("i"), document.createElement("i"));
    bg.append(layers[0], layers[1], aur);
    document.body.prepend(bg);
  }
  function showArt(src) {
    ensureBg();
    const token = ++artToken;
    if (!src) {
      layers.forEach((l) => l.classList.remove("on"));
      return;
    }
    const img = new Image();
    img.onload = () => {
      if (token !== artToken) return;
      layerIdx = 1 - layerIdx;
      const next = layers[layerIdx], prev = layers[1 - layerIdx];
      next.style.backgroundImage = `url("${src}")`;
      next.classList.add("on");
      prev.classList.remove("on");
    };
    img.src = src;
  }


  /* ---------- ultra: liquid refraction filter + cursor light ---------- */
  function ensureFilter(on) {
    let el = document.getElementById("lucent-filters");
    if (!on) return el && el.remove();
    if (el) return;
    el = document.createElement("div");
    el.id = "lucent-filters";
    el.setAttribute("aria-hidden", "true");
    el.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
    el.innerHTML =
      '<svg width="0" height="0"><filter id="lucent-liquid" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="2" seed="7" result="n"/>' +
      '<feGaussianBlur in="n" stdDeviation="2" result="nb"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="nb" scale="26" xChannelSelector="R" yChannelSelector="G"/>' +
      "</filter></svg>";
    document.body.append(el);
  }
  let lightOn = false, lightEl = null, lightRaf = 0, lastEvt = null;
  const LIGHT_SEL = ".main-card-card, .main-nowPlayingBar-nowPlayingBar";
  function lightMove(e) {
    lastEvt = e;
    if (lightRaf) return;
    lightRaf = requestAnimationFrame(() => {
      lightRaf = 0;
      const t = lastEvt.target && lastEvt.target.closest ? lastEvt.target.closest(LIGHT_SEL) : null;
      if (t !== lightEl) {
        if (lightEl) lightEl.style.setProperty("--lo", "0");
        lightEl = t;
      }
      if (!t) return;
      const r = t.getBoundingClientRect();
      t.style.setProperty("--lx", lastEvt.clientX - r.left + "px");
      t.style.setProperty("--ly", lastEvt.clientY - r.top + "px");
      t.style.setProperty("--lo", "1");
    });
  }
  function lightLeave() {
    if (lightEl) lightEl.style.setProperty("--lo", "0");
    lightEl = null;
  }
  function setHoverLight(on) {
    if (on === lightOn) return;
    lightOn = on;
    const fn = on ? "addEventListener" : "removeEventListener";
    document[fn]("pointermove", lightMove, { passive: true });
    document.documentElement[fn]("pointerleave", lightLeave);
    if (!on) lightLeave();
  }


  /* ---------- font ---------- */
  function applyFont() {
    const f = FONTS[settings.font] || FONTS.figtree;
    const st = root.style;
    const KEYS = ["--lc-font", "--encore-body-font-stack", "--encore-title-font-stack", "--font-family"];
    let link = document.getElementById("lucent-font");
    if (f.keep) {
      KEYS.forEach((k) => st.removeProperty(k));
      root.classList.remove("vt-font");
      if (link) link.remove();
      return;
    }
    if (f.gf) {
      const href = "https://fonts.googleapis.com/css2?family=" + f.gf + "&display=swap";
      if (!link) {
        link = document.createElement("link");
        link.id = "lucent-font";
        link.rel = "stylesheet";
        document.head.append(link);
      }
      if (link.getAttribute("href") !== href) link.setAttribute("href", href);
    } else if (link) {
      link.remove();
    }
    const stack = (f.name ? '"' + f.name + '", ' : "") + FALLBACK;
    KEYS.forEach((k) => st.setProperty(k, stack));
    root.classList.add("vt-font");
  }


  /* ---------- make the panels real glass, whatever Spotify's markup is ----------
     Spotify 1.3.x no longer has stable panel class names, so panels are FOUND BY POSITION:
     we ask the browser which element sits at a point inside the left sidebar, the main view
     and the right sidebar, then climb to the element that wraps just that panel.
     The glass background goes on INLINE (!important) so nothing can override it, and any big
     element painting a solid colour over a panel is made transparent. */
  const LEGACY_SEL =
    ".Root__nav-bar, .Root__main-view, .Root__right-sidebar, [data-testid='left-sidebar'], [data-testid='main-view'], [data-testid='right-sidebar']";
  const SKIP_TAGS = { IMG: 1, VIDEO: 1, CANVAS: 1, svg: 1, SVG: 1, BUTTON: 1, INPUT: 1, TEXTAREA: 1 };
  const ROLE_ATTR = "data-lc-role";
  let found = { nav: null, main: null, right: null };

  function alphaOf(c) {
    const m = /rgba?\(([^)]+)\)/.exec(c || "");
    if (!m) return 0;
    const p = m[1].split(",").map((x) => parseFloat(x));
    return p.length > 3 ? p[3] : 1;
  }
  function paints(el) {
    const cs = getComputedStyle(el);
    const bi = cs.backgroundImage || "";
    return alphaOf(cs.backgroundColor) > 0.05 || (/gradient/.test(bi) && !/url\(/.test(bi));
  }
  function clearEl(el) {
    const cs = getComputedStyle(el);
    const bi = cs.backgroundImage || "";
    el.setAttribute("data-lc-clear", "");
    el.style.setProperty("background-color", "transparent", "important");
    if (/gradient/.test(bi) && !/url\(/.test(bi)) el.style.setProperty("background-image", "none", "important");
  }
  function glassEl(el) {
    // the lit edge is a ::before positioned against the panel, so the panel must be positioned
    if (getComputedStyle(el).position === "static") el.style.setProperty("position", "relative");
    el.setAttribute("data-lc-panel", "");
    el.style.setProperty("background", "var(--lc-panel-bg)", "important");
  }
  function unglassEl(el) {
    el.removeAttribute("data-lc-panel");
    el.removeAttribute(ROLE_ATTR);
    el.style.removeProperty("background");
  }

  const describe = (el) =>
    el ? el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "") : null;
  let lastDetect = { strategy: "none", notes: [] };

  function probe(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el || el.closest("#lucent-bg, #lucent-filters")) return null;
    return el;
  }
  // climb from an element inside a panel to the element that wraps just that panel
  function pickPanel(start, others) {
    const chain = [start];
    let cur = start;
    while (cur.parentElement) {
      const p = cur.parentElement;
      if (p === document.body || p === root) break;
      if (others.some((o) => o && p.contains(o))) break;
      chain.push(p);
      cur = p;
    }
    const top = chain[chain.length - 1].getBoundingClientRect();
    for (const el of chain) {
      const r = el.getBoundingClientRect();
      if (r.width >= top.width * 0.9 && r.height >= top.height * 0.9) return el; // innermost that spans the panel
    }
    return chain[chain.length - 1];
  }
  const sane = (el) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width >= 40 && r.height >= window.innerHeight * 0.4;
  };
  const apart = (a, b) => a && b && a !== b && !a.contains(b) && !b.contains(a);

  // Strategy 1: layout geometry. Somewhere in the DOM there is a row of tall elements sitting
  // side by side (sidebar | main view | sidebar). No class names, no hit-testing.
  function detectStructural() {
    const W = window.innerWidth, H = window.innerHeight;
    const queue = [[document.body, 0]];
    let seen = 0;
    while (queue.length && seen++ < 1200) {
      const [el, d] = queue.shift();
      const kids = [];
      for (const ch of el.children) {
        if (SKIP_TAGS[ch.tagName] || ch.id === "lucent-bg" || ch.id === "lucent-filters") continue;
        const r = ch.getBoundingClientRect();
        if (r.width >= 40 && r.width <= W * 0.92 && r.height >= H * 0.5) kids.push([ch, r]);
        if (d < 9) queue.push([ch, d + 1]);
      }
      if (kids.length < 2) continue;
      kids.sort((x, y) => x[1].left - y[1].left);
      let sideBySide = true;
      for (let i = 1; i < kids.length; i++) if (kids[i][1].left < kids[i - 1][1].right - 8) sideBySide = false;
      if (!sideBySide) continue;
      let mi = 0;
      kids.forEach((k, i) => { if (k[1].width > kids[mi][1].width) mi = i; });
      const main = kids[mi][0];
      const nav = mi > 0 ? kids[mi - 1][0] : null;
      const right = mi < kids.length - 1 ? kids[mi + 1][0] : null;
      lastDetect.notes.push("row in " + describe(el) + " with " + kids.length + " tall children");
      if (nav && main) return { nav, main, right };
    }
    return null;
  }
  // Strategy 2: Spotify's long-lived semantic class names inside each panel, then climb out.
  function detectAnchors() {
    const one = (sel) => document.querySelector(sel);
    const l = one(".main-yourLibraryX-libraryRoot, .main-yourLibraryX-libraryContainer, [class*='yourLibraryX-library']");
    const m = one(".main-view-container, main");
    const r = one(".main-nowPlayingView-section, .main-nowPlayingView-nowPlayingWidget, [class*='main-nowPlayingView']");
    lastDetect.notes.push("anchors: lib=" + describe(l) + " main=" + describe(m) + " right=" + describe(r));
    if (!l || !m) return null;
    const nav = pickPanel(l, [m]);
    const main = pickPanel(m, [l]);
    if (!apart(nav, main)) return null;
    const right = r && !main.contains(r) && !nav.contains(r) ? pickPanel(r, [m]) : null;
    return { nav, main, right: apart(right, main) ? right : null };
  }
  // Strategy 3: ask the browser what is on screen at a point inside each region.
  function detectProbes() {
    const W = window.innerWidth, H = window.innerHeight, y = H * 0.45;
    const leftEl = probe(30, y), mainEl = probe(W * 0.5, y), rightEl = probe(W - 24, y);
    lastDetect.notes.push("probes: left=" + describe(leftEl) + " main=" + describe(mainEl) + " right=" + describe(rightEl));
    if (!leftEl || !mainEl) return null;
    const nav = pickPanel(leftEl, [mainEl]);
    const main = pickPanel(mainEl, [leftEl]);
    if (!apart(nav, main)) return null;
    const right = rightEl && !main.contains(rightEl) && !nav.contains(rightEl) ? pickPanel(rightEl, [mainEl]) : null;
    return { nav, main, right: apart(right, main) ? right : null };
  }
  function detectPanels() {
    lastDetect = { strategy: "none", notes: [] };
    const tries = [["geometry", detectStructural], ["anchors", detectAnchors], ["probes", detectProbes]];
    for (const [name, fn] of tries) {
      let res = null;
      try { res = fn(); } catch (e) { lastDetect.notes.push(name + " threw: " + e.message); }
      if (res && sane(res.nav) && sane(res.main)) {
        if (res.right && !sane(res.right)) res.right = null;
        lastDetect.strategy = name;
        return res;
      }
    }
    return found;
  }
  const observed = new WeakSet();
  let mo = null;
  function currentPanels() {
    const legacy = Array.from(document.querySelectorAll(LEGACY_SEL));
    if (legacy.length) return legacy;
    const next = detectPanels();
    for (const role of ["nav", "main", "right"]) {
      if (found[role] && found[role] !== next[role]) unglassEl(found[role]);
      if (next[role]) next[role].setAttribute(ROLE_ATTR, role);
    }
    found = next;
    return [next.nav, next.main, next.right].filter(Boolean);
  }
  function scanPanel(panel) {
    const pr = panel.getBoundingClientRect();
    const pArea = pr.width * pr.height;
    if (!pArea) return;
    const big = (r) => r.width * r.height >= pArea * 0.35 || (r.width >= pr.width * 0.9 && r.height >= 120);
    const stack = Array.from(panel.children).map((el) => [el, 0]);
    let budget = 500;
    while (stack.length && budget-- > 0) {
      const [el, depth] = stack.pop();
      if (SKIP_TAGS[el.tagName] || el.id === "lucent-bg") continue;
      const r = el.getBoundingClientRect();
      if (r.width * r.height < pArea * 0.2) continue;
      if (big(r) && paints(el)) clearEl(el);
      if (depth < 12) for (const ch of el.children) stack.push([ch, depth + 1]);
    }
    // also ask the browser what is really drawn at a few points inside the panel
    const pts = [[0.5, 0.1], [0.5, 0.5], [0.5, 0.9], [0.1, 0.5], [0.9, 0.5], [0.15, 0.2], [0.85, 0.8]];
    for (const [fx, fy] of pts) {
      for (const el of document.elementsFromPoint(pr.left + pr.width * fx, pr.top + pr.height * fy)) {
        if (el === panel || !panel.contains(el) || SKIP_TAGS[el.tagName]) continue;
        if (big(el.getBoundingClientRect()) && paints(el)) clearEl(el);
      }
    }
  }
  function clearAncestors(panel) {
    for (let el = panel.parentElement; el && el !== root; el = el.parentElement) {
      if (paints(el)) clearEl(el);
    }
  }
  let scanTimer = 0;
  function scanAll() {
    scanTimer = 0;
    if (document.hidden) return;
    const flat = settings.mode === "minimal";
    const list = currentPanels();
    if (!mo) mo = new MutationObserver(() => scheduleScan(450));
    list.forEach((p) => {
      const nested = p.parentElement && p.parentElement.closest(LEGACY_SEL);
      if (nested) {
        clearEl(p); // inner duplicate of a legacy panel: keep it see-through
        return;
      }
      if (!observed.has(p)) {
        observed.add(p);
        mo.observe(p, { childList: true, subtree: true });
      }
      clearAncestors(p);
      if (flat) {
        p.removeAttribute("data-lc-panel");
        p.style.removeProperty("background");
      } else {
        glassEl(p);
        scanPanel(p);
      }
    });
    const gn = document.querySelector(".Root__globalNav");
    if (gn && !flat) clearEl(gn);
  }
  function scheduleScan(ms) {
    if (!scanTimer) scanTimer = setTimeout(scanAll, ms || 350);
  }
  function startPanels() {
    window.addEventListener("resize", () => scheduleScan(250), { passive: true });
    // Spotify renders in waves; also re-check on navigation and on a slow heartbeat
    [300, 1200, 3500, 8000].forEach((t) => setTimeout(scanAll, t));
    setInterval(() => scheduleScan(50), 2500);
    try {
      const h = Spicetify.Platform && Spicetify.Platform.History;
      if (h && h.listen) h.listen(() => { scheduleScan(300); setTimeout(scanAll, 1200); });
    } catch (e) { /* optional */ }
  }

  /* ---------- diagnostics (copied to clipboard from settings) ---------- */
  function copyDiagnostics() {
    const q = (sel) => document.querySelectorAll(sel).length;
    const info = {
      lucent: "3.0",
      spotify: (Spicetify.Platform && (Spicetify.Platform.version || Spicetify.Platform.clientVersion)) || "?",
      ua: navigator.userAgent,
      mode: settings.mode,
      font: settings.font,
      art: { backdropEl: q("#lucent-bg"), layersOn: q("#lucent-bg .lc-layer.on"), enabled: settings.artBackdrop },
      panels: {
        legacyClassMatches: q(LEGACY_SEL),
        strategyUsed: lastDetect.strategy,
        notes: lastDetect.notes,
        detectedByPosition: { nav: !!found.nav, main: !!found.main, right: !!found.right },
        sizes: ["nav", "main", "right"].map((k) => {
          const r = found[k] && found[k].getBoundingClientRect();
          return r ? k + ":" + Math.round(r.width) + "x" + Math.round(r.height) : k + ":none";
        }),
        tags: ["nav", "main", "right"].map((k) => (found[k] ? found[k].tagName.toLowerCase() : "-")),
        globalNav: q(".Root__globalNav"),
        pillPlaybar: q(".main-nowPlayingBar-container"),
      },
      glassPanels: q("[data-lc-panel]"),
      clearedWrappers: q("[data-lc-clear]"),
    };
    const text = JSON.stringify(info, null, 2);
    const done = () => Spicetify.showNotification && Spicetify.showNotification("Lucent diagnostics copied");
    try {
      navigator.clipboard.writeText(text).then(done, () => console.log("[Lucent]", text));
    } catch (e) {
      console.log("[Lucent]", text);
    }
  }

  const toImageUrl = (uri) =>
    uri && uri.indexOf("spotify:image:") === 0 ? "https://i.scdn.co/image/" + uri.slice(14) : uri;

  function applyVars() {
    const s = settings, st = root.style;
    st.setProperty("--vt-opacity", s.opacity);
    st.setProperty("--vt-radius", s.radius + "px");
    st.setProperty("--vt-dim", s.bgDim);
    st.setProperty("--vt-wc-w", s.wcW + "px");
    if (s.accentMode === "custom") {
      const rgb = parseHex(s.customAccent);
      st.setProperty("--vt-accent", str(rgb));
      st.setProperty("--vt-accent2", str(shifted(rgb)));
    } else {
      st.setProperty("--vt-accent", accent);
      st.setProperty("--vt-accent2", accent2);
    }
    // Recolour Spotify's own green (shuffle/repeat/active icons, buttons) through its variables
    const DYN = ["--spice-button", "--spice-button-active", "--spice-rgb-button", "--spice-rgb-button-active"];
    if (s.dynButtons) {
      const cur = st.getPropertyValue("--vt-accent").split(",").map((n) => parseInt(n, 10));
      if (cur.length === 3 && cur.every(Number.isFinite)) {
        st.setProperty("--spice-button", toHex(cur));
        st.setProperty("--spice-button-active", toHex(cur));
        st.setProperty("--spice-rgb-button", str(cur));
        st.setProperty("--spice-rgb-button-active", str(cur));
      }
    } else {
      DYN.forEach((k) => st.removeProperty(k));
    }
  }
  function applyAll() {
    const ultra = settings.mode === "ultra";
    root.classList.toggle("vt-ultra", ultra);
    root.classList.toggle("vt-crystal", settings.mode === "crystal" || ultra);
    ensureFilter(ultra);
    setHoverLight(ultra);
    applyFont();
    scheduleScan(200);
    root.classList.toggle("vt-smooth", settings.mode === "smooth");
    root.classList.toggle("vt-minimal", settings.mode === "minimal");
    root.classList.toggle("vt-vinyl", !!settings.vinyl);
    root.classList.toggle("vt-pill", !!settings.pill);
    root.classList.toggle("vt-aurora", !!settings.aurora && settings.mode !== "minimal");
    if (vinylBtn) vinylBtn.active = !!settings.vinyl;
    applyVars();
    updateArt();
    syncVinylArtwork();
  }

  function currentArt() {
    const d = Spicetify.Player.data;
    const item = d && d.item;
    const m = (item && item.metadata) || {};
    let src = toImageUrl(m.image_xlarge_url || m.image_large_url || m.image_url || m.image_small_url);
    if (!src && item && item.images && item.images[0]) src = toImageUrl(item.images[0].url);
    if (!src && item && item.album && item.album.images && item.album.images[0]) src = toImageUrl(item.album.images[0].url);
    if (!src) {
      const img = document.querySelector(".main-nowPlayingBar-left img, [data-testid='cover-art-image'], .main-nowPlayingBar-coverArt img");
      if (img && img.src) src = img.src;
    }
    return src;
  }
  async function updateArt() {
    const item = Spicetify.Player.data && Spicetify.Player.data.item;
    const uri = item && item.uri;
    const src = currentArt();
    showArt(settings.artBackdrop && settings.mode !== "minimal" ? src : null);
    if (settings.accentMode !== "adaptive") return;
    if (!uri || typeof Spicetify.colorExtractor !== "function") return;
    let pair = colorCache.get(uri);
    if (!pair) {
      try {
        const c = await Spicetify.colorExtractor(uri);
        const a = c && (c.VIBRANT || c.PROMINENT || c.LIGHT_VIBRANT);
        const b = c && (c.DARK_VIBRANT || c.DESATURATED || c.LIGHT_VIBRANT || c.PROMINENT);
        if (typeof a !== "string" || !/^#?[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(a)) return;
        pair = [a, typeof b === "string" && /^#?[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(b) ? b : a];
      } catch (e) {
        console.warn("[Lucent] Could not extract an accent color from the current artwork.", e);
        return;
      }
      if (colorCache.size > 60) colorCache.delete(colorCache.keys().next().value);
      colorCache.set(uri, pair);
    }
    const now = Spicetify.Player.data && Spicetify.Player.data.item;
    if (!now || now.uri !== uri || settings.accentMode !== "adaptive") return;
    const a = lift(parseHex(pair[0]));
    let b = parseHex(pair[1]);
    // each song gets a two-tone glass: real second colour if distinct, otherwise a hue shift
    b = dist(a, b) > 90 ? lift(b) : shifted(a);
    accent = str(a);
    accent2 = str(b);
    applyVars();
  }

  /* ---------- playback state (event driven, no polling) ---------- */
  function isPlaying() {
    const p = Spicetify.Player;
    if (typeof p.isPlaying === "function") return !!p.isPlaying();
    return !!(p.data && (p.data.is_playing === true || p.data.isPaused === false));
  }
  function syncPlaying() {
    const playing = isPlaying();
    root.classList.toggle("vt-playing", playing);
    syncVinylArtwork(playing);
  }
  function syncVinylArtwork(playing = root.classList.contains("vt-playing")) {
    const left = document.querySelector(".main-nowPlayingBar-left");
    const image = left && left.querySelector("img");
    const cover = image
      ? image.closest(".main-nowPlayingBar-coverArt, .cover-art, [data-testid='cover-art']") || image
      : null;
    document.querySelectorAll(".vt-vinyl-artwork").forEach((el) => {
      if (el !== cover) el.classList.remove("vt-vinyl-artwork", "vt-vinyl-playing");
    });
    if (cover) {
      cover.classList.add("vt-vinyl-artwork");
      cover.classList.toggle("vt-vinyl-playing", !!playing && settings.vinyl && !document.hidden);
    }
  }
  Spicetify.Player.addEventListener("songchange", () => {
    updateArt();
    syncPlaying();
  });
  Spicetify.Player.addEventListener("onplaypause", syncPlaying);
  document.addEventListener("visibilitychange", () => {
    root.classList.toggle("vt-hidden", document.hidden);
    syncPlaying();
  });
  root.classList.toggle("vt-hidden", document.hidden);

  // Only watch the playbar (not the whole app) so React re-renders keep the vinyl class.
  let vinylScheduled = false;
  function watchPlaybar(tries) {
    const bar = document.querySelector(".Root__now-playing-bar, [data-testid='now-playing-bar']");
    if (!bar) {
      if ((tries || 0) < 40) setTimeout(() => watchPlaybar((tries || 0) + 1), 500);
      return;
    }
    new MutationObserver(() => {
      if (!settings.vinyl || document.hidden || vinylScheduled) return;
      vinylScheduled = true;
      requestAnimationFrame(() => {
        vinylScheduled = false;
        syncVinylArtwork();
      });
    }).observe(bar, { childList: true, subtree: true });
  }

  /* ---------- settings panel ---------- */
  function row(text, control, valueEl) {
    const r = document.createElement("div");
    r.className = "vt-row";
    const l = document.createElement("label");
    const t = document.createElement("span");
    t.textContent = text;
    l.append(t);
    if (valueEl) l.append(valueEl);
    if (control.type === "checkbox") l.append(control);
    r.append(l);
    if (control.type !== "checkbox") r.append(control);
    return r;
  }
  function slider(text, key, min, max, step, unit) {
    const val = document.createElement("span");
    val.textContent = settings[key] + (unit || "");
    const input = document.createElement("input");
    Object.assign(input, { type: "range", min, max, step, value: settings[key] });
    input.addEventListener("input", () => {
      settings[key] = parseFloat(input.value);
      val.textContent = settings[key] + (unit || "");
      applyVars();
      save();
    });
    return row(text, input, val);
  }
  function toggle(text, key) {
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = !!settings[key];
    cb.addEventListener("change", () => {
      settings[key] = cb.checked;
      save();
      applyAll();
    });
    return row(text, cb);
  }
  function select(text, key, options) {
    const sel = document.createElement("select");
    options.forEach(([v, label]) => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = label;
      o.selected = settings[key] === v;
      sel.append(o);
    });
    sel.addEventListener("change", () => {
      settings[key] = sel.value;
      save();
      applyAll();
    });
    return row(text, sel);
  }
  function colorInput(text, key) {
    const input = document.createElement("input");
    input.type = "color";
    input.value = settings[key];
    input.addEventListener("input", () => {
      settings[key] = input.value;
      applyVars();
      save();
    });
    return row(text, input);
  }
  function openPanel() {
    const panel = document.createElement("div");
    panel.className = "vt-panel";
    const reset = document.createElement("button");
    reset.className = "vt-btn";
    reset.textContent = "Reset to defaults";
    reset.onclick = () => {
      settings = { ...DEFAULTS };
      save();
      applyAll();
      Spicetify.PopupModal.hide();
      openPanel();
    };
    const diag = document.createElement("button");
    diag.className = "vt-btn";
    diag.textContent = "Copy diagnostics";
    diag.onclick = copyDiagnostics;
    panel.append(
      select("Font", "font", Object.keys(FONTS).map((k) => [k, FONTS[k].label])),
      select("Glass style", "mode", [
        ["ultra", "Ultra (high-end: refraction, light, grain)"],
        ["crystal", "Liquid Glass (balanced)"],
        ["smooth", "Frosted Lite (no blur, lightest)"],
        ["minimal", "Flat (no artwork backdrop)"],
      ]),
      toggle("Spinning vinyl cover", "vinyl"),
      toggle("Pill-shaped playbar", "pill"),
      toggle("Album-art backdrop", "artBackdrop"),
      toggle("Aurora drift (animated glow)", "aurora"),
      toggle("Dynamic button colors", "dynButtons"),
      slider("Glass tint", "opacity", 0, 0.4, 0.01),
      slider("Corner radius", "radius", 0, 36, 1, "px"),
      slider("Backdrop darkness", "bgDim", 0.2, 0.9, 0.01),
      select("Accent color", "accentMode", [
        ["adaptive", "Adaptive (two-tone from artwork)"],
        ["custom", "Custom"],
      ]),
      colorInput("Custom accent", "customAccent"),
      ...(isWin ? [slider("Window-control space", "wcW", 0, 260, 2, "px")] : []),
      reset,
      diag,
    );
    Spicetify.PopupModal.display({ title: "Lucent", content: panel });
  }
  try {
    if (Spicetify.Menu && Spicetify.Menu.Item && Spicetify.PopupModal) {
      new Spicetify.Menu.Item("Lucent settings", false, openPanel).register();
    }
  } catch (e) {
    console.warn("[Lucent] Could not register the settings menu item.", e);
  }
  try {
    if (Spicetify.Playbar && Spicetify.Playbar.Button) {
      vinylBtn = new Spicetify.Playbar.Button("Vinyl", "album", () => {
        settings.vinyl = !settings.vinyl;
        save();
        applyAll();
      });
    }
  } catch (e) {
    console.warn("[Lucent] The optional playbar vinyl button could not be registered.", e);
  }
  // Windows draws min/max/close over the top-right corner; keep our UI clear of them
  const isWin = /Windows/i.test(navigator.userAgent || "");
  root.classList.toggle("vt-win", isWin);
  function watchControls(tries) {
    if (!isWin) return;
    const main = document.querySelector(".Root__main-view, [data-testid='main-view']");
    if (!main) {
      if ((tries || 0) < 40) setTimeout(() => watchControls((tries || 0) + 1), 500);
      return;
    }
    const check = () => {
      const r = main.getBoundingClientRect();
      root.classList.toggle("vt-wc-main", r.right >= window.innerWidth - 24);
    };
    check();
    if (window.ResizeObserver) new ResizeObserver(check).observe(main);
    window.addEventListener("resize", check, { passive: true });
  }
  ensureBg();
  applyAll();
  syncPlaying();
  watchPlaybar();
  watchControls();
  startPanels();
})();
