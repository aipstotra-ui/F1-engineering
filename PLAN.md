# F1 Engineering Lab — Project Plan

A browser-based simulator where users learn racing-car engineering by designing, tuning and testing Formula 1 cars. The UI is a holographic "engineering bay": blue wireframe holograms, glowing rings, floating panels you grab and manipulate (inspired by the Spider-Man suit-design scene).

## 1. Vision

- **Pick** a base car from F1 history (e.g. ground-effect 2022+, 2009 double-diffuser, 1988 turbo era, 1970s wings arrival).
- **Engineer** it: aerodynamics, power unit, suspension, tyres, brakes, weight/balance, cooling.
- **Test** it: wind-tunnel view, track simulation, lap-time comparison, telemetry graphs.
- **Learn** while doing: every part has a plain-language "why it matters" explainer, guided missions, and instant feedback on trade-offs.

## 2. Target users

Curious fans and students (no engineering background assumed). Beginner mode = guided with sliders and explanations. Engineer mode = full parameter access and raw telemetry.

## 3. Core features

| Area | What the user does | What they learn |
|---|---|---|
| Car garage | Choose era/car, view 3D hologram | How F1 design evolved |
| Aero lab | Adjust front/rear wing, floor, diffuser, see airflow particles | Downforce vs drag |
| Power unit | Tune ICE, ERS deployment, fuel load | Power, efficiency, energy recovery |
| Chassis & suspension | Ride height, spring/damper, anti-roll bars | Mechanical grip, platform control |
| Tyres & brakes | Compound, pressures, brake bias | Grip window, degradation |
| Track test | Run a lap on a chosen circuit, see telemetry | Setup vs circuit demands |
| Missions | "Build a car for Monaco", "Beat the 1988 McLaren on top speed" | Applying trade-offs |
| Glossary / Learn | Contextual tooltips and short lessons | F1 terminology |

## 4. Design language (holographic UI)

- Dark navy background, cyan/electric-blue glow, thin line-art wireframes.
- Central car hologram on a glowing circular pedestal; part-selection rings around it.
- Floating translucent panels with tech-style HUD borders and animated data ticks.
- Hand-style interactions: drag to rotate, pinch/scroll to zoom, grab a part to "pull it out" and inspect it with a callout.
- Stretch goal: webcam hand tracking (MediaPipe) for true gesture control.

## 5. Tech stack (proposed)

- **TypeScript + React + Vite** for the app.
- **Three.js via react-three-fiber** (+ drei, postprocessing for bloom/glow) for the hologram look.
- **Zustand** for car-configuration state.
- **Physics/sim core** in plain TypeScript (separate package, no UI deps) so it is unit-testable: lap-time simulation (quasi-steady-state point-mass model first), later multi-body upgrades.
- **Vitest** for the sim core, **Playwright** for UI smoke tests.
- Deployment: static hosting (Vercel/GitHub Pages).

Alternatives considered: Unity/Unreal (heavier, worse sharing), Python desktop (poor visuals). Web wins for reach and the glow aesthetic.

## 6. Architecture

```
/apps/web            React + R3F front end
/packages/sim-core   Car model, aero maps, lap-time solver (pure TS)
/packages/data       Era presets, circuits, part catalogs (JSON)
/packages/content    Lessons, glossary, missions (Markdown/JSON)
/docs                Design notes, physics assumptions
```

Key principle: **sim-core is the source of truth**; the UI only edits a `CarConfig` and renders results.

## 7. Data and accuracy

- Use public, approximate figures (mass, wheelbase, downforce/drag coefficients, power ranges per era). Label them "educational approximations", not team data.
- Do not use real team logos/liveries or copyrighted 3D models; use generic, original car geometry and "inspired-by" era archetypes to avoid IP issues.
- Circuits: simplified centerline + curvature + elevation, built from open data (e.g. OpenStreetMap / TUMFTM racetrack database, check licenses).

## 8. Roadmap

### Phase 0 — Foundations (week 1)
- Repo, tooling (Vite, TS, lint, Vitest, CI).
- Design tokens + holographic UI kit (glow panel, ring button, HUD frame).
- Spike: a rotating wireframe car on a glowing pedestal.

### Phase 1 — Garage MVP (weeks 2–3)
- 3-4 era archetypes, selectable in a ring carousel.
- `CarConfig` model + sliders for wings, ride height, power, mass.
- Live stat readouts (top speed, downforce @ 250 km/h, 0–100, cornering g).

### Phase 2 — Simulation core (weeks 3–5)
- Point-mass lap-time solver (grip circle, aero, power-limited acceleration, braking).
- 2-3 simplified circuits; lap-time + speed/gear/throttle telemetry charts.
- Unit tests against known sanity bounds.

### Phase 3 — Learning layer (weeks 5–6)
- Contextual "why it matters" tooltips, glossary, 5-8 short lessons.
- Guided missions with scoring; beginner/engineer mode toggle.

### Phase 4 — Visual wow (weeks 6–8)
- Airflow particle visualization (precomputed/approximated flow fields).
- Part "pull-out" exploded view with callouts; bloom, scanlines, sound design.
- Optional webcam hand-tracking.

### Phase 5 — Depth and polish (later)
- Tyre degradation, pit strategy, weather, setup comparison/save/share.
- Accounts or share-by-link, leaderboard of missions.

## 9. First concrete steps

1. Scaffold `apps/web` with Vite + React + TS + react-three-fiber.
2. Build the hologram pedestal scene and a placeholder procedural car.
3. Define `CarConfig` and the era presets JSON.
4. Implement sim-core stats (top speed, downforce) with tests.
5. Wire sliders to live stats in a glowing HUD panel.

## 10. Open decisions

- Web-only vs. later desktop wrapper (Tauri).
- Level of physics fidelity vs. approachability.
- Hand tracking: MVP or stretch.
- Monetization / public release (affects IP caution; F1 is a trademark, so avoid official branding).
