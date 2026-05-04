from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CompanyBase(BaseModel):
    name: str
    employee_count: int | None = None
    primary_location: str | None = None
    default_currency: str | None = None
    travel_manager_name: str | None = None
    travel_manager_email: str | None = None
    travel_program_notes: str | None = None


class CompanyCreate(CompanyBase):
    pass


class CompanyRead(CompanyBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
