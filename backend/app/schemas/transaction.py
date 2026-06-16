from datetime import date

from pydantic import BaseModel, Field, field_validator

from app.models.transaction import TransactionType


class TransactionBase(BaseModel):
    type: TransactionType
    amount: float = Field(gt=0)
    occurred_on: date
    description: str = Field(default="", max_length=255)

    @field_validator("description", mode="before")
    @classmethod
    def strip_description(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class TransactionPayload(TransactionBase):
    category_id: int = Field(gt=0)


class TransactionCreate(TransactionPayload):
    pass


class TransactionUpdate(TransactionPayload):
    pass


class TransactionBulkDelete(BaseModel):
    ids: list[int] = Field(min_length=1)


class TransactionRead(TransactionBase):
    id: int
    category_id: int | None = None

    model_config = {"from_attributes": True}
