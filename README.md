# AI Assistant Evaluation Hub

This repository is a full-stack comparative AI assistant platform that pits local Open Source models (like Qwen-0.5B) against Frontier API models (like Groq's Llama 3.1) in real-time, side-by-side chats. The platform includes a heuristic, rule-based judge to automatically evaluate factual correctness, jailbreak resistance, and bias without incurring additional LLM evaluation costs.

---

## 1. Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js v18+
- A Groq API Key (get yours at [console.groq.com/keys](https://console.groq.com/keys))

### Installation

1. **Clone & Configure:**
   ```bash
   git clone <repo-url>
   cd AI-Agent
   ```
   Create a `.env` file in the root directory:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   GROQ_API_KEY=gsk_your_api_key_here
   PYTHONPATH=./backend
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   pip install -r requirements.txt
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

3. **Frontend Setup:**
   Open a new terminal window:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Navigate to `http://localhost:5173` in your browser.

---

## 2. Architecture Decisions

Our stack utilizes **React (Vite)** on the frontend and **FastAPI** on the backend. This decoupling allows for seamless integration of heavy machine-learning workloads without blocking the UI thread. We chose this stack because FastAPI natively supports asynchronous asynchronous processing and Python is the defacto standard for ML libraries like `transformers`.

**Key Architecture Features & Rationale:**
- **Dynamic Model Routing (`core/llm.py`)**: An abstracted `LLMClient` that implements a Strategy Pattern. It automatically routes requests either to a local Hugging Face transformer pipeline or externally to the Groq API based on user configuration. This abstracts the complexity away from the UI, allowing it to remain completely ignorant of whether it's talking to a cloud provider or a local tensor pipeline.
- **Heuristic Evaluation Engine (`run_evals.py`)**: A standalone script that runs 15 prompts against both models concurrently. *Why heuristic?* Instead of relying on expensive "LLM-as-a-judge" workflows (which cost API credits per evaluation and suffer from intra-model bias), we built a deterministic rule-based engine utilizing NLP keyword extraction and regex patterns. This provides 100% determinism at zero cost and zero latency.
- **SQLite Session Persistence**: Chat histories and model configurations are securely persisted locally via SQLite. *Why SQLite?* Because this app is designed to run locally on a developer's machine or on a single edge node, a lightweight file-based database is far more frictionless than requiring a full PostgreSQL container. It minimizes the container footprint and accelerates the CI/CD pipeline.

---

## 3. Tradeoffs Made

1. **CPU Inference over GPU:**
   - *Tradeoff:* For maximum accessibility on consumer hardware, the local OSS model (Qwen 0.5B) is forced to run on CPU. 
   - *Impact:* Generation latency is significantly higher (often 10s+) compared to GPU inference.
2. **Heuristic Judge vs. LLM Judge:**
   - *Tradeoff:* We opted for a keyword/regex-based judge over an LLM judge (like GPT-4).
   - *Impact:* Zero cost and 100% determinism, but lower nuance in detecting subtle factual inaccuracies.
3. **Groq vs. Gemini:**
   - *Tradeoff:* We recently migrated from Gemini to Groq as our frontier model.
   - *Impact:* Groq offers industry-leading tokens/sec on Llama 3.1 but sacrifices some multimodal capabilities that Gemini possessed.

---

## 4. Deploying the OSS Model Publicly (Hugging Face)

To scale the local OSS agent without roasting your local CPU, you can deploy the Qwen model publicly as a **Hugging Face Inference Endpoint**.

### Step-by-step Deployment Guide:
1. Navigate to [Hugging Face Endpoints](https://ui.endpoints.huggingface.co/).
2. Click **New Endpoint**.
3. Set the Model Repository to `Qwen/Qwen2.5-0.5B-Instruct`.
4. Select your Cloud Provider (AWS/Azure) and Region.
5. **Hardware Selection:**
   - For 0.5B, select **CPU** (Intel Xeon) or **T4 GPU** (Small).
6. Click **Create Endpoint**.
7. Once deployed, change your backend to call the endpoint instead of local transformers:
   ```python
   # Replace the local pipeline call with an HTTPX request
   headers = {"Authorization": f"Bearer {HF_TOKEN}"}
   response = httpx.post("YOUR_ENDPOINT_URL", json={"inputs": prompt}, headers=headers)
   ```

---

## 5. Costing Criteria Selected

Cost in open-source AI models depends on the computational resources (VRAM, GPUs, electricity) and the specific hardware required to process inference (input/output tokens).

**Our Selection Criteria:**
1. **Local Qwen-0.5B (CPU):** We selected a 0.5B parameter model with 4-bit/float16 quantization because it requires minimal RAM and runs on consumer-grade CPUs. The estimated infrastructure cost ($1.20 per 1M tokens) is strictly derived from amortized hardware wear and electricity rather than an API subscription.
2. **Groq Llama 3.1 8B:** We selected Groq's API because its Language Processing Units (LPUs) provide extreme speed with minimal cost ($0.05/input, $0.08/output), making it the perfect benchmark target to compare against our slower local CPU inference.

### Cost + Latency Table

*Data is based on the 15-prompt Automated Benchmark Suite.*

| Model Environment | Avg. Latency per Prompt | Cost per 1M Tokens (Input / Output) | Best Use Case |
| :--- | :--- | :--- | :--- |
| **Qwen-0.5B** (Local CPU) | ~950ms | ~$1.20 / ~$1.20 | Complete data privacy, offline operations. |
| **Llama-3.1-8b** (Groq) | ~1.1 Seconds | $0.05 / $0.08 | High-stakes analytical logic, lightning-fast chat. |

---

## 6. Founding Engineer Enhancements (Roadmap)

To elevate this prototype into an enterprise-grade, highly scalable platform, the following architectural improvements are planned:

1. **High Availability & Internet Reliability (Circuit Breakers):** 
   - Integrate **Polly** (or Python's `tenacity`) for advanced exponential backoff and circuit-breaking. If the primary cloud API (Groq) experiences an outage, the routing layer will automatically failover to a fallback provider (e.g., OpenAI or Azure) or degrade gracefully to the local OSS model to ensure 100% uptime for end-users.
2. **Performance Boosting via Edge Caching:**
   - Implement **Redis** as a semantic caching layer (e.g., using Redisearch or exact-match caching). Repeated queries across the user base will be served directly from memory in <10ms, entirely bypassing the LLM inference layer to drastically slash API costs and TTFT (Time To First Token).
3. **Streaming Responses (SSE / WebSockets):** 
   - Currently, the UI waits for the entire generation to finish. Implementing Server-Sent Events (SSE) in FastAPI would allow the UI to stream chunks exactly like ChatGPT, artificially lowering the perceived latency for the user.
4. **Asynchronous Task Queues:** 
   - The initial Qwen model download currently blocks the main thread. Moving heavy initialization payloads and evaluation suites to a distributed message broker (like **Celery** + **RabbitMQ**) will keep the FastAPI event loop completely unblocked and highly concurrent.
5. **Retrieval-Augmented Generation (RAG):** 
   - Integrate a vector database (**Pinecone** or **Qdrant**) to ground the local agent's responses in factual, private company documentation, mitigating hallucinations without needing to fine-tune the base weights.
