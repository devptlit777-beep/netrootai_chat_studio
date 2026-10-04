import torch
from diffusers import AnimateDiffPipeline, MotionAdapter
from diffusers.utils import export_to_gif

MODEL_ID = "runwayml/stable-diffusion-v1-5"
MOTION_ID = "guoyww/animatediff-motion-adapter-v1-5-2"

print("Loading motion adapter...")

adapter = MotionAdapter.from_pretrained(
    MOTION_ID,
    torch_dtype=torch.float32
)

print("Loading Stable Diffusion pipeline...")

pipe = AnimateDiffPipeline.from_pretrained(
    MODEL_ID,
    motion_adapter=adapter,
    torch_dtype=torch.float32
)

pipe = pipe.to("cpu")

pipe.enable_attention_slicing()

prompt = "a small tree moving gently in the wind, cinematic, simple background"

print("Generating video...")
print("CPU generation may take a long time.")

output = pipe(
    prompt=prompt,
    num_frames=8,
    height=256,
    width=256,
    num_inference_steps=5,
    guidance_scale=7.0
)

frames = output.frames[0]

export_to_gif(frames, "test.gif")

print("DONE!")
print("Video saved as: test.gif")