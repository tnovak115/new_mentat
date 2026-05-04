from datetime import datetime

from pydantic import BaseModel, Field


class SignupRequest(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=6, max_length=128)
    email: str
    company_name: str = Field(min_length=1, max_length=255)
    employee_count: int | None = None
    primary_location: str | None = None
    default_currency: str | None = "USD"
    travel_manager_name: str | None = None
    travel_manager_email: str | None = None
    travel_program_notes: str | None = None


class LoginRequest(BaseModel):
    username: str
    password: str


class AuthUserRead(BaseModel):
    id: int
    username: str
    name: str
    email: str
    role: str
    company_id: int
    created_at: datetime


class AuthResponse(BaseModel):
    user: AuthUserRead
    company_id: int
    company_name: str
