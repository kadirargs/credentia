from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User

SINGLE_USER_EMAIL = "single-user@credentia.local"


def ensure_single_user(db: Session) -> User:
    user = db.scalar(select(User).where(User.email == SINGLE_USER_EMAIL))
    if user:
        return user

    user = User(
        email=SINGLE_USER_EMAIL,
        full_name="Credentia User",
        password_hash="single-user-mode",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
