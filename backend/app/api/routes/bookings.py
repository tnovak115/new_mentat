from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_optional_current_user, resolve_company_scope
from app.db.session import get_db
from app.models.user import User
from app.schemas.booking import AssistedFulfillmentComplete, AssistedFulfillmentRequest, BookingRead
from app.schemas.trip import TripRequestRead
from app.services.booking_service import BookingService

router = APIRouter()
booking_service = BookingService()


@router.get("/{booking_id}", response_model=BookingRead)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
) -> BookingRead:
    booking = booking_service.get_booking(db, booking_id)
    scope_company_id = resolve_company_scope(None, current_user)
    if not booking or (scope_company_id is not None and booking.trip_request.company_id != scope_company_id):
        raise HTTPException(status_code=404, detail="Booking not found")
    return BookingRead(
        id=booking.id,
        trip_request_id=booking.trip_request_id,
        trip_option_id=booking.trip_option_id,
        status=booking.status,
        fulfillment_method=booking.fulfillment_method,
        confirmation_code=booking.confirmation_code,
        provider_record_locator=booking.provider_record_locator,
        fulfillment_requested_at=booking.fulfillment_requested_at,
        fulfilled_by=booking.fulfilled_by,
        fulfillment_notes=booking.fulfillment_notes,
        failure_reason=booking.failure_reason,
        booked_at=booking.booked_at,
        created_at=booking.created_at,
        updated_at=booking.updated_at,
    )


@router.post("/{booking_id}/confirm", response_model=TripRequestRead)
def confirm_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
) -> TripRequestRead:
    try:
        _ensure_booking_access(db, booking_id, resolve_company_scope(None, current_user))
        return booking_service.confirm_booking(db, booking_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{booking_id}/request-fulfillment", response_model=TripRequestRead)
def request_assisted_fulfillment(
    booking_id: int,
    payload: AssistedFulfillmentRequest | None = None,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
) -> TripRequestRead:
    try:
        _ensure_booking_access(db, booking_id, resolve_company_scope(None, current_user))
        return booking_service.request_assisted_fulfillment(db, booking_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{booking_id}/complete-fulfillment", response_model=TripRequestRead)
def complete_assisted_fulfillment(
    booking_id: int,
    payload: AssistedFulfillmentComplete | None = None,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
) -> TripRequestRead:
    try:
        _ensure_booking_access(db, booking_id, resolve_company_scope(None, current_user))
        return booking_service.complete_assisted_fulfillment(db, booking_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


def _ensure_booking_access(db: Session, booking_id: int, company_id: int | None) -> None:
    if company_id is None:
        return
    booking = booking_service.get_booking(db, booking_id)
    if not booking or booking.trip_request.company_id != company_id:
        raise HTTPException(status_code=404, detail="Booking not found")
