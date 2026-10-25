<h1 align="center">Lucent</h1>
<p align="center"><i>Spotify, as if every panel were a slab of smoked glass with a lamp behind it.</i></p>

---

## What it is

Lucent is a Spicetify theme with one idea: **light should come from the music**.

- 🪟 **Smoked-glass slabs.** Each panel is a dark, translucent slab with a hairline of light running around its rim (song colour, fading to clear, ending in a second tone) and a soft under-glow, like a lantern standing on a table.
- 🌡️ **Colour temperature per panel.** The library glows with the song's main accent, the main view stays calm moonlight so it never fights your eyes, and the now-playing panel carries the second tone.
- 🎨 **Two-tone from the artwork.** Every track gets a primary accent plus a second colour pulled from its cover, so the glow shifts song by song.
- 🏮 **Lantern backdrop.** A softly blurred cover behind everything, a vignette at the edges, and a warm bloom rising from the playbar.
- 💊 **Capsule playbar** with an optional spinning vinyl cover, an optional slow **aurora drift**, and a font picker (Plus Jakarta Sans, Outfit, Figtree, Manrope, Inter, Nunito, or System).
- 🪶 **Built to be kind to your hardware.** Real blur is only on the three big slabs. No per-row blur, no polling timers, and animations pause when the window is hidden or music is paused. Weak machines start on **Frosted Lite** (no blur at all) automatically.
- 💎 **Ultra** (opt-in): a cursor-following light on cards and the playbar, film grain, and an SVG refraction effect on the capsule.

## Where it comes from (and where it doesn't)

Lucent is **inspired by [Liquify](https://github.com/NMWplays/Liquify)** by NMWplays, which itself is inspired by [Glassify](https://github.com/sanoojes/spicetify-glassify) by Sanoojes. Seeing what those projects did with glass on Spotify is what made me want to build my own.

It is **not a copy and not a fork.** Lucent's code is written from scratch, and it goes its own way:

| | Liquify | Lucent |
|---|---|---|
| Feel | Rounded, bouncy, liquid | Smoked, crisp, lit from the edge |
| Edges | Soft shadows | A rim of light that changes with the song |
| Colour | One accent | Two tones, and a different temperature per panel |
| Finding Spotify's panels | Lists of Spotify's internal class names | Three fallbacks (layout geometry, long-lived class names, hit-testing) so a Spotify update is less likely to break it |

If you want the original, go and star it: https://github.com/NMWplays/Liquify

## Install

1. Install and configure [Spicetify](https://spicetify.app/docs/getting-started/) for the Spotify desktop app. If this is your first Spicetify setup, run `spicetify backup apply` once before installing a theme.
2. Create a `Lucent` folder inside Spicetify's `Themes` folder:
   - **Windows:** `%appdata%\spicetify\Themes\Lucent`
   - **macOS / Linux:** `~/.config/spicetify/Themes/Lucent`
3. Copy `color.ini`, `manifest.json`, `theme.js`, and `user.css` from this repository into that folder.
4. In a terminal, select and apply Lucent:

   ```sh
   spicetify config current_theme Lucent
   spicetify config color_scheme Lucent
   spicetify apply
   ```

Fully quit and reopen Spotify, then open **Spicetify menu > Lucent settings**.

## Settings

Glass style (Ultra / Liquid Glass / Frosted Lite / Flat), font, vinyl cover, capsule playbar, artwork backdrop, aurora drift, dynamic button colours, glass tint, corner radius, backdrop darkness, accent (adaptive or custom), and window-control space on Windows.

## If something looks off

1. Run `spicetify backup apply` again after Spotify updates.
2. Open Lucent settings and click **Copy diagnostics**. It copies a small report (which panels were found, and how) that makes bugs much easier to pin down.
3. Remove the theme any time with `spicetify restore`.

Spotify renames its internal classes often, so a brand-new release can break parts of any theme for a while. Lucent tries to find its panels by layout first for exactly that reason.

## Credits

- **Liquify** by [NMWplays](https://github.com/NMWplays): inspiration for the glass direction.
- **Glassify** by [Sanoojes](https://github.com/sanoojes): inspiration behind Liquify.
- **Spicetify** by the [Spicetify team](https://github.com/spicetify/cli).
