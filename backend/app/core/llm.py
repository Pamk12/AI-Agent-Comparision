import time
import httpx
import os
from typing import List, Dict, Tuple, Optional
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from ..schemas import ModelConfig, Message

class LLMException(Exception):
    pass

_local_pipe = None

class LLMClient:
    # ──────────────────────────────────────────────────────────────
    # Groq (Frontier Model)
    # ──────────────────────────────────────────────────────────────
    @staticmethod
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1.5, min=2, max=10), reraise=True)
    def call_groq(
        config: ModelConfig,
        system_prompt: str,
        messages: List[Message]
    ) -> Tuple[str, int, int, float, float]:
        api_key = config.apiKey or os.getenv("GROQ_API_KEY")
        if not api_key:
            raise LLMException("Groq API Key is missing.")

        model_name = config.modelName or "llama-3.1-8b-instant"
        
        payload_messages = [{"role": "system", "content": system_prompt}]
        for msg in messages:
            payload_messages.append({"role": msg.role, "content": msg.content})

        start_time = time.time()
        
        try:
            with httpx.Client(timeout=60.0) as client:
                response = client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": model_name,
                        "messages": payload_messages,
                        "temperature": 0.7,
                        "max_tokens": 1024
                    }
                )
                response.raise_for_status()
                data = response.json()
                
            latency = time.time() - start_time
            reply = data["choices"][0]["message"]["content"]
            usage = data.get("usage", {})
            input_tokens = usage.get("prompt_tokens", 0)
            output_tokens = usage.get("completion_tokens", 0)
            # Llama-3.1-8b-instant cost: $0.05 per 1M input, $0.08 per 1M output
            cost = (input_tokens / 1_000_000) * 0.05 + (output_tokens / 1_000_000) * 0.08
            
            return reply, input_tokens, output_tokens, cost, latency
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                raise LLMException("Groq API Rate Limit hit (429). Please wait a moment.")
            raise LLMException(f"Groq API Error: {e.response.text}")
        except Exception as e:
            raise LLMException(f"Groq Client Error: {str(e)}")


    # ──────────────────────────────────────────────────────────────
    # Local Offline Model (Qwen-0.5B)
    # ──────────────────────────────────────────────────────────────
    @staticmethod
    def call_local_inference(
        config: ModelConfig,
        system_prompt: str,
        messages: List[Message]
    ) -> Tuple[str, int, int, float, float]:
        global _local_pipe
        
        # Format messages
        local_messages = [{"role": "system", "content": system_prompt}]
        for msg in messages:
            local_messages.append({"role": msg.role, "content": msg.content})

        start_time = time.time()
        hf_space_url = os.getenv("HF_SPACE_URL")

        # 1. Route to Hugging Face Space if deployed
        if hf_space_url:
            try:
                with httpx.Client(timeout=120.0) as client:
                    response = client.post(
                        f"{hf_space_url.rstrip('/')}/api/chat",
                        json={"messages": local_messages}
                    )
                    response.raise_for_status()
                    data = response.json()
                    
                return data["reply"], data["input_tokens"], data["output_tokens"], data.get("cost", 0.0), data["latency_ms"] / 1000.0
            except Exception as e:
                raise LLMException(f"Failed to route to HF Space: {e}")

        # 2. Fallback to Local Offline inference (Only if HF_SPACE_URL is not set)
        try:
            if _local_pipe is None:
                os.environ["HF_HUB_OFFLINE"] = "1"
                os.environ["TRANSFORMERS_OFFLINE"] = "1"
                from transformers import pipeline
                import torch
                _local_pipe = pipeline(
                    "text-generation", 
                    model="Qwen/Qwen2.5-0.5B-Instruct", 
                    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
                )

            local_messages = [{"role": "system", "content": system_prompt}]
            for msg in messages:
                local_messages.append({"role": msg.role, "content": msg.content})

            outputs = _local_pipe(
                local_messages,
                max_new_tokens=512,
                do_sample=True,
                temperature=0.7,
                top_p=0.9,
            )
            
            response_msg = outputs[0]["generated_text"][-1]
            reply = response_msg["content"]
            
            latency = time.time() - start_time
            input_tokens = len(str(local_messages)) // 4
            output_tokens = len(reply) // 4
            # Estimated CPU inference cost: ~$1.20 per 1M tokens total
            cost = ((input_tokens + output_tokens) / 1_000_000) * 1.20
            
            return reply, input_tokens, output_tokens, cost, latency
        except Exception as e:
            err_msg = str(e).lower()
            if "max retries exceeded" in err_msg or "name or service not known" in err_msg or "getaddrinfo" in err_msg:
                raise LLMException("Local Model Error: Your network is blocking Hugging Face (huggingface.co). Please connect to a VPN just for the initial model download.")
            raise LLMException(f"Local Client Error: {str(e)}")

    @classmethod
    def call(
        cls,
        config: ModelConfig,
        system_prompt: str,
        messages: List[Message],
    ) -> Tuple[str, int, int, float, float]:
        provider = config.provider.value if hasattr(config.provider, "value") else str(config.provider)
        if provider == "groq":
            return cls.call_groq(config, system_prompt, messages)
        elif provider == "local":
            return cls.call_local_inference(config, system_prompt, messages)
        else:
            raise LLMException(f"Unknown provider '{provider}'.")
