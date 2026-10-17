# src/sim rules
- Pure TypeScript only. No React, three.js or DOM imports. Functions are `(inputs) → result`, with no globals and no unseeded randomness.
- SI units internally (m, kg, s, N, W, J, rad). Name variables with units when unclear: `speedMps`, `powerW`.
- Every F1 constant cites a fact ID: `const MIN_MASS_KG = /* value */ // F-001`. Grab the value from `docs/facts.md`; never invent one.
- Every exported function gets a Vitest test: sanity bounds, trade-off direction, and finite output (no NaN).
- Model and validation targets: `docs/physics.md`. Change the doc when the model changes.
