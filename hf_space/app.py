from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline
import torch
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Loading Qwen model...")
pipe = pipeline(
    "text-generation", 
    model="Qwen/Qwen2.5-0.5B-Instruct", 
    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
    device_map="auto"
)
print("Model loaded successfully.")

@app.post("/api/chat")
async def chat(request: Request):
    data = await request.json()
    messages = data.get("messages", [])
    
    start_time = time.time()
        
    outputs = pipe(
        messages,
        max_new_tokens=512,
        do_sample=True,
        temperature=0.7,
        top_p=0.9,
    )
    
    response_msg = outputs[0]["generated_text"][-1]["content"]
    latency = time.time() - start_time
    
    return {
        "reply": response_msg,
        "latency_ms": latency * 1000,
        "input_tokens": len(str(messages)) // 4,
        "output_tokens": len(response_msg) // 4,
        "cost": ((len(str(messages)) // 4 + len(response_msg) // 4) / 1000000) * 1.20
    }
