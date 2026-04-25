from datetime import datetime

from pydantic import BaseModel


class ApprovalDecisionRequest(BaseModel):
    approver_name: str | None = None
    approver_notes: str | None = None


class ApprovalRequestRead(BaseModel):
    id: int
    trip_request_id: int
    status: str
    requested_reason: str | None
    approver_name: str | None
    approver_notes: str | None
    requested_at: datetime
    decided_at: datetime | None
    created_at: datetime
    updated_at: datetime
