# Toolcraft App Agent Worklog

## Status

Mode: product

Omen is a poster of what a first name says about the people who have it: the share of women and men, the median age and the age range of living holders, the peak year, and births and estimated survivors for every year from 1880, from US Social Security records bundled with the app. Detailed requests and results belong in `docs/agent-journal/changes`; command attempts live in `.toolcraft/journal/runs`.

Active change: omen-rebuild-0026

## Decision Trail

### Change omen-rebuild-0026 — Rebuild Omen on Toolcraft 0.0.26 with a new design

- Change ID: omen-rebuild-0026
- Request: "Yes do it for those and all others to make it consistent and the sites are too old and not well designed so we want to avoid that in the future make it much better ok?" The user then chose: all seven Toolcraft apps; each keeps its own look; rethink freely; no check-ins.
- Task type: Generated app porting plus substantial product redesign (data source, renderer, controls, export).
- User-visible result: The name in large italic display type; a women/men pie; four figures (median age of a living holder, ages of the middle half, peak year, estimated alive in 2026 of all born); and a 138-year bar chart of births with survivors coloured by sex, the middle half shaded and the median marked. Names outside the data get a plain explanation.
- Source/reference checked: The previous Omen (github.com/parthchandak02/omen, Toolcraft template from July 2026), which called Agify, Genderize and Nationalize. Checked on 8 November 2026: each now allows 10 requests a day per IP, which would break a public site after a few names. The CC0 `babynames` R package (hadley/babynames 1.0.1: SSA births 1880-2017 and SSA cohort life tables).
- Reference inputs: None (no motion, video, Figma or screenshot reference).
- Docs/contracts read: AGENTS.md, workflow.md, core/runtime-boundary.md, assembly-workflow.md, core/control-selection.md, core/layout.md, core/performance.md, core/setup-export.md, core/media-upload.md, core/development-files.md, core/app-cover.md, core/slider-ranges.md, decision-contract.md, schema-reference.md, component-rules.md (text controls declare `textValueKind: "single-line"`), renderer-technique.md, performance.md, acceptance-testing.md.
- Contract rules applied: runtime-shell-required, canvas-no-app-ui, canvas-surface-preserved, infinity-canvas-scene-bounds (intrinsic poster bounds), output-export-required (image only), controls-section-inventory-required, acceptance-product-observable, persistence-policy-explicit (default local persistence), segmented-control-fit (labels Living and Births).
- View interaction intent: non-spatial; a flat poster.
- Interaction ownership: panel only; the name and chart view are global property edits, name buttons are panel commands.
- Decision: Replace three rate-limited prediction APIs with bundled public data: 10,570 names with at least 1,000 births, one JSON file per first letter loaded on demand (3.5 MB in all), plus survival fractions per birth year for 2026 interpolated between decade cohort life tables. The build script is `tools/build-name-data.py`.
- Alternatives rejected: Keeping the APIs (10 requests a day per IP); downloading SSA files at runtime (ssa.gov refuses automated requests and has no CORS); shipping one file of all names (3.5 MB before the first frame).
- State/output mapping: `name.text` is normalised (letters only, capitalised) and loads its letter file once; `name.preset` dispatches `controls.setValue` for the name; `chart.view` switches between survivors over births and all births; `appearance.background` sets the runtime background and flips the ink for light colours; `export.includeBackground` removes the runtime fill; `canvas.size.*`, `canvas.renderScale` and `canvas.zoom` set the worker raster backing; the runtime image export calls the same `drawOmen` after loading the same data.
- Verification: Unit tests in `src/omen/omen.test.ts` (18 passed, run against the real bundled files: Emma's 1880 count, Linda's 1947 peak and median age over 65, Jayden under 25, per-letter caching, unknown names, every control). 11 product browser specs passed. Agent screenshots of Emma, Linda, Taylor and the Births view inspected. The first-delivery gate result is recorded by its protected receipt.
- Risks: See Risks.

## Decisions

### Renderer

- Decision: Canvas 2D in a worker through one `raster` pipeline pass; export reuses `drawOmen`.
- Reason: 138 bars, a pie and a few text runs; one drawing function keeps preview and export identical.
- Evidence: `src/omen/omen-pipeline.ts`, `src/omen/OmenCanvas.tsx`, `src/omen/omen-export.ts`; `browser: omen backing preserves selected render scale`.

### View Interaction

- Decision: Mode `non-spatial`.
- Reason: The poster is flat.
- Evidence: `src/omen/omen-inventory.ts`.

### Interaction Ownership

- Decision: Panel only, five entries.
- Reason: Every input is a global value or shortcut.
- Evidence: `src/omen/omen-inventory.ts` `interactionOwnership`.

### Timeline

- Decision: No timeline.
- Reason: A still poster; video was not requested.
- Evidence: No timeline module; `animationIntent: none`.

### Layers

- Decision: No layers.
- Reason: No layer workflow was requested.
- Evidence: No layers module.

### Controls

- Decision: Settings (runtime background), Name (First name, Try buttons), Chart (Show), Image Export (runtime).
- Reason: The name is the only real input; the chart view is one presentation choice.
- Evidence: `src/omen/omen-controls.ts`, `appControlSectionInventory`; browser specs type a known and an unknown name, click every name button and choose every view.

### Export

- Decision: Image export only (PNG/JPG, 2K/4K/8K) via `imageExportModule()` and `scene.rasterFrameRenderer`.
- Reason: Toolcraft default; SVG and video were not requested.
- Evidence: `browser: omen image export delivers every format and size` decodes every format and size and checks the larger pie slice colour and content bounds.

### Performance

- Decision: Workload envelope from runtime state (canvas width/height, render scale, zoom) plus export resolution; derived paths.
- Reason: The chart always has 138 bars; cost follows the backing size.
- Evidence: `src/omen/omen-performance-model.ts`; `omen render plan has valid derived paths and fixtures`. First delivery runs no measured performance by contract.

Canonical control values and selected-entity isolation follow runtime representations; render scale has functional `renderScaleCoverage` with backing-pixel proof.

## Evidence

- Source reviewed: previous Omen and its three APIs, `babynames` 1.0.1, earlier 0.0.26 rebuilds.
- Contract applied: product modules under `src/omen`, data in `public/data/names` and `src/omen/survival.json`, registered browser scenarios in `e2e/product-omen-*.spec.ts`, cover at `public/toolcraft/cover.png` with `app-cover.json` and `app-cover-state.json`.

## Verification

Protected receipts own initial proof. Development checks: `src/omen/omen.test.ts` 18 passed; 11 product browser specs passed (two Playwright workers on the dev server); screenshots inspected. Cover captured with the app's own Export PNG at 4K.

## Risks

- Risk: The data ends in 2017, so babies given a name from 2018 on are missing and young names look a little older than they are; the poster says so.
- Risk: The figures describe US births only and assume holders follow national survival rates; names common among immigrants are undercounted.
