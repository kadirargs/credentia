from pydantic import BaseModel, Field, field_validator

from app.models.transaction import TransactionType


class CategoryBase(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    type: TransactionType = TransactionType.expense
    color: str = Field(default="#2F80ED", max_length=20)

    @field_validator("name", mode="before")
    @classmethod
    def strip_name(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator("color", mode="before")
    @classmethod
    def strip_color(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(CategoryBase):
    pass


class CategoryRead(CategoryBase):
    id: int

    model_config = {"from_attributes": True}
