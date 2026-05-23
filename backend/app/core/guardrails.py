import re

class GuardrailManager:
    # A simple keyword-based input scanner for demonstration
    UNSAFE_PATTERNS = [
        r"\b(hotwir\w+)\b",
        r"\b(hack\w*)\b",
        r"\b(poison)\b",
        r"\b(flood\w*)\b",
        r"\b(bypass)\b"
    ]

    @classmethod
    def check_input(cls, text: str) -> bool:
        text_lower = text.lower()
        for pattern in cls.UNSAFE_PATTERNS:
            if re.search(pattern, text_lower):
                return False  # Failed guardrail
        return True

    @classmethod
    def check_output(cls, text: str) -> bool:
        # A simple check for output safety
        if "I cannot fulfill this request" in text:
            return True
        return True
