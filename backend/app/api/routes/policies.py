from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.travel_policy import TravelPolicy
from app.schemas.policy import TravelPolicyCreate, TravelPolicyRead, TravelPolicyUpdate

router = APIRouter()


def _serialize(policy: TravelPolicy) -> TravelPolicyRead:
    return TravelPolicyRead(
        id=policy.id,
        company_id=policy.company_id,
        budget_limit=policy.budget_limit,
        max_hotel_nightly_rate=policy.max_hotel_nightly_rate,
        preferred_carriers=[item.strip() for item in policy.preferred_carriers.split(",") if item.strip()],
        allowed_cabin_classes=[item.strip() for item in policy.allowed_cabin_classes.split(",") if item.strip()],
        rail_enabled=policy.rail_enabled,
        hotel_enabled=policy.hotel_enabled,
        created_at=policy.created_at,
        updated_at=policy.updated_at,
    )


@router.get("/", response_model=list[TravelPolicyRead])
def list_policies(db: Session = Depends(get_db)) -> list[TravelPolicyRead]:
    policies = db.query(TravelPolicy).order_by(TravelPolicy.company_id.asc()).all()
    return [_serialize(policy) for policy in policies]


@router.get("/{company_id}", response_model=TravelPolicyRead)
def get_policy(company_id: int, db: Session = Depends(get_db)) -> TravelPolicyRead:
    policy = db.query(TravelPolicy).filter(TravelPolicy.company_id == company_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return _serialize(policy)


@router.post("/", response_model=TravelPolicyRead, status_code=status.HTTP_201_CREATED)
def create_policy(payload: TravelPolicyCreate, db: Session = Depends(get_db)) -> TravelPolicyRead:
    existing = db.query(TravelPolicy).filter(TravelPolicy.company_id == payload.company_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Policy already exists for company")
    policy = TravelPolicy(
        company_id=payload.company_id,
        budget_limit=payload.budget_limit,
        max_hotel_nightly_rate=payload.max_hotel_nightly_rate,
        preferred_carriers=",".join(payload.preferred_carriers),
        allowed_cabin_classes=",".join(payload.allowed_cabin_classes),
        rail_enabled=payload.rail_enabled,
        hotel_enabled=payload.hotel_enabled,
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return _serialize(policy)


@router.put("/{company_id}", response_model=TravelPolicyRead)
def update_policy(company_id: int, payload: TravelPolicyUpdate, db: Session = Depends(get_db)) -> TravelPolicyRead:
    policy = db.query(TravelPolicy).filter(TravelPolicy.company_id == company_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    policy.budget_limit = payload.budget_limit
    policy.max_hotel_nightly_rate = payload.max_hotel_nightly_rate
    policy.preferred_carriers = ",".join(payload.preferred_carriers)
    policy.allowed_cabin_classes = ",".join(payload.allowed_cabin_classes)
    policy.rail_enabled = payload.rail_enabled
    policy.hotel_enabled = payload.hotel_enabled
    db.commit()
    db.refresh(policy)
    return _serialize(policy)
