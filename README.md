# 🚀 AI Assistant Comparison Hub

[![Live Demo](https://img.shields.io/badge/Live_Demo-Deploy_on_Vercel-black?style=for-the-badge&logo=vercel)](https://ai-agent-comparision.vercel.app/)

**Live Frontend:** [https://ai-agent-comparision.vercel.app/](https://ai-agent-comparision.vercel.app/)

A full-stack, dual-agent platform designed to pit blazing-fast Frontier Models (Groq Llama 3.1) against privacy-first Open Source Models (Qwen-0.5B) in real-time.

---

## 🏗️ Architecture Decisions
We built this platform to be modular, fast, and completely stateless.

* **Dual-Environment Routing:** Using `VITE_API_BASE_URL`, the exact same codebase works on `localhost` and dynamically adapts when pushed to Vercel and Render. Zero configuration changes required.
* **Abstracted LLM Client:** The React frontend never knows where the AI lives. Our FastAPI backend intercepts requests and uses a Strategy Pattern to route them to either Groq Cloud or the Hugging Face Space.
* **Containerized OSS Model:** Instead of burning up local CPU cores, we wrapped the Open Source Qwen model into a FastAPI Docker container and deployed it publicly to Hugging Face Spaces.
* **Heuristic Evaluation Engine:** Rather than paying an LLM to evaluate another LLM, we built a 100% deterministic, rule-based NLP evaluator for our automated test suite.

---

## ⚖️ Tradeoffs Made
Engineering is about compromises. Here is what we prioritized:

* **Hugging Face Space vs. Local CPU:** Initially, the OSS model ran directly on the user's local machine. We traded this extreme offline privacy for a cloud-hosted Hugging Face endpoint to massively improve response times and prevent device freezing.
* **Heuristic Judge vs. LLM-as-a-Judge:** We chose a regex/keyword-based evaluation judge over an AI judge (like GPT-4). This gave us zero latency and zero cost, but we sacrificed the nuance required to detect extremely subtle hallucinations.
* **In-Memory State vs. Managed DB:** We chose lightweight, in-memory session tracking instead of PostgreSQL. This makes the repository incredibly easy for developers to clone and run (zero config), but means chat histories reset when the cloud server sleeps.

---

## 🏆 Bonus Points & Cost Criteria
We focused heavily on the **Bonus Points** outlined in the criteria by making the OSS model universally accessible and optimizing costs!

* **Public OSS Deployment:** We achieved true cloud parity. The open-source model isn't just a local script—it's a production-ready, public API running on a **Hugging Face Space**.
* **Zero-Cost Cloud Scaling:** The entire production stack (Vercel Frontend, Render Backend, Hugging Face Space API) runs flawlessly on free-tier infrastructure. Total server cost: **$0.00/month**.
* **API Cost Economics:** Groq's Llama 3.1 model costs just `$0.05` per 1M input tokens. Our local/HF OSS model is completely free to query.

---

## ⚡ What I Would Improve With More Time
If given another week to focus purely on performance and capabilities:

* **Internet Access (Tool Calling):** I would inject search APIs (like DuckDuckGo or Google Custom Search) into the backend so the AI agents could fetch real-time data instead of relying on stale pre-trained weights.
* **Semantic Redis Caching:** If 1,000 users ask the same prompt, we shouldn't run inference 1,000 times. I would add Redis to cache semantic responses, slashing latency to <5ms and saving massive API costs.
* **SSE Response Streaming:** Currently, the UI waits for the entire generation block to finish. I would implement Server-Sent Events (SSE) so the React UI types out the response word-by-word, drastically lowering the perceived Time-To-First-Token.
* **Persistent Database (Supabase):** I would migrate the in-memory session manager to Supabase/PostgreSQL so users never lose their chat histories across server reboots.

---

## 🛠️ Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js v18+
- Groq API Key

### 1. Clone & Configure
```bash
git clone <repo-url>
cd AI-Agent
```
Create a `.env` file in the root directory:
```env
VITE_API_BASE_URL=http://localhost:8000/api
GROQ_API_KEY=gsk_your_api_key_here
HF_SPACE_URL=https://prit12-qwen-0-5b-api-space.hf.space
PYTHONPATH=./backend
```

### 2. Run the Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Run the Frontend
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:5173` in your browser!
