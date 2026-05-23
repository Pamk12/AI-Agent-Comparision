import uuid
from datetime import datetime
from typing import Dict, List, Optional
from ..schemas import ModelConfig, Message, SessionResponse

class ChatSession:
    def __init__(self, id: str, name: str, config: ModelConfig):
        self.id = id
        self.name = name
        self.config = config
        self.messages: List[Message] = []
        self.user_facts: List[str] = []
        self.created_at = datetime.now()

class SessionManager:
    def __init__(self):
        self.sessions: Dict[str, ChatSession] = {}

    def create_session(self, name: Optional[str], config: ModelConfig) -> ChatSession:
        sid = str(uuid.uuid4())
        sname = name or f"Session {len(self.sessions) + 1}"
        session = ChatSession(id=sid, name=sname, config=config)
        self.sessions[sid] = session
        return session

    def get_session(self, session_id: str) -> Optional[ChatSession]:
        return self.sessions.get(session_id)

    def delete_session(self, session_id: str) -> bool:
        if session_id in self.sessions:
            del self.sessions[session_id]
            return True
        return False

    def list_sessions(self) -> List[SessionResponse]:
        res = []
        # sort by created_at descending
        sorted_sessions = sorted(self.sessions.values(), key=lambda x: x.created_at, reverse=True)
        for s in sorted_sessions:
            res.append(SessionResponse(
                id=s.id,
                name=s.name,
                config=s.config,
                messages=s.messages,
                user_facts=s.user_facts
            ))
        return res

    def add_message(self, session_id: str, message: Message):
        session = self.get_session(session_id)
        if session:
            session.messages.append(message)

    def get_context(self, session_id: str, k: int = 5) -> List[Message]:
        session = self.get_session(session_id)
        if not session:
            return []
        
        context_msgs = []
        for msg in reversed(session.messages):
            if msg.in_context:
                context_msgs.insert(0, msg)
            if len(context_msgs) >= k * 2:
                break
        return context_msgs

session_manager = SessionManager()
