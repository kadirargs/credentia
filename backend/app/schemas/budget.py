from pydantic import BaseModel, Field


class BudgetBase(BaseModel):
    category_id: int = Field(gt=0)
    limit_amount: float = Field(gt=0)
    month: int = Field(ge=1, le=12)
    year: int = Field(ge=2000, le=2100)


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BudgetBase):
    pass


class BudgetRead(BudgetBase):
    id: int
    category_name: str
    category_color: str
    spent_amount: float
    remaining_amount: float
    usage_percentage: float

    model_config = {"from_attributes": True}


class BudgetSummary(BaseModel):
    limit_amount: float
    spent_amount: float
    remaining_amount: float
    usage_percentage: float
    month: int
    year: int
