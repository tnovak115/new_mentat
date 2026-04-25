from datetime import datetime

from pydantic import BaseModel


class AssistedFulfillmentRequest(BaseModel):
    fulfillment_notes: str | None = None


class AssistedFulfillmentComplete(BaseModel):
    confirmation_code: str | None = None
    provider_record_locator: str | None = None
    fulfilled_by: str | None = None
    fulfillment_notes: str | None = None


class BookingRead(BaseModel):
    id: int
    trip_request_id: int
    trip_option_id: int
    status: str
    fulfillment_method: str
    confirmation_code: str | None
    provider_record_locator: str | None
    fulfillment_requested_at: datetime | None
    fulfilled_by: str | None
    fulfillment_notes: str | None
    failure_reason: str | None
    booked_at: datetime | None
    created_at: datetime
    updated_at: datetime
