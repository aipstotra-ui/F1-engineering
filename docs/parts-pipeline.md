# Parts pipeline

## Who makes what
| AI-generated (image → 3D) | Code-built (precise, movable) |
|---|---|
| Monocoque tub, nose cone, sidepods, engine cover/airbox, seat, steering wheel | Front wing: main plane, flaps, endplates |
| Power unit: V6 block, turbo, MGU-H, MGU-K, battery, control electronics, exhaust, intercooler | Rear wing + DRS flap, beam wing |
| Gearbox, radiators, oil cooler, rear crash structure | Floor, venturi tunnels, diffuser, plank |
| Brake calipers, brake ducts, uprights, inboard rockers/dampers | Suspension arms, pull-rods (front), push-rods (rear) |
| **Wave 2:** pistons, crankshaft, cylinder head, turbo internals, gear cassette, battery cells | Wheels, rims, tyres, brake discs, halo |

AI tools do poorly on thin, sharp shapes, so those parts are built in code.

## AI part steps (free tools only)
0. **Safety first.** Run `node scripts/check-glb.mjs <file>` on every downloaded/generated .glb before opening it anywhere else.
1. **Reference image.** One part on a plain background, 3/4 view. Use a generated image or the user's own photo/sketch.
2. **Generate.** Use Hunyuan3D or TRELLIS (free online demos), or the free tiers of Meshy/Tripo. Export GLB. Try 2–3 times and keep the best.
3. **Store the raw file** at `assets-raw/<part-id>.glb`, untracked by git.
4. **Clean** with the part-pipeline agent (gltf-transform): centre, scale to real size, simplify, compress (meshopt), resize textures to ≤ 1024 px. **Target ≤ 2 MB** per part; if over, simplify further and resize textures to 512 px. **Hard cap 5 MB** (security-checker blocks above it). Scaling uses `scripts/clean-part.mjs` (added in Step 3; the gltf-transform CLI has no scale command).
5. **Save** to `public/models/parts/<part-id>.glb`, add a catalog stub in `src/data/parts.ts`, and add a row below.
6. **Fit** the part on the car with the dev placement tool (Step 7); it saves `attach` into the catalog.
7. **Fallback.** If a part is still too rough after 3 tries, mark it `source: 'code'` and build a simpler version.

## Tools and limits (checked 2026-10-17)
| Tool | Use | Licence | Limit |
|---|---|---|---|
| FLUX.1-schnell (HF Space) | Reference pictures | Apache-2.0 | Good for common objects; poor for niche F1 parts (caliper/sidepod attempts had fake logos or whole cars) |
| Hunyuan3D 2.1 (HF Space) | Image → textured 3D (PBR) | Tencent Hunyuan Community (outputs usable; licence excludes EU, UK, South Korea) | ~270 s GPU per run |
| TRELLIS.2 (HF Space) | Image → textured 3D | MIT | GPU per run similar |
| Hugging Face ZeroGPU | Runs the Spaces | — | Anonymous: a few images/day. Free account: ~4–5 min/day (≈1 part/day; failed runs still count). PRO: 40 min/day |
| Blender + MCP for Blender v2.1.9 | Finishing: clean-up, splitting, precise modelling, real materials | MIT (Blender: GPL) | Local, free |

**MCP for Blender safety review (v2.1.9, 2026-10-17):** PyPI wheel identical to reviewed GitHub source; add-on socket binds `localhost:9876` only; telemetry consent defaults off, and the server runs with `DISABLE_TELEMETRY=true`; no self-update unless `update` is run by hand; by design it executes Python sent by Claude inside Blender, so start its server only while working. Verified add-on copy: `assets-raw/tools/blender_mcp_addon_v2.1.9.py` (git-ignored). Third-party integrations (Hyper3D, Sketchfab, Tencent cloud, Poly Pizza) stay off unless a key is added; Poly Haven (CC0) needs no key.

## Safety checks (security-checker)
- No external URIs in the GLB (all buffers and images embedded).
- File ≤ 5 MB hard cap; no unexpected extensions.
- Generated only from the tools listed above.

## Blender finishing recipe (what worked for the turbo)
1. Import the raw .glb into its own scene; apply transforms; scale to the real size and centre.
2. AI metal comes out mirror-chrome: remap roughness to satin (≈0.35–0.6), lift the base colour, add tints (e.g. heat on exhaust-side parts).
3. Bake base colour (DIFFUSE, colour only) **with Metallic temporarily 0**, otherwise the bake comes out almost black, then bake ROUGHNESS; build a clean material from the baked images plus the original metallic channel.
4. Shade smooth by angle (~40°); export GLB with `use_selection` and `use_active_scene`; run check-glb, then clean-part.

## Daily AI queue (free tier: one 3D run per day)
Hero parts get AI + Blender (decided 2026-10-18); every other part stays code-built unless it looks clearly worse.
Run `F1_PROJECT_ROOT=/Users/aic/Desktop/F1 uv run scripts/ai-parts/generate.py hunyuan3d-2.1 <part>`, then `node scripts/check-glb.mjs`, then finish in Blender (recipe above).
| # | Part | Tool | Status |
|---|---|---|---|
| 1 | turbocharger | hunyuan3d-2.1 + Blender | done 2026-10-18 (1 try, 131 s) |
| 2 | brake-caliper | hunyuan3d-2.1 + Blender | scheduled 2026-10-19 14:20; the reference picture includes a brake disc, to be cut away in Blender |
| 3 | v6-engine | hunyuan3d-2.1 + Blender | needs a reference picture (a separate day: pictures use GPU time too) |
| 4 | gearbox | hunyuan3d-2.1 + Blender | needs a reference picture |
| 5 | mgu-k | hunyuan3d-2.1 + Blender | needs a reference picture |
| 6 | steering-wheel | hunyuan3d-2.1 + Blender | needs a reference picture |
| 7 | front/rear uprights | hunyuan3d-2.1 + Blender | needs a reference picture |
| 8 | exhaust | hunyuan3d-2.1 + Blender | needs a reference picture; thin pipes may suit Blender modelling better |
| — | sidepods | Blender (hand-modelled) | later |

## Part sources & licences
| Part ID | Tool | Date | Licence / terms | Notes |
|---|---|---|---|---|
| turbocharger | Hunyuan3D 2.1 (HF Space tencent/Hunyuan3D-2.1) | 2026-10-18 | Tencent Hunyuan Community licence (outputs usable; licence territory excludes EU, UK, South Korea) | 40k tris, 2 × 2048 px PBR textures embedded as data URIs (one JPEG mislabelled PNG); cleaned to 0.40 m, 0.56 MB (JPEG colour + WebP metal/roughness, smooth normals added) |
| turbocharger (finished) | Hunyuan3D 2.1 + Blender 5.2.2 (MCP for Blender) | 2026-10-18 | as above | Roughness raised to satin (0.35–0.62), base colour brightened, bronze→blue heat tint on turbine end, baked to 1024 px; smooth by angle 40°; 0.79 MB. Work file: assets-raw/blender/turbocharger-finish.blend |
| ref/turbocharger.webp, ref/brake-caliper.webp | FLUX.1-schnell (HF Space black-forest-labs/FLUX.1-schnell) | 2026-10-17 | Apache-2.0 | Reference pictures, no logos or text |

**Before a public release:** the Hunyuan3D licence excludes the EU, UK and South Korea, and files in `public/` are served to every visitor (the repo and Vercel previews are public). Re-check the licence terms for distributing outputs before launching beyond a personal/school project.

