# AutoRedTeam Brand Guidelines

> Source of truth for tokens: [`styles/tokens.css`](../styles/tokens.css) (consumed by the
> Tailwind CDN config in `index.html`). If this doc and the tokens disagree, fix one.
> Direction: **Signal Lab** — a fusion of "Signal Console" (dark instrument) and "Lab Report"
> (clinical research), chosen 2026-10-19.

## Essence
- **One line:** An instrument for adversarial LLM testing that reports its findings like a lab —
  for security/ML researchers and anyone evaluating model robustness.
- **Personality:** precise, adversarial, legible — never gimmicky, never neon-"hacker", never hype.
- **Reference:** instrumentation/observability UIs (oscilloscopes, Datadog) crossed with arXiv
  papers and modern analytics SaaS.
- **Energy level:** 3 / 5 · **Density:** dense tool (simulator) → balanced (results).

## Voice & copy
- Tone: direct and technical, with a dry edge. State what happened; let the data carry drama.
- Do: "Critical leak — secret printed in plain text.", "Target defended. No leak detected.",
  "Attack success rate within k rounds."
- Don't: "Unlock", "Supercharge", "Seamless", "Harness the power", exclamation-stacking, title case.
- Casing: sentence case for UI and headings. UPPERCASE only for short mono labels/role chips.

## Logo / wordmark
- No custom mark yet. Wordmark: **AutoRedTeam** in IBM Plex Mono 600, plus a square "A" glyph
  tile filled `accent` with `accent-ink`. Clear space ≥ the glyph's height; min wordmark size 14px.
- Don't: recolor the glyph outside the palette, add glow/bevels, or set the wordmark in the display face.

## Color
Tokens are RGB channels in `tokens.css`; Tailwind exposes them as `bg`, `surface`, `surface-2`,
`line`, `text`, `muted`, `accent`, `primary`, `attacker`, `defense`, `judge`, `danger`,
`warning`, `success` (all support opacity, e.g. `border-line/60`).

| Token | Dark (default) | Light (results) | Use |
|---|---|---|---|
| bg | `#0E0F12` | `#F3F5F8` | page background |
| surface | `#16181D` | `#FFFFFF` | panels, cards |
| surface-2 | `#1D2027` | `#F7F9FC` | inputs, secondary buttons |
| line | `#2A2E37` | `#D7DEE8` | borders, dividers |
| text | `#E8E6E1` | `#0B1B2E` | primary text |
| muted | `#8A8F98` | `#52627A` | labels, secondary text |
| accent | `#C6FF3D` lime | `#1D4ED8` blue | primary action, live/verdict signal |
| primary | `#5AA9FF` | `#1D4ED8` | links, focus ring, secondary accent |
| attacker | `#FF6B6B` | `#B91C1C` | Red Team (role) |
| defense | `#5AA9FF` | `#1D4ED8` | Blue Team (role) |
| judge | `#C6FF3D` | `#0F766E` | Arbiter / verdict (role) |

**Role colors are semantic — never swap them.** Acid lime is a dark-mode-only signal; on light
surfaces the signal role shifts to blue (it keeps contrast). Dark is the default; apply light via
`<html data-theme="light">` on reading/results surfaces.

Contrast (checked, dark): text on bg ≈ 15:1; muted on bg ≈ 5.0:1; lime accent on bg ≈ 16:1;
attacker `#FF6B6B` on bg ≈ 6.4:1; defense `#5AA9FF` on bg ≈ 7.1:1. Light: text on bg ≈ 14:1,
accent `#1D4ED8` on bg ≈ 6.2:1, judge `#0F766E` on bg ≈ 4.9:1. All ≥ AA.

## Typography
Load from Google Fonts with `display=swap`.

| Role | Font | Size / line-height | Weight | Tracking |
|---|---|---|---|---|
| Display (hero, big H1) | Inter Tight | 28–46px `clamp()` / 1.05 | 800 | −0.02em |
| H2–H3 | Inter Tight | 18–22px / 1.2 | 700 | −0.01em |
| Body | IBM Plex Sans | 14–16px / 1.5 | 400–500 | 0 |
| Label / data / wordmark | IBM Plex Mono | 10–12px / 1.4 | 500–700 | 0.1–0.16em, UPPERCASE for labels |

Numerals: **tabular** (`.tabular`) for scores, rounds, metrics, tables.

## Layout & spacing
- Base unit 4px; spacing scale 4/8/12/16/24/32/48.
- Simulator = fixed 3-pane (config / transcript / telemetry); content reading max-width ≈ 72ch.
- Section rhythm: the tool is dense; reading/results surfaces breathe (more whitespace).
- Breakpoints: `md` 768px (panes stack below), `lg` 1024px. Transcript bubbles cap at ~82% width.

## Shape & depth
- Radius: 2px (chips/inputs), 4px default, 8px (panels/modals). Never fully-rounded except dots/meters.
- Elevation: borders do the work. Shadow only on floating layers (modals): soft, dark, low-spread.
- Borders: 1px `line`; role-tinted borders at ~30% alpha on transcript bubbles.

## Signature moves
1. **Typographic role chips** — `ATK` / `TGT` / `JDG` in mono, filled with the role color, on every turn.
2. **Oversized tabular telemetry** — the intrusion score and round counter in large mono tabular numerals.
3. **Scanline texture** — a very low-opacity horizontal scanline over the transcript only (dark mode),
   honoring `prefers-reduced-motion` (no animation). A restrained nod to the instrument concept.

## Imagery & iconography
- Icons: lucide-react, 1.5px stroke, sized 14–20px, colored by token (role color or `muted`), never emoji.
- Imagery: the product's own transcript/telemetry is the imagery. No stock photos, no glow blobs.

## Motion
- Durations 120–200ms, easing `var(--ease)`. Agent turns fade/slide in short and staggered.
- Hover: color-fill or border-brighten, not `scale`. Always honor `prefers-reduced-motion`.

## Components
- **Buttons:** primary = `accent` fill + `accent-ink` text (Start/Run); destructive = `attacker`
  fill (Stop/Pause); secondary = `surface-2` + `line` border. Radius 4px, mono-ish weight.
- **Inputs/selects/textareas:** `bg` fill, `line` border, focus → `primary` border + focus ring.
- **Transcript bubbles:** role-tinted border + ~6% role background; attacker left, target right,
  verdict full-width dashed. Each leads with a mono role chip.
- **Telemetry stats:** mono uppercase label + large tabular value; breach states use `attacker`.
- **States:** empty = mono "system idle" line; error = `danger` inline; disabled = 40% opacity.

## Do / Don't
| Do | Don't |
|---|---|
| Use role colors by meaning (red/blue/lime) | Reintroduce slate + indigo defaults |
| Keep lime for signal/verdict/primary only | Flood surfaces with lime |
| Mono for labels/data, Inter Tight for display | Set body copy in mono |
| Let borders + spacing define hierarchy | Stack glow shadows / glassmorphism |

## Accessibility
AA minimum: body ≥ 4.5:1, large/UI ≥ 3:1 (matrix above). Visible focus ring = 2px `primary`,
2px offset (in `tokens.css`). Targets ≥ 44px on touch. Every control keyboard-reachable; role
color is never the *only* signal (always paired with the mono chip/label).

## SEO & metadata (web)
- Title: `AutoRedTeam · <page>` (30–60 chars). Description 70–160 chars, in voice.
- One H1 per page; no skipped heading levels; no styled divs as headings.
- OG image 1200×630 on `bg` with the wordmark + a transcript slice; favicon from the "A" glyph.
