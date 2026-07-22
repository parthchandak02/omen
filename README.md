# Omen

Type a name to see its predicted persona — age, gender, and nationality from three live prediction APIs, visualized as a glowing data aura.

**Visual Style:** Dark — Ember (volcanic glow on near-black background, orange/amber/red accents, bioluminescent particles)

**Data Sources:**
- [Agify.io](https://agify.io) — predicted age from first name
- [Genderize.io](https://genderize.io) — predicted gender with probability
- [Nationalize.io](https://nationalize.io) — predicted nationality probabilities

**How it works:**
- Type any first name in the control panel input
- Three APIs are queried simultaneously — age prediction, gender probability, and nationality distribution
- The canvas renders a central glowing name with data-driven visual encoding:
  - **Vertical bar above name** — height = predicted age (taller = older), color temperature maps age range
  - **Horizontal split bar below** — left/right split shows male/female probability
  - **Stacked bar to the left** — segments show top nationality probabilities with flag colors
  - **Orbiting particles** — colored dots circle the name with nationality flag colors
  - **Hero number** — predicted age in 56px orange text, top-right
- Tap anywhere on the canvas to reveal the Quiet Zone data panel with full prediction breakdown

**Live:** https://omen.parthchandak.info

**GitHub:** https://github.com/parthchandak02/omen

**Tech:** Pixel Point Toolcraft + Vite + React. Canvas 2D rendering with requestAnimationFrame. Hosted on Cloudflare Pages.
