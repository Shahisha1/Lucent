// Lucent - Self-tuning glass theme for Spicetify
(function Lucent(attempt) {
  attempt = attempt || 0;
  if (!(window.Spicetify && Spicetify.Player && Spicetify.Menu && Spicetify.PopupModal)) {
    if (attempt < 100) setTimeout(() => Lucent(attempt + 1), 300);
    return;
  }

  const KEY = "lucent:settings";
  const root = document.documentElement;
  const DEFAULTS = {
    opacity: 0.04,
    radius: 20,
    bgDim: 0.60,
    artBackdrop: true,
    vinyl: false,
    accentMode: "adaptive",
    customAccent: "#8ab4ff",
  };

  let settings = (() => {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } 
    catch (e) { return { ...DEFAULTS }; }
  })();

  let accent = "138, 180, 255";
  let vinylBtn = null;
  const colorCache = new Map();

  // Custom SVG for the playbar toggle
  const vinylIcon = `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 12.5a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11zm0-9a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm0 5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>`;

  // ---------- Helpers ----------
  function debounce(fn, ms) {
    let t;
    return () => { clearTimeout(t); t = setTimeout(fn, ms); };
  }
  const save = debounce(() => { 
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (e) {} 
  }, 300);

  function parseHex(hex) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function toAccent(hex) {
    let [r, g, b] = parseHex(hex);
    const m = Math.max(r, g, b, 1);
    if (m < 110) {
      const k = 110 / m;
      r = Math.min(255, Math.round(r * k + 10));
      g = Math.min(255, Math.round(g * k + 10));
      b = Math.min(255, Math.round(b * k + 10));
    }
    return `${r}, ${g}, ${b}`;
  }

  const toImageUrl = (uri) =>
    uri && uri.indexOf("spotify:image:") === 0 ? "https://i.scdn.co/image/" + uri.slice(14) : uri;

  // ---------- Apply ----------
  function applyVars() {
    const s = settings, st = root.style;
    st.setProperty("--vt-opacity", s.opacity);
    st.setProperty("--vt-radius", s.radius + "px");
    st.setProperty("--vt-dim", s.bgDim);
    st.setProperty("--vt-accent", s.accentMode === "custom" ? parseHex(s.customAccent).join(", ") : accent);
  }

  function applyAll() {
    root.classList.toggle("vt-vinyl", !!settings.vinyl);
    if (vinylBtn) vinylBtn.active = !!settings.vinyl;
    applyVars();
    updateArt();
  }

  // ---------- Adaptive Art & Colors ----------
  async function updateArt() {
    const item = Spicetify.Player.data && Spicetify.Player.data.item;
    if (!item) return;
    const uri = item.uri;

    if (settings.artBackdrop) {
      const m = item.metadata || {};
      const src = toImageUrl(m.image_small_url || m.image_url);
      if (src) root.style.setProperty("--vt-art", `url("${src}")`);
    } else {
      root.style.setProperty("--vt-art", "none");
    }

    if (settings.accentMode !== "adaptive" || !Spicetify.colorExtractor) return;
    
    let hex = colorCache.get(uri);
    if (!hex) {
      try {
        const c = await Spicetify.colorExtractor(uri);
        hex = c.VIBRANT || c.PROMINENT || c.LIGHT_VIBRANT;
      } catch (e) { return; }
      if (!hex) return;
      if (colorCache.size > 30) colorCache.delete(colorCache.keys().next().value);
      colorCache.set(uri, hex);
    }

    const now = Spicetify.Player.data && Spicetify.Player.data.item;
    if (!now || now.uri !== uri) return;
    
    accent = toAccent(hex);
    root.style.setProperty("--vt-accent", accent);
  }

  function syncPlaying() {
    root.classList.toggle("vt-playing", Spicetify.Player.isPlaying());
  }

  Spicetify.Player.addEventListener("songchange", () => { updateArt(); syncPlaying(); });
  Spicetify.Player.addEventListener("onplaypause", syncPlaying);
  document.addEventListener("visibilitychange", () => {
    root.classList.toggle("vt-hidden", document.hidden);
  });

  // ---------- Settings Panel ----------
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

    panel.append(
      toggle("Spinning vinyl cover", "vinyl"),
      toggle("Album-art backdrop", "artBackdrop"),
      slider("Glass tint", "opacity", 0, 0.15, 0.01),
      slider("Corner radius", "radius", 0, 36, 1, "px"),
      slider("Backdrop darkness", "bgDim", 0.2, 0.9, 0.01),
      select("Accent color", "accentMode", [
        ["adaptive", "Adaptive (Album art)"], 
        ["custom", "Custom"]
      ]),
      colorInput("Custom accent", "customAccent"),
      reset
    );
    Spicetify.PopupModal.display({ title: "Lucent Settings", content: panel });
  }

  // Register Main Menu Button
  new Spicetify.Menu.Item("Lucent settings", false, openPanel).register();

  // Register Playbar Quick Toggle
  try {
    if (Spicetify.Playbar && Spicetify.Playbar.Button) {
      vinylBtn = new Spicetify.Playbar.Button("Toggle Vinyl", vinylIcon, () => {
        settings.vinyl = !settings.vinyl;
        save();
        applyAll();
      }, false, "Toggle spinning vinyl", false);
    }
  } catch (e) { vinylBtn = null; }

  applyAll();
  syncPlaying();
})();