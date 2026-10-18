# Parts pipeline

## Who makes what
Since Step 3b every part also has a code-built version (`src/parts/rb19/`). The table below is the plan for which parts may be swapped for AI/Blender models if they look better.

| AI-generated (image → 3D) | Code-built (precise, movable) |
|---|---|
| Monocoque tub, nose cone, sidepods, engine cover/airbox, seat, steering wheel | Front wing: main plane, flaps, endplates |
| Power unit: V6 block, turbo, MGU-H, MGU-K, battery, control electronics, exhaust, intercooler | Rear wing + DRS flap, beam wing |
| Gearbox, radiators, oil cooler, rear crash structure | Floor, venturi tunnels, diffuser, plank |
| Brake calipers, brake ducts, uprights, inboard rockers/dampers | Suspension arms, pull-rods (front), push-rods (rear) |
| **Wave 2:** pistons, crankshaft, cylinder head, turbo internals, gear cassette, battery cells | Wheels, rims, tyres, brake discs, halo |

AI tools do poorly on thin, sharp shapes, so those parts are built in code.

## AI part steps (free tools only)
1. **Reference image.** One part on a plain background, 3/4 view. Use a generated image or the user's own photo/sketch.
2. **Generate.** Use Hunyuan3D or TRELLIS (free online demos), or the free tiers of Meshy/Tripo. Export GLB. Try 2–3 times and keep the best.
3. **Store the raw file** at `assets-raw/<part-id>.glb`, untracked by git.
4. **Clean** with the part-pipeline agent (gltf-transform): centre, scale to real size, simplify, compress (meshopt), resize textures to ≤ 1024 px. **Target ≤ 2 MB** per part; if over, simplify further and resize textures to 512 px. **Hard cap 5 MB** (security-checker blocks above it). Scaling uses `scripts/clean-part.mjs` (added in Step 3; the gltf-transform CLI has no scale command).
5. **Save** to `public/models/parts/<part-id>.glb`, add a catalog stub in `src/data/parts.ts`, and add a row below.
6. **Fit** the part on the car with the dev placement tool (Step 7); it saves `attach` into the catalog.
7. **Fallback.** If a part is still too rough after 3 tries, mark it `source: 'code'` and build a simpler version.

## Safety checks (security-checker)
- No external URIs in the GLB (all buffers and images embedded).
- File ≤ 5 MB hard cap; no unexpected extensions.
- Generated only from the tools listed above.

## Part sources & licences
| Part ID | Tool | Date | Licence / terms | Notes |
|---|---|---|---|---|
