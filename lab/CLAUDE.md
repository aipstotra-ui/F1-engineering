# lab/ rules (Python lab)
- Python 3.13 via uv. Run everything as `uv run …` inside `lab/` (pytest, ruff, scripts). Add packages with `uv add`, never pip.
- Type hints on every function; `ruff check` + `ruff format` clean.
- SI units internally (m, kg, s, N, W, J, rad); name units when unclear: `speed_mps`, `power_w`.
- Every F1 constant cites a fact ID: `MIN_MASS_KG = 798  # F-001`. Values come from `docs/facts.md`.
- Deterministic: no unseeded randomness; same inputs → same exported files.
- Tests needing internet (FastF1 downloads) are marked `@pytest.mark.network` and skipped in CI. FastF1 cache lives in `lab/.cache/` (git-ignored).
- Exports go to `src/data/generated/` and `src/sim/__golden__/` with a header field `"generatedBy": "lab/<script>"`. Never hand-edit them; re-run the export.
- Commit only small derived data (lap times, downsampled traces, fitted parameters), never raw telemetry.
- Model and validation targets: `docs/physics.md`.
