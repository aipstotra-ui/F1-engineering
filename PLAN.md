# F1 Engineering Lab: roadmap

## Now
- **Current step:** 2. Part catalog (branch `step-02-part-catalog`, PR open)
- **Next action:** User reviews lessons in the catalog panel and merges the Step 2 PR, then Step 3 (AI part test: turbo, brake caliper, sidepod).
- **Note:** Step 2's visual check was skipped (interrupted); check the panel on the Vercel preview.
- **Open questions:** none
- **Blocked on:** nothing

---

Build a realistic Red Bull RB19 part by part, learn what each part does, tune it, and test it. Decisions: `docs/decisions.md`. How we work: `docs/workflow.md`.

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

## Phase E: Engineering & testing
- [ ] **10. Specs + tuning.** Spec picker (swaps parts) + sliders for real adjustables.
- [ ] **11. Live stats.** Top speed, downforce/drag, balance, cornering g vs. stock. **← first playable**
- [ ] **12. Lap sim + telemetry.** Monza, Monaco, Silverstone. *Check:* stock time is close to real pole.
- [ ] **13. Watch it drive.** Car laps a 3D track from the speed trace.
- [ ] **14. Head-to-head.** Stock-RB19 ghost, delta graph, save/share designs.
- [ ] **15. Wind tunnel.** Hologram airflow streamlines + downforce/drag bars.

## Phase F: Learning, depth, polish
- [ ] **16. Lessons + missions.**
- [ ] **17. Wave 2 deep parts.** Take-apart engine, turbo, gearbox, battery, brake corner, steering wheel.
- [ ] **18. Polish & deploy.** Sound, intro, performance, disclaimer, Playwright, public URL.

**Later:** webcam hand tracking, more hybrid cars, strategy/weather, iPad layout, AI race engineer.
