from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class TravelPolicyBase(BaseModel):
    budget_limit: float
    max_hotel_nightly_rate: float
    preferred_carriers: list[str]
    allowed_cabin_classes: list[str]
    rail_enabled: bool = True
    hotel_enabled: bool = False

    @field_validator("preferred_carriers", "allowed_cabin_classes")
    @classmethod
    def ensure_non_empty_values(cls, value: list[str]) -> list[str]:
        cleaned = [item.strip() for item in value if item.strip()]
        if not cleaned:
            raise ValueError("At least one value is required")
        return cleaned


class TravelPolicyCreate(TravelPolicyBase):
    company_id: int


class TravelPolicyUpdate(TravelPolicyBase):
    pass


class TravelPolicyRead(TravelPolicyBase):
    id: int
    company_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
