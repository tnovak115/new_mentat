from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.approval import ApprovalDecisionRequest
from app.schemas.trip import (
    TripOptionSelectionRequest,
    TripRequestCreate,
    TripRequestRead,
    TripSubmissionResponse,
)
from app.schemas.traveler import TripTravelerProfileUpdate
from app.services.trip_service import TripService

router = APIRouter()
trip_service = TripService()


@router.get("/", response_model=list[TripRequestRead])
def list_trips(db: Session = Depends(get_db)) -> list[TripRequestRead]:
    return trip_service.list_trips(db)


@router.get("/{trip_id}", response_model=TripRequestRead)
def get_trip(trip_id: int, db: Session = Depends(get_db)) -> TripRequestRead:
    trip = trip_service.get_trip(db, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.post("/", response_model=TripSubmissionResponse, status_code=status.HTTP_201_CREATED)
def create_trip(payload: TripRequestCreate, db: Session = Depends(get_db)) -> TripSubmissionResponse:
    try:
        return trip_service.create_trip_request(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{trip_id}/select", response_model=TripRequestRead)
def select_trip_option(
    trip_id: int,
    payload: TripOptionSelectionRequest,
    db: Session = Depends(get_db),
) -> TripRequestRead:
    try:
        return trip_service.select_trip_option(db, trip_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{trip_id}/approve", response_model=TripRequestRead)
def approve_trip(
    trip_id: int,
    payload: ApprovalDecisionRequest | None = None,
    db: Session = Depends(get_db),
) -> TripRequestRead:
    try:
        return trip_service.approve_trip(db, trip_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{trip_id}/reject", response_model=TripRequestRead)
def reject_trip(
    trip_id: int,
    payload: ApprovalDecisionRequest | None = None,
    db: Session = Depends(get_db),
) -> TripRequestRead:
    try:
        return trip_service.reject_trip(db, trip_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put("/{trip_id}/traveler-profile", response_model=TripRequestRead)
def update_traveler_profile(
    trip_id: int,
    payload: TripTravelerProfileUpdate,
    db: Session = Depends(get_db),
) -> TripRequestRead:
    try:
        return trip_service.update_traveler_profile(db, trip_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
