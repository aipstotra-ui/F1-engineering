# Physics

All constants come from `docs/facts.md` by ID. This file holds the model and its assumptions, not the numbers.

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

## Validation targets (tests in `src/sim/*.test.ts`)
- Stock RB19 within ±5% of the real 2023 qualifying pole at Monza, Monaco and Silverstone (pole times live in `facts.md`).
- More wing angle → more downforce and more drag; slower at Monza, faster at Monaco.
- More power → higher top speed; more mass → slower lap.
- Ride height below the stall threshold → lap time gets worse.
- Every result is finite: no NaN, no negative speeds.
