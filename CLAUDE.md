# F1 Engineering Lab

Web app (Vite + React + TS + react-three-fiber) where users learn F1 engineering by building a realistic Red Bull RB19 part by part (Lego-style), tuning it, and testing it in a lap sim. Hologram view is one mode. A **Python lab** (`lab/`, offline + CI) is the accuracy engine: reference physics, validation against real telemetry, data export.

## Start every session
1. Read the **Now** block at the top of `PLAN.md` (about 10 lines). Don't re-explore what it already says.
2. Open only the docs the table below names for the task. Never `@import` docs; read sections, not whole files.

## Read only when needed
| Doing | Read |
|---|---|
| Any step (branch, PR, checks) | `docs/workflow.md` |
| Folder layout, data flow, conventions | `docs/architecture.md` |
| Visuals, materials, hologram, camera/zoom | `docs/design.md` |
| Physics / sim code | `docs/physics.md` (+ `src/sim/CLAUDE.md` loads automatically) |
| Python lab (`lab/`) | `lab/CLAUDE.md` (loads automatically) + `docs/physics.md` |
| Any F1 number or claim | `docs/facts.md` (grep by ID, e.g. `F-012`) |
| 3D parts, AI generation, .glb files | `docs/parts-pipeline.md` |
| "Why did we choose X?" | `docs/decisions.md` |

## Golden rules
- User is new to coding: explain each new file in 1–2 plain sentences; every step ends with something to try in the browser.
- Every F1 number/claim lives once in `docs/facts.md` with a source URL; code, lessons and the catalog cite it by ID.
- `src/sim/` is the source of truth; UI only edits `CarConfig` and displays sim output.
- No team logos. Footer text (canonical): "Fan-made educational project, not affiliated with Formula 1, the FIA or Red Bull Racing."
- One roadmap step = one branch `step-NN-name` = one PR. The user merges; never push to `main`.
- Settled decisions are in `docs/decisions.md`. Don't re-ask them; append new ones.
- Python is the physics reference; the TS sim must match its golden results. Never hand-edit `src/data/generated/` or `src/sim/__golden__/`.
- **After every step, post the step report** (format in `docs/workflow.md`).

## Checker agents (run only what the change triggers, in parallel)
| Changed | Agents |
|---|---|
| `src/sim/**`, `lab/**`, `src/data/generated/**` | physics-verifier (also checks constants match `facts.md`) |
| `src/data/*.ts`, `docs/facts.md`, lessons, missions | f1-fact-checker |
| committed `.glb` in `public/models/parts/` | security-checker |
| `src/scene/**`, `src/parts/**` | visual-qa + code-optimizer |
| `src/build/**`, `src/ui/**`, `src/screens/**` | visual-qa |
| `package.json`/lockfile, `lab/pyproject.toml`/`uv.lock`, share-link/import code | security-checker |
| every PR | code-critic + security-checker (diff only) |

Checkers report; the main agent fixes and re-runs only the checker that failed. Full loop: `docs/workflow.md`.

**Worker (not a checker):** `part-pipeline` cleans a raw `assets-raw/<id>.glb` into `public/models/parts/` *before* the diff exists. Run it per new AI part.
