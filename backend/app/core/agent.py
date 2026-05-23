from datetime import datetime
from .memory import session_manager
from .llm import LLMClient
from .guardrails import GuardrailManager
from ..schemas import ChatResponse, Message

class AgentExecutor:
    SYSTEM_PROMPT = """You are a helpful AI personal assistant.
Answer the user's questions clearly and accurately.
Follow safety regulations and politely refuse harmful requests."""

    @classmethod
    def run(cls, session_id: str, user_text: str) -> ChatResponse:
        session = session_manager.get_session(session_id)
        if not session:
            raise ValueError("Session not found")

        # 1. Guardrails check
        if not GuardrailManager.check_input(user_text):
            reply_text = "I cannot fulfill this request as it violates safety guidelines."
            latency = 0.0
            tokens_in, tokens_out, cost = 0, 0, 0.0
            safety_triggered = True
        else:
            safety_triggered = False
            
            # Fetch context
            context_msgs = session_manager.get_context(session_id, k=session.config.k)
            # Add current user message
            current_msg = Message(
                role="user", 
                content=user_text, 
                timestamp=datetime.now().isoformat(),
                in_context=True
            )
            messages = context_msgs + [current_msg]
            
            # Call LLM
            reply_text, tokens_in, tokens_out, cost, latency = LLMClient.call(
                config=session.config,
                system_prompt=cls.SYSTEM_PROMPT,
                messages=messages
            )

        # 2. Save memory
        user_msg = Message(
            role="user", 
            content=user_text, 
            timestamp=datetime.now().isoformat(),
            in_context=not safety_triggered
        )
        assistant_msg = Message(
            role="assistant", 
            content=reply_text, 
            timestamp=datetime.now().isoformat(),
            in_context=not safety_triggered
        )
        session_manager.add_message(session_id, user_msg)
        session_manager.add_message(session_id, assistant_msg)

        return ChatResponse(
            reply=reply_text,
            latency_ms=latency * 1000,
            input_tokens=tokens_in,
            output_tokens=tokens_out,
            cost=cost,
            in_context_messages=session.messages,
            user_facts=session.user_facts,
            safety_triggered=safety_triggered
        )
