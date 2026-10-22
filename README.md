# Lucent for Spicetify

**Lucent** is a liquid-glass Spotify theme with a midnight backdrop, artwork-reactive accents, and customizable playback styling. Open **Lucent settings** from Spicetify's menu to tune the appearance. Settings are saved locally and persist across Spotify restarts.

---

## ✨ Features

- 🪟 **Liquid Glass UI**: Translucent surfaces and artwork-tinted highlights across Spotify navigation, library, playback, cards, search controls, menus, and dialogs, over a midnight-blue album-art backdrop.
- 💊 **Pill Playbar**: Optionally rounds and spaces the playback bar from the window edges; turn it off to keep Spotify's default bar shape.
- 💿 **Spinning Vinyl**: Optionally spins the playback artwork while music is playing. It pauses when playback stops or the Spotify document is hidden, and respects the operating system's reduced-motion setting.
- 🎨 **Adaptive or Custom Accents**: Uses the current artwork's extracted color for accent details, progress, and play controls, or choose a custom color.
- ⚡ **Adjustable Appearance**: Select Crystal blur, lighter Smooth blur, or Minimal styling. Tune glass tint, corner radius, backdrop darkness, album-art backdrop, accent mode, vinyl, and playbar shape from **Lucent settings**.
- 🧩 **Overlay-aware Backdrop**: The decorative background does not capture pointer input or sit above Spotify's interface. Third-party extension layouts can still vary.

## ⚙️ Settings

Open **Lucent settings** from Spicetify's menu to change:

- **Glass style**: Liquid Glass, Smooth Glass, or Minimal.
- **Playback and backdrop**: Toggle the spinning vinyl cover, pill-shaped playbar, and album-art backdrop.
- **Appearance**: Adjust glass tint (0–40%), corner radius (0–36 px), backdrop darkness (20–90%), and use adaptive or custom accent colors.

The defaults are Liquid Glass, 14% glass tint, 20 px corner radius, 55% backdrop darkness, album-art backdrop on, pill-shaped playbar on, vinyl off, and adaptive accents. **Reset to defaults** restores these settings. When available, the playbar also has a **Vinyl** button for toggling the vinyl effect.

---

## 📦 Installation

1. Install the Spicetify CLI if you have not already, then open `%appdata%\spicetify\Themes\` in File Explorer.
2. Make sure this folder is named `Lucent` and contains `manifest.json`, `color.ini`, `user.css`, and `theme.js`.
3. In a terminal, select and apply the theme:
   ```bash
   spicetify config current_theme Lucent
   spicetify config color_scheme Lucent
   spicetify config inject_theme_js 1
   spicetify apply
   ```
4. Restart Spotify if it was already open. To verify the theme is selected, run `spicetify config current_theme`.

If `spicetify apply` reports that Spotify's files are not backed up, run `spicetify backup apply` once, then repeat `spicetify apply`.
