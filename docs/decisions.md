# Decisions

One line each, newest at the bottom. Don't re-ask these; append new ones.

- 2026-10-16: Web browser app (laptop/desktop); touch later.
- 2026-10-16: Car is the Red Bull RB19 (2023), the only car for now; more hybrid-era cars later.
- 2026-10-16: Real car names OK, since this is a personal/school project. No team logos; fan-project disclaimer in footer.
- 2026-10-16: Realistic view is the default; hologram is a toggleable analysis mode on the same meshes.
- 2026-10-16: Parts are AI-generated (chunky/internal) + code-built (thin/precise/movable). Free AI tools only.
- 2026-10-16: Lego-style guided build in real assembly order, then free mode.
- 2026-10-16: Very deep parts, delivered in Wave 1 (~30) and Wave 2 (~20+ sub-assemblies).
- 2026-10-16: Tuning = swap part specs + adjust real movable settings, not free-form reshaping.
- 2026-10-16: Teaching = guided build, lessons, scored missions. No AI assistant for now.
- 2026-10-16: Testing = lap sim + telemetry, wind tunnel, watch it drive, head-to-head vs. stock ghost.
- 2026-10-16: Mouse/touch controls; webcam hand tracking is a stretch goal.
- 2026-10-16: Every fact sourced in `docs/facts.md`; estimates aren't labelled differently.
- 2026-10-16: 7 lean project agents; checkers report-only; triggered by changed files.
- 2026-10-16: Branch + PR per step; user reviews and merges.
- 2026-10-16: Token efficiency: CLAUDE.md router + docs read on demand, nested CLAUDE.md, fact IDs, tiny memory.
- 2026-10-17: Tooling: Vite 8, React 19, TypeScript 6 (strict), oxlint, Vitest; CI on Node 22. The 3D view is lazy-loaded behind an error boundary (WebGL fallback message).
- 2026-10-17: npm install scripts stay blocked (only fsevents wants one; not needed).
- 2026-10-17: Repo made public (GitHub Actions minutes were blocked on the private repo). Vercel is connected to the repo; PR previews can be used for visual checks.
- 2026-10-17: Sources: FIA 2023 Technical Regulations Issue 7 is the primary source; pole times and ERS energy limits are deferred to the Python lab (Steps 11–12).
- 2026-10-17: Python added as the "lab": reference physics, FastF1 validation against real 2023 RB19 telemetry, data prep. It runs offline/CI only; the browser app stays TypeScript and must match Python's golden results. (Chosen over a Python server or Pyodide: keeps the app fast, free to host and offline.)
- 2026-10-17: Raw FastF1 data stays in a git-ignored cache; only small derived results (lap times, downsampled traces, fitted parameters) are committed.
- 2026-10-17: After every step, Claude posts a step report in chat (format in `docs/workflow.md`).
