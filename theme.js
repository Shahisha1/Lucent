(function Lucent(attempt) {
  attempt = attempt || 0;
  if (
    !(
      window.Spicetify &&
      Spicetify.Player &&
      Spicetify.Menu &&
      Spicetify.PopupModal
    )
  ) {
    if (attempt < 100) setTimeout(() => Lucent(attempt + 1), 300);
    return;
  }
  const KEY = "lucent:settings";
  const root = document.documentElement;
  const DEFAULTS = {
    mode: "crystal",
    opacity: 0.14,
    radius: 20,
    bgDim: 0.55,
    artBackdrop: true,
    vinyl: false,
    pill: true,
    accentMode: "adaptive",
    customAccent: "#8ab4ff",
  };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  function loadSettings() {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY) || "{}");
      const values =
        stored && typeof stored === "object" && !Array.isArray(stored)
          ? stored
          : {};
      return {
        ...DEFAULTS,
        ...values,
        mode: ["crystal", "smooth", "minimal"].includes(values.mode)
          ? values.mode
          : DEFAULTS.mode,
        opacity: Number.isFinite(Number(values.opacity))
          ? clamp(Number(values.opacity), 0, 0.4)
          : DEFAULTS.opacity,
        radius: Number.isFinite(Number(values.radius))
          ? clamp(Number(values.radius), 0, 36)
          : DEFAULTS.radius,
        bgDim: Number.isFinite(Number(values.bgDim))
          ? clamp(Number(values.bgDim), 0.2, 0.9)
          : DEFAULTS.bgDim,
        artBackdrop:
          typeof values.artBackdrop === "boolean"
            ? values.artBackdrop
            : DEFAULTS.artBackdrop,
        vinyl:
          typeof values.vinyl === "boolean" ? values.vinyl : DEFAULTS.vinyl,
        pill: typeof values.pill === "boolean" ? values.pill : DEFAULTS.pill,
        accentMode: ["adaptive", "custom"].includes(values.accentMode)
          ? values.accentMode
          : DEFAULTS.accentMode,
        customAccent:
          typeof values.customAccent === "string" &&
          /^#[0-9a-f]{6}$/i.test(values.customAccent)
            ? values.customAccent
            : DEFAULTS.customAccent,
      };
    } catch (e) {
      console.warn(
        "[Lucent] Could not load saved settings; using defaults.",
        e,
      );
      return { ...DEFAULTS };
    }
  }
  let settings = loadSettings();
  const DEFAULT_ACCENT = "138, 180, 255";
  let accent = DEFAULT_ACCENT;
  let vinylBtn = null;
  const colorCache = new Map();
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
  function parseHex(hex) {
    const h = hex.replace("#", "");
    const normalized =
      h.length === 3
        ? h
            .split("")
            .map((c) => c + c)
            .join("")
        : h;
    if (!/^[0-9a-f]{6}$/i.test(normalized)) return [138, 180, 255];
    const n = parseInt(normalized, 16);
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
    uri && uri.indexOf("spotify:image:") === 0
      ? "https://i.scdn.co/image/" + uri.slice(14)
      : uri;
  function applyVars() {
    const s = settings,
      st = root.style;
    st.setProperty("--vt-opacity", s.opacity);
    st.setProperty("--vt-radius", s.radius + "px");
    st.setProperty("--vt-dim", s.bgDim);
    st.setProperty(
      "--vt-accent",
      s.accentMode === "custom" ? parseHex(s.customAccent).join(", ") : accent,
    );
  }
  function applyAll() {
    root.classList.toggle("vt-crystal", settings.mode === "crystal");
    root.classList.toggle("vt-smooth", settings.mode === "smooth");
    root.classList.toggle("vt-minimal", settings.mode === "minimal");
    root.classList.toggle("vt-vinyl", !!settings.vinyl);
    root.classList.toggle("vt-pill", !!settings.pill);
    if (vinylBtn) vinylBtn.active = !!settings.vinyl;
    applyVars();
    updateArt();
    syncVinylArtwork();
  }
  async function updateArt() {
    const item = Spicetify.Player.data && Spicetify.Player.data.item;
    const uri = item && item.uri;
    const m = (item && item.metadata) || {};
    const src = toImageUrl(
      m.image_url ||
        m.image_xlarge_url ||
        m.image_large_url ||
        m.image_small_url,
    );
    root.style.setProperty(
      "--vt-art",
      settings.artBackdrop && settings.mode !== "minimal" && src
        ? `url("${src}")`
        : "none",
    );
    if (settings.accentMode !== "adaptive") return;
    accent = DEFAULT_ACCENT;
    applyVars();
    if (!uri || typeof Spicetify.colorExtractor !== "function") return;
    let hex = colorCache.get(uri);
    if (!hex) {
      try {
        const c = await Spicetify.colorExtractor(uri);
        hex = c && (c.VIBRANT || c.PROMINENT || c.LIGHT_VIBRANT);
      } catch (e) {
        console.warn(
          "[Lucent] Could not extract an accent color from the current artwork.",
          e,
        );
        return;
      }
      if (
        typeof hex !== "string" ||
        !/^#?[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(hex)
      )
        return;
      colorCache.set(uri, hex);
    }
    const now = Spicetify.Player.data && Spicetify.Player.data.item;
    if (!now || now.uri !== uri || settings.accentMode !== "adaptive") return;
    accent = toAccent(hex);
    applyVars();
  }
  function syncPlaying() {
    const player = Spicetify.Player;
    const playing =
      typeof player.isPlaying === "function"
        ? player.isPlaying()
        : player.data && typeof player.data.is_playing === "boolean"
          ? player.data.is_playing
          : player.data && player.data.isPaused === false;
    root.classList.toggle("vt-playing", !!playing);
    syncVinylArtwork(!!playing);
  }
  function syncVinylArtwork(playing = root.classList.contains("vt-playing")) {
    const left = document.querySelector(
      ".main-nowPlayingBar-left, [data-testid='now-playing-bar'] .main-nowPlayingBar-left",
    );
    const image = left && left.querySelector("img");
    const cover = image
      ? image.closest(
          ".main-nowPlayingBar-coverArt, .cover-art, [data-testid='cover-art']",
        ) || image
      : null;
    document.querySelectorAll(".vt-vinyl-artwork").forEach((element) => {
      if (element !== cover) element.classList.remove("vt-vinyl-artwork");
    });
    if (cover) {
      cover.classList.add("vt-vinyl-artwork");
      cover.classList.toggle(
        "vt-vinyl-playing",
        !!playing && settings.vinyl && !document.hidden,
      );
    }
  }
  Spicetify.Player.addEventListener("songchange", () => {
    updateArt();
    syncPlaying();
  });
  Spicetify.Player.addEventListener("onplaypause", syncPlaying);
  window.setInterval(syncPlaying, 1000);
  document.addEventListener("visibilitychange", () => {
    root.classList.toggle("vt-hidden", document.hidden);
    syncPlaying();
  });
  root.classList.toggle("vt-hidden", document.hidden);
  let vinylSyncScheduled = false;
  const vinylObserver = new MutationObserver(() => {
    if (document.hidden || vinylSyncScheduled) return;
    vinylSyncScheduled = true;
    requestAnimationFrame(() => {
      vinylSyncScheduled = false;
      syncVinylArtwork();
    });
  });
  vinylObserver.observe(document.body, { childList: true, subtree: true });
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
    Object.assign(input, {
      type: "range",
      min,
      max,
      step,
      value: settings[key],
    });
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
      select("Glass style", "mode", [
        ["crystal", "Liquid Glass"],
        ["smooth", "Smooth Glass"],
        ["minimal", "Minimal"],
      ]),
      toggle("Spinning vinyl cover", "vinyl"),
      toggle("Pill-shaped playbar", "pill"),
      toggle("Album-art backdrop", "artBackdrop"),
      slider("Glass tint", "opacity", 0, 0.4, 0.01),
      slider("Corner radius", "radius", 0, 36, 1, "px"),
      slider("Backdrop darkness", "bgDim", 0.2, 0.9, 0.01),
      select("Accent color", "accentMode", [
        ["adaptive", "Adaptive"],
        ["custom", "Custom"],
      ]),
      colorInput("Custom accent", "customAccent"),
      reset,
    );
    Spicetify.PopupModal.display({ title: "Lucent", content: panel });
  }
  new Spicetify.Menu.Item("Lucent settings", false, openPanel).register();
  try {
    if (Spicetify.Playbar && Spicetify.Playbar.Button) {
      vinylBtn = new Spicetify.Playbar.Button("Vinyl", "album", () => {
        settings.vinyl = !settings.vinyl;
        save();
        applyAll();
      });
    }
  } catch (e) {
    console.warn(
      "[Lucent] The optional playbar vinyl button could not be registered.",
      e,
    );
  }
  applyAll();
  syncPlaying();
})();
