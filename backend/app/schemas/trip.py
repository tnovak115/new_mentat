from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.schemas.approval import ApprovalRequestRead
from app.schemas.booking import BookingRead
from app.schemas.traveler import TravelerProfileInput, TravelerProfileRead


class TripRequestCreate(BaseModel):
    traveler_name: str
    company_id: int
    origin: str = Field(min_length=3, max_length=10)
    destination: str = Field(min_length=3, max_length=10)
    departure_date: date
    return_date: date
    preferred_arrival_deadline: str
    budget_cap: float
    policy_preferences: str = ""
    optimization_preference: str = "balanced"
    submitted_by_user_id: int | None = None
    traveler_profile: TravelerProfileInput | None = None

    @field_validator("origin", "destination")
    @classmethod
    def normalize_airport_codes(cls, value: str) -> str:
        return value.strip().upper()

    @field_validator("optimization_preference")
    @classmethod
    def validate_optimization_preference(cls, value: str) -> str:
        allowed = {"cheapest", "fastest", "balanced"}
        if value not in allowed:
            raise ValueError(f"Optimization preference must be one of: {', '.join(sorted(allowed))}")
        return value

    @model_validator(mode="after")
    def validate_dates_and_route(self) -> "TripRequestCreate":
        if self.origin == self.destination:
            raise ValueError("Origin and destination must be different")
        if self.return_date < self.departure_date:
            raise ValueError("Return date must be on or after departure date")
        return self


class TripOptionRead(BaseModel):
    id: int
    provider: str
    mode: str
    carrier: str
    cabin_class: str
    total_cost: float
    total_duration_minutes: int
    convenience_score: float
    policy_compliant: bool
    policy_flags: list[str]
    metadata: dict[str, Any]


class RecommendationRead(BaseModel):
    id: int
    rank: int
    score: float
    projected_savings: float
    rationale: str
    option: TripOptionRead


class TripOptionSelectionRequest(BaseModel):
    trip_option_id: int


class TripRequestRead(BaseModel):
    id: int
    traveler_name: str
    company_id: int
    origin: str
    destination: str
    departure_date: date
    return_date: date
    preferred_arrival_deadline: str
    budget_cap: float
    policy_preferences: str
    optimization_preference: str
    status: str
    created_at: datetime
    traveler_profile: TravelerProfileRead | None = None
    approval_request: ApprovalRequestRead | None = None
    selected_option: TripOptionRead | None = None
    booking: BookingRead | None = None
    recommendations: list[RecommendationRead]

    model_config = ConfigDict(from_attributes=True)


class TripSearchSummary(BaseModel):
    total_options: int
    cheapest_option_cost: float
    top_recommendation_score: float


class TripSubmissionResponse(BaseModel):
    trip: TripRequestRead
    summary: TripSearchSummary
