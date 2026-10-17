# Physics

All constants come from `docs/facts.md` by ID. This file holds the model and its assumptions, not the numbers.

## Two implementations
1. **Python reference (`lab/f1lab/reference_sim.py`).** Written first and kept simple and readable, it's the trusted version. Its parameters that regulations don't fix (drag/downforce coefficients, tyre grip, ERS deployment shape) are **fitted to real 2023 RB19 telemetry** from FastF1.
2. **TypeScript port (`src/sim/`).** It runs live in the browser and must match the Python golden results (lap time within 0.1%, speed trace within 1 km/h RMS).

## Car model
- **Mass & balance.** Total mass, longitudinal weight distribution, centre-of-gravity height.
- **Aero.** Downforce `F_z = ½ ρ v² · ClA` and drag `F_d = ½ ρ v² · CdA`. `ClA`/`CdA` come from the chosen wing specs, flap angles and floor state; aero balance is the front share of `F_z`.
- **Ground effect.** Floor downforce rises as ride height drops, until a stall threshold, below which downforce collapses and oscillates (porpoising).
- **Power unit.** ICE power + MGU-K deployment limited by ERS energy per lap; harvest under braking. Each gear's ratio sets the speed range.
- **Tyres.** Friction coefficient μ per compound, which peaks inside a temperature window; wear reduces μ per lap. Load sensitivity: μ falls slightly as vertical load rises.
- **Brakes.** Brake bias splits the braking force; whichever axle exceeds its grip first locks.

## Lap solver (quasi-steady-state point mass)
1. Split the circuit centerline into ~5 m segments with curvature κ.
2. **Corner limit:** the highest v where `m v² κ ≤ μ (m g + F_z(v))`.
3. **Forward pass:** accelerate, limited by power `(P/v − F_d − rolling)` and by the grip left over from cornering (friction circle).
4. **Backward pass:** brake, limited by grip + drag.
5. The speed at each point is the minimum of the three passes. Lap time = Σ ds / v. Outputs speed, throttle, brake, gear and ERS state-of-charge traces.

## Validation targets
**Python (`lab/tests/`), against reality:**
- Stock RB19 lap within ±2% of Verstappen's best 2023 qualifying lap in the RB19 at Monza, Monaco and Silverstone (times in `facts.md`). This is the RB19 reference, which isn't always the pole (Sainz took Monza pole).
- Simulated speed trace vs. real telemetry: RMS error reported per circuit, with minimum corner speeds and top speeds compared.

**TypeScript (`src/sim/*.test.ts`), against Python:**
- Golden configs match within ≤0.1% lap time and ≤1 km/h RMS speed.

**Both:**
- More wing angle → more downforce and more drag; slower at Monza, faster at Monaco.
- More power → higher top speed; more mass → slower lap.
- Ride height below the stall threshold → lap time gets worse.
- Every result is finite: no NaN, no negative speeds.
