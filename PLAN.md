# F1 Engineering Lab: roadmap

## Now
- **Current step:** Plan update: Python lab added (branch `plan-python-lab`, PR open)
- **Next action:** User merges the plan PR, then Step 3 (AI part test: turbo, brake caliper, sidepod).
- **Note:** Step 2's visual check was skipped (interrupted); check the catalog panel on the Vercel preview.
- **Open questions:** none
- **Blocked on:** nothing

---

Build a realistic Red Bull RB19 part by part, learn what each part does, tune it, and test it. Decisions: `docs/decisions.md`. How we work: `docs/workflow.md`.

**Two languages, one source of truth:** the browser app is TypeScript. The **Python lab** (`lab/`, run on your computer) is the accuracy engine: a reference physics model, validation against real 2023 RB19 telemetry (FastF1), and track/tyre/aero data prep. Python exports data + "golden" results; tests force the TypeScript sim to match them.

## Phase A: Foundations
- [x] **0. Workflow.** CLAUDE.md router, docs/, 7 agents, PR template, memory. *Check:* agents load and report.
- [x] **1. Setup.** Vite + React + TS + R3F, Vitest, lint, GitHub Actions. *Check:* page opens at localhost.
- [x] **2. Part catalog.** `src/data/parts.ts` with all Wave 1 parts, sections, build order, lessons; seed `docs/facts.md`. *Check:* page lists parts by section.

## Phase B: AI parts
- [ ] **3. AI part test (go/no-go).** Turbo, brake caliper and sidepod on 2–3 free tools, compared side by side. *Check:* user judges "realistic enough".
- [ ] **4. Part production.** Work through the AI parts list in `docs/parts-pipeline.md` (runs alongside C–E).

## Phase C: Realistic car on screen
- [ ] **5. Studio scene.** HDRI, shadows, orbit camera, Realistic ⇄ Hologram toggle.
- [ ] **6. Code-built precision parts.** Wings, floor/diffuser, suspension arms, wheels/tyres, brake discs, halo.
- [ ] **7. Assemble AI parts.** `AiPart` loader + dev placement tool. *Check:* full RB19 assembled.

## Phase D: Lego experience
- [ ] **8. Section zoom + exploded view.** Camera flies to section, others fade, parts list + labels.
- [ ] **9. Guided build mode.** Parts tray, ghost slot, snap animation, lesson cards, progress; then free mode.

## Phase E: Python lab + engineering & testing
- [ ] **10. Specs + tuning.** Spec picker (swaps parts) + sliders for real adjustables.
- [ ] **11. Python lab setup + real data.** `lab/` with uv, ruff, pytest and a CI job. FastF1 pulls Verstappen's best 2023 qualifying lap in the RB19 at Monza, Monaco and Silverstone; track outlines become circuit files; those lap times and the ERS limits get sourced in `facts.md`. Check FastF1/F1 timing terms before committing derived data; add a size/schema guard for exported JSON. *Check:* `uv run --directory lab pytest` passes; a plot of the real Monza speed trace.
- [ ] **12. Reference physics (Python).** NumPy/SciPy lap solver; aero, power and tyre parameters fitted to the real telemetry; exports `src/data/generated/*.json` + golden results. *Check:* simulated stock RB19 within ±2% of the real RB19 qualifying laps, speed trace overlaid on real data.
- [ ] **13. Live stats (TypeScript).** Top speed, downforce/drag, balance, cornering g vs. stock, matching Python's golden results. **← first playable**
- [ ] **14. Lap sim + telemetry.** TS port of the lap solver (golden tests ≤0.1% from Python); graphs with your car vs. the real RB19 lap.
- [ ] **15. Watch it drive.** Car laps a 3D track from the speed trace.
- [ ] **16. Head-to-head.** Stock-RB19 ghost, delta graph, save/share designs.
- [ ] **17. Wind tunnel.** Hologram airflow streamlines + downforce/drag bars.

## Phase F: Learning, depth, polish
- [ ] **18. Lessons + missions.**
- [ ] **19. Wave 2 deep parts.** Take-apart engine, turbo, gearbox, battery, brake corner, steering wheel.
- [ ] **20. Polish & deploy.** Sound, intro, performance, disclaimer, Playwright, public URL.

**Later:** webcam hand tracking, more hybrid cars, strategy/weather, iPad layout, AI race engineer.
