from pydantic import BaseModel


class DashboardMetric(BaseModel):
    label: str
    value: str
    detail: str


class AdminTripRow(BaseModel):
    trip_id: int
    traveler_name: str
    route: str
    optimization_preference: str
    trip_status: str
    booking_status: str | None = None
    booking_reference: str | None = None
    recommended_mode: str
    recommended_carrier: str
    recommended_cost: float
    projected_savings: float
    policy_compliant: bool
    flags: list[str]


class AdminQueueRow(BaseModel):
    trip_id: int
    booking_id: int | None = None
    traveler_name: str
    route: str
    trip_status: str
    booking_status: str | None = None
    booking_reference: str | None = None
    fulfillment_method: str | None = None
    requested_reason: str | None = None
    fulfillment_requested_at: str | None = None
    action_label: str
    action_href: str


class AdminDashboardResponse(BaseModel):
    metrics: list[DashboardMetric]
    trips: list[AdminTripRow]
    approval_queue: list[AdminQueueRow]
    fulfillment_queue: list[AdminQueueRow]
