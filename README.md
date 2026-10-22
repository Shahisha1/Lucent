<p align="center">
  <img src="assets/logo.png" alt="Lucent Logo" width="120" />
</p>

<h1 align="center">Lucent for Spicetify</h1>

<p align="center">
  <b>Lucent</b> is a performance-conscious Spicetify theme that brings true glassmorphism, a detached pill-shaped playbar, and an optional spinning vinyl to Spotify. It dynamically adapts to your album art's colors while remaining buttery-smooth on older hardware.
</p>

<p align="center">
  <a href="#-previews">Previews</a> •
  <a href="#-features">Features</a> •
  <a href="#-installation--updating">Installation</a> •
  <a href="#-configuration">Configuration</a> •
  <a href="#-performance-profiles">Performance</a>
</p>

---

## 🖼️ Previews

<p align="center">
  <img src="assets/preview-liquid-glass.png" alt="Liquid Glass Mode" width="48%" />
  <img src="assets/preview-pill-playbar.png" alt="Pill Playbar" width="48%" />
</p>
<p align="center">
  <em>True Liquid Glass Mode & Detached Pill Playbar</em>
</p>

<p align="center">
  <img src="assets/preview-vinyl.png" alt="Spinning Vinyl" width="48%" />
  <img src="assets/preview-settings.png" alt="Settings Panel" width="48%" />
</p>
<p align="center">
  <em>Spinning Vinyl & Customization Panel</em>
</p>

*(Note: Replace the `assets/` image paths with your actual screenshot files before publishing!)*

---

## ✨ Features

- 🪟 **True Glassmorphism**: Real `backdrop-filter` blurs that genuinely frosted-glass the album art behind them, complete with subtle rim-lighting and inner glows.
- 💊 **Detached Pill Playbar**: A floating, completely detached pill-shaped playback bar with uniform margins. It doesn't hug the edges of your window, giving the UI a modern, breathable feel.
- 💿 **Spinning Vinyl**: Optional spinning album art in the playbar. It intelligently pauses when you pause the music, hide the Spotify window, or enable reduced motion in your OS.
- 🎨 **Adaptive Accents**: Extracts vibrant colors from the currently playing album art to dynamically tint the UI, progress bar, and play buttons.
- ⚡ **Performance Optimized**: Runs smoothly on older hardware. Heavy blur effects are opt-in, and the theme includes a self-tuning governor that automatically downgrades visual effects if scrolling gets choppy.
- 🧩 **Extension Friendly**: Carefully scoped CSS ensures compatibility with full-screen extensions like **Luma-Lyrics** without blocking overlays or injecting conflicting backgrounds.

---

## 📦 Installation & Updating

### Initial Installation
1. Navigate to your Spicetify Themes directory:
   ```bash
   spicetify path -c
   # Open the printed directory, then go to the Themes folder
   ```
2. Create a new folder named `Lucent` inside the `Themes` directory.
3. Copy the following files into the `Lucent` folder:
   - `user.css`
   - `theme.js`
   - `color.ini`
   - `manifest.json`
4. Apply the theme via the terminal:
   ```bash
   spicetify config current_theme Lucent
   spicetify config color_scheme Lucent
   spicetify apply
   ```
5. Restart Spotify.

### Updating to a New Version
If you have already installed Lucent and just replaced the files in the `Lucent` theme folder with the new ones:
1. Open your terminal.
2. Run the following command to re-apply the theme:
   ```bash
   spicetify apply
   ```
3. **Fully restart Spotify** (close it completely from the system tray/taskbar and reopen it) to clear the cache and see the changes.

---

## ⚙️ Configuration

You can customize every aspect of Lucent by opening the **Lucent settings** panel. 
- **Main Menu**: Click your profile picture (or the 3-dots menu) in the top-left/right and select **Lucent settings**.
- **Playbar Toggle**: Use the custom album/record icon added directly to your bottom playbar to quickly toggle the spinning vinyl on/off.

### Settings Panel Options:
- **Quality Mode**: Choose between Auto, Liquid Glass, Smooth Glass, or Minimal.
- **Spinning Vinyl**: Toggle the playbar album art to spin like a record.
- **Pill Playbar**: Toggle the detached, pill-shaped playback bar.
- **Album-art Backdrop**: Enable/disable the blurred album art background.
- **Glass Tint & Radius**: Adjust the opacity of the glass panels and the roundness of the corners.
- **Backdrop Darkness**: Control how dark the underlying background layer is.
- **Accent Color**: Switch between Adaptive (album art) or Custom (color picker).

---

## 🚀 Performance Profiles

Lucent is designed to adapt to your hardware:

| Profile | Description | GPU Load |
| :--- | :--- | :--- |
| **Auto** | Starts in Smooth Glass. Monitors scroll performance and automatically downgrades to Minimal if it detects lag. | *Dynamic* |
| **Liquid Glass** | Full `backdrop-filter` blur and saturation. Looks the most realistic but requires a decent GPU. | *High* |
| **Smooth Glass** | Uses optimized gradients and rim-lights to simulate glass without the heavy GPU cost of backdrop blurs. | *Low* |
| **Minimal** | Flat, solid panels with no glass effects. Lowest possible resource usage. | *Lowest* |

---

## 🧩 Compatibility & Extensions

Lucent is built with strict CSS scoping to ensure it plays nicely with other Spicetify extensions.
- **Luma-Lyrics / Full-Screen Lyrics**: The background layers use `z-index: -1` and `pointer-events: none`, ensuring they never block or clash with full-screen lyric overlays.
- **Other Extensions**: Because Lucent avoids force-replacing Spotify's native SVG iconography with third-party web fonts, it prevents conflicts with extensions that rely on native UI elements.

---

## 📝 Notes

- Spotify's built-in iconography is rendered by Spotify's own SVG components. This theme intentionally does not force-replace every built-in icon with a remote font dependency, which can hide controls or break labels. Existing controls remain fully intact and functional.
- The spinning vinyl animation respects the `prefers-reduced-motion` accessibility setting in your operating system.
- If you experience performance issues on an older device, switch the Quality Mode to **Minimal** or **Smooth Glass** in the settings panel.

---

## 🙏 Credits

- **Theme Concept & Code**: [Your Name/Handle]
- **Platform**: [Spicetify](https://spicetify.com/)