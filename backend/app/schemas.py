from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from enum import Enum

class ModelProvider(str, Enum):
    GROQ = "groq"
    LOCAL = "local"

class ModelConfig(BaseModel):
    provider: ModelProvider = ModelProvider.GROQ
    apiKey: Optional[str] = None
    modelName: Optional[str] = None  # e.g., "llama-3.1-8b-instant" or "Qwen/Qwen3.6-27B"
    k: int = Field(default=5, ge=1, le=20)

class Message(BaseModel):
    role: str
    content: str
    timestamp: Optional[str] = None
    in_context: bool = True

class SessionCreate(BaseModel):
    name: Optional[str] = None
    config: ModelConfig

class SessionResponse(BaseModel):
    id: str
    name: str
    config: ModelConfig
    messages: List[Message]
    user_facts: List[str]

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str
    latency_ms: float
    input_tokens: int
    output_tokens: int
    cost: float
    in_context_messages: List[Message]
    user_facts: List[str]
    safety_triggered: bool

class ObservabilityLog(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    timestamp: str
    session_id: str
    provider: str
    model_name: str
    latency_ms: float
    tokens_in: int
    tokens_out: int
    cost: float
    prompt: str
    response: str
    safety_triggered: bool
    tool_calls: List[str] = []
