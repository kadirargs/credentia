from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth import AuthToken, UserCreate, UserLogin
from app.services.auth import login_user, register_user

router = APIRouter()


@router.post("/register", response_model=AuthToken, status_code=201)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> AuthToken:
    return register_user(db, payload)


@router.post("/login", response_model=AuthToken)
def login(payload: UserLogin, db: Session = Depends(get_db)) -> AuthToken:
    return login_user(db, payload)

