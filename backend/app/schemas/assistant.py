from typing import Any, Literal

from pydantic import BaseModel, Field


AssistantRole = Literal["user", "assistant"]


class AssistantMessage(BaseModel):
    role: AssistantRole
    content: str = Field(..., min_length=1, max_length=2000)


class AssistantAskRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1200)
    year: int = Field(..., ge=2000, le=2100)
    month: int = Field(..., ge=1, le=12)
    history: list[AssistantMessage] = Field(default_factory=list, max_length=10)


class AssistantAskResponse(BaseModel):
    answer: str
    usedData: dict[str, Any]
    disclaimer: str
