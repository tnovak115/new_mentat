from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class TravelerProfileInput(BaseModel):
    email: str | None = None
    phone: str | None = None
    date_of_birth: date | None = None
    known_traveler_number: str | None = None
    loyalty_program: str | None = None
    loyalty_number: str | None = None
    seat_preference: str | None = None


class TravelerProfileRead(BaseModel):
    id: int
    company_id: int
    traveler_name: str
    email: str | None
    phone: str | None
    date_of_birth: date | None
    known_traveler_number: str | None
    loyalty_program: str | None
    loyalty_number: str | None
    seat_preference: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TripTravelerProfileUpdate(BaseModel):
    traveler_name: str
    traveler_profile: TravelerProfileInput
