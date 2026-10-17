# src/scene and src/parts rules (three.js performance)
- No allocations inside `useFrame` (reuse vectors/quaternions created once outside it).
- Share materials and geometries through `materials.ts`; never create a material per render.
- Load .glb with drei `useGLTF` + `Suspense`; preload the current section, lazy-load the rest (sub-assemblies only when exploded).
- Dispose anything created manually (geometries, render targets) on unmount.
- Both view modes use the same meshes; switching mode swaps materials, never reloads models.
- Visual rules: `docs/design.md`.
