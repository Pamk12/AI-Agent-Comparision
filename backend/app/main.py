from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from typing import List, Dict, Any
import os
from dotenv import load_dotenv

# Load .env from project root
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.env"))
load_dotenv(env_path)

from .schemas import SessionCreate, SessionResponse, ChatRequest, ChatResponse, ObservabilityLog
from .core.memory import session_manager
from .core.agent import AgentExecutor

app = FastAPI(title="AI Personal Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

observability_logs: List[ObservabilityLog] = []

@app.get("/api/sessions", response_model=List[SessionResponse])
def get_sessions():
    return session_manager.list_sessions()

@app.post("/api/sessions", response_model=SessionResponse)
def create_session(req: SessionCreate):
    try:
        return session_manager.create_session(req.name, req.config)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/sessions/{session_id}")
def delete_session(session_id: str):
    try:
        if session_manager.delete_session(session_id):
            return {"status": "deleted"}
        raise HTTPException(status_code=404, detail="Session not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sessions/{session_id}/chat", response_model=ChatResponse)
def chat(session_id: str, req: ChatRequest):
    try:
        res = AgentExecutor.run(session_id, req.message)
        session = session_manager.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Log observability
        observability_logs.append(ObservabilityLog(
            timestamp=datetime.now().isoformat(),
            session_id=session_id,
            provider=session.config.provider.value,
            model_name=session.config.modelName or session.config.provider.value,
            latency_ms=res.latency_ms,
            tokens_in=res.input_tokens,
            tokens_out=res.output_tokens,
            cost=res.cost,
            prompt=req.message,
            response=res.reply,
            safety_triggered=res.safety_triggered
        ))
        
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/observability", response_model=List[ObservabilityLog])
def get_observability():
    return observability_logs

from pydantic import BaseModel
from typing import Optional

class EvalRequest(BaseModel):
    groqApiKey: Optional[str] = None

@app.post("/api/eval/run")
def run_evals(req: EvalRequest):
    # This imports the script from the root
    import sys, os
    root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
    if root_path not in sys.path:
        sys.path.append(root_path)
    
    try:
        from run_evals import run_evaluation_suite
        stats = run_evaluation_suite(
            groq_key=req.groqApiKey or os.getenv("GROQ_API_KEY", "")
        )
        return {"status": "success", "metrics": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/eval/report")
def download_report():
    from fastapi.responses import FileResponse
    import os
    path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../evaluation_report.pdf"))
    if os.path.exists(path):
        return FileResponse(path, filename="evaluation_report.pdf")
    raise HTTPException(status_code=404, detail="Report not found")
