from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.assistant.service import (
    AssistantConfigurationError,
    AssistantProviderError,
    DISCLAIMER,
    build_assistant_answer,
)
from app.schemas.assistant import AssistantAskRequest, AssistantAskResponse
from app.services.single_user import ensure_single_user

router = APIRouter()


@router.post("/ask", response_model=AssistantAskResponse)
def ask_assistant(payload: AssistantAskRequest, db: Session = Depends(get_db)) -> AssistantAskResponse:
    user = ensure_single_user(db)

    try:
        answer, used_data = build_assistant_answer(
            db=db,
            user_id=user.id,
            message=payload.message,
            year=payload.year,
            month=payload.month,
            history=payload.history,
        )
    except AssistantConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Assistant is not configured",
        ) from exc
    except AssistantProviderError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Assistant response is unavailable",
        ) from exc

    return AssistantAskResponse(
        answer=answer,
        usedData=used_data,
        disclaimer=DISCLAIMER,
    )
