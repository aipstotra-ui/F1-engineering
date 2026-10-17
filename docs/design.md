# Design

## Two view modes (same meshes, one toggle)
| Realistic (default) | Hologram (analysis: wind tunnel, X-ray, telemetry) |
|---|---|
| Physically based materials: carbon-fibre weave, matte navy paint with red/yellow accents, brushed titanium, rubber, anodised aluminium | Materials swapped for a fresnel edge-glow + faint wireframe shader |
| CC0 studio HDRI (Poly Haven), soft contact shadows, ambient occlusion, ACES filmic tone mapping | Dark navy background, cyan/electric-blue glow, bloom, faint scanlines |
| Neutral grey studio floor with subtle reflection | Glowing circular pedestal + grid floor (Spider-Man suit-lab look) |

No team or sponsor logos anywhere.

## Tokens (CSS variables in `src/ui/theme.css`)
`--bg-navy #050b18` · `--holo-cyan #3ad8ff` · `--holo-blue #1f6bff` · `--panel-glass rgba(20,40,80,.35)` · `--text #e6f1ff` · `--accent-red #e10600` · `--accent-yellow #ffcc00`

## UI panels
Translucent glass panels with corner brackets and thin animated tick marks (HUD style) in both modes. Lesson cards slide in from the right. Stats use a large mono font with a small "vs stock" delta.

## Camera & interaction
- Orbit: drag to rotate, scroll/pinch to zoom, right-drag to pan. Clamp so the car never leaves view.
- **Section zoom:** click a section → camera eases (~0.8 s) to that section's preset view; other sections fade to 15% opacity ghosts; a side panel lists the section's parts.
- **Exploded view:** click a part → its sub-parts move apart along preset vectors, with leader-line labels and a lesson card.
- **Guided build:** the next part's slot glows as a ghost outline; drag or click the tray part → snap animation (ease-out + small settle) → lesson card.
- Hover highlights a part with a subtle rim light (realistic) or brighter glow (hologram).
