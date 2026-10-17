# /// script
# requires-python = ">=3.13"
# dependencies = ["gradio_client==2.7.2"]
# ///
"""Make one AI part per day on the free Hugging Face tier.

  uv run scripts/ai-parts/generate.py ref <part>                 reference picture with FLUX.1-schnell
  uv run scripts/ai-parts/generate.py hunyuan3d-2.1 <part>       image -> textured 3D
  uv run scripts/ai-parts/generate.py trellis.2 <part>           image -> textured 3D

Needs a Hugging Face login (`uvx --from huggingface_hub hf auth login`); the free tier allows
about one 3D run per day. Outputs go to assets-raw/ (git-ignored). Prompts live in prompts.py.
Always run `node scripts/check-glb.mjs` on a new .glb before opening it anywhere.
"""

import shutil
import sys
import time
from pathlib import Path

from gradio_client import Client, handle_file

sys.path.insert(0, str(Path(__file__).parent))
from prompts import PROMPTS, STYLE  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "assets-raw"


def as_path(x: object) -> str:
    """Gradio sometimes wraps files as {"value": ...} or {"path": ...}."""
    while isinstance(x, dict):
        x = x.get("value") or x.get("path") or x.get("name")
    return str(x)


def save(src: object, dest: Path) -> Path:
    src_path = Path(as_path(src))
    dest = dest.with_suffix(src_path.suffix)
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy(src_path, dest)
    print(f"saved {dest.relative_to(ROOT)} ({dest.stat().st_size / 1e6:.1f} MB)")
    return dest


def reference(part: str) -> None:
    client = Client("black-forest-labs/FLUX.1-schnell", verbose=False)
    result, _ = client.predict(prompt=f"{PROMPTS[part]}, {STYLE}", seed=42, randomize_seed=False,
                               width=1024, height=1024, num_inference_steps=4, api_name="/infer")
    save(result, RAW / "ref" / part)


def hunyuan(part: str) -> None:
    client = Client("tencent/Hunyuan3D-2.1", verbose=False)
    result = client.predict(image=handle_file(str(RAW / "ref" / f"{part}.png")), mv_image_front=None,
                            mv_image_back=None, mv_image_left=None, mv_image_right=None, steps=30,
                            guidance_scale=5.0, seed=1234, octree_resolution=256, check_box_rembg=True,
                            num_chunks=8000, randomize_seed=False, api_name="/generation_all")
    save(result[1], RAW / "hunyuan3d-2.1" / part)  # [0] untextured mesh, [1] textured mesh


def trellis(part: str) -> None:
    client = Client("microsoft/TRELLIS.2", verbose=False)
    client.predict(api_name="/start_session")
    image = client.predict(input=handle_file(str(RAW / "ref" / f"{part}.png")), api_name="/preprocess_image")
    client.predict(image=image, seed=0, resolution="1024", api_name="/image_to_3d")
    glb, _ = client.predict(decimation_target=200000, texture_size=1024, api_name="/extract_glb")
    save(glb, RAW / "trellis.2" / part)


TOOLS = {"ref": reference, "hunyuan3d-2.1": hunyuan, "trellis.2": trellis}

if __name__ == "__main__":
    if len(sys.argv) != 3 or sys.argv[1] not in TOOLS or sys.argv[2] not in PROMPTS:
        print(__doc__)
        print("parts:", ", ".join(PROMPTS))
        sys.exit(1)
    started = time.time()
    TOOLS[sys.argv[1]](sys.argv[2])
    print(f"done in {time.time() - started:.0f} s")
