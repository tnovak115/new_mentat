from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CompanyBase(BaseModel):
    name: str


class CompanyCreate(CompanyBase):
    pass


class CompanyRead(CompanyBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
