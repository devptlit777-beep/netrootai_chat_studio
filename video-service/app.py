import os
import uuid

import torch
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from diffusers import (
    AnimateDiffPipeline,
    MotionAdapter,
    DDIMScheduler,
)
from diffusers.utils import export_to_video


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="NetrootAI Video Service",
    version="1.0.0"
)

OUTPUT_DIR = "outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

app.mount(
    "/videos",
    StaticFiles(directory=OUTPUT_DIR),
    name="videos"
)


# ============================================================
# REQUEST MODEL
# ============================================================

class VideoRequest(BaseModel):
    inputs: str


# ============================================================
# MODEL CONFIGURATION
# ============================================================

MODEL_ID = "SG161222/Realistic_Vision_V5.1_noVAE"
MOTION_ID = "guoyww/animatediff-motion-adapter-v1-5-2"

DEVICE = "cpu"
DTYPE = torch.float32


# ============================================================
# LOAD MODEL
# ============================================================

print()
print("=" * 60)
print("NETROOTAI VIDEO SERVICE")
print("=" * 60)
print("Device:", DEVICE)
print("Model:", MODEL_ID)
print("Motion adapter:", MOTION_ID)
print("=" * 60)
print()

print("Loading motion adapter...")

adapter = MotionAdapter.from_pretrained(
    MOTION_ID,
    torch_dtype=DTYPE
)

print("Motion adapter loaded.")

print("Loading video pipeline...")

pipe = AnimateDiffPipeline.from_pretrained(
    MODEL_ID,
    motion_adapter=adapter,
    torch_dtype=DTYPE
)

print("Pipeline loaded.")

# CPU
pipe = pipe.to(DEVICE)

# Memory optimization supported by AnimateDiffPipeline
pipe.enable_attention_slicing()

print()
print("=" * 60)
print("MODEL READY")
print("Device: CPU")
print("Resolution: 256x256")
print("Frames: 8")
print("Steps: 15")
print("=" * 60)
print()


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/")
def root():

    return {
        "status": "online",
        "service": "NetrootAI Video Generation",
        "model": MODEL_ID,
        "device": DEVICE
    }


# ============================================================
# VIDEO GENERATION
# ============================================================

@app.post("/generate")
def generate_video(request: VideoRequest):

    prompt = request.inputs.strip()

    print()
    print("=" * 60)
    print("NEW VIDEO REQUEST")
    print("=" * 60)
    print("Prompt:")
    print(prompt)
    print("=" * 60)

    if not prompt:

        raise HTTPException(
            status_code=400,
            detail="Prompt is required"
        )

    try:

        # ------------------------------------------------------
        # Negative prompt
        # ------------------------------------------------------

        negative_prompt = (
            "low quality, worst quality, blurry, distorted, "
            "deformed, duplicate, bad anatomy, artifacts, "
            "static image, text, watermark"
        )

        # ------------------------------------------------------
        # Random seed
        # ------------------------------------------------------

        seed = torch.randint(
            0,
            2**31 - 1,
            (1,)
        ).item()

        print("Seed:", seed)

        generator = torch.Generator(
            device="cpu"
        ).manual_seed(seed)

        # ------------------------------------------------------
        # Generate
        # ------------------------------------------------------

        print("Starting generation...")
        print("This may take several minutes on CPU.")

        result = pipe(
            prompt=prompt,
            negative_prompt=negative_prompt,

            num_frames=8,

            height=256,
            width=256,

            num_inference_steps=15,

            guidance_scale=7.5,

            generator=generator
        )

        frames = result.frames[0]

        # ------------------------------------------------------
        # Save video
        # ------------------------------------------------------

        filename = f"{uuid.uuid4()}.mp4"

        filepath = os.path.join(
            OUTPUT_DIR,
            filename
        )

        print("Saving video...")

        export_to_video(
            frames,
            filepath,
            fps=8
        )

        print()
        print("=" * 60)
        print("VIDEO GENERATED SUCCESSFULLY")
        print("=" * 60)
        print("Seed:", seed)
        print("File:", filepath)
        print("=" * 60)
        print()

        # ------------------------------------------------------
        # Response
        # ------------------------------------------------------

        return {
            "success": True,
            "seed": seed,
            "video_url": (
                f"http://127.0.0.1:8000/videos/{filename}"
            )
        }

    except Exception as error:

        print()
        print("=" * 60)
        print("VIDEO GENERATION ERROR")
        print("=" * 60)
        print(str(error))
        print("=" * 60)
        print()

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )