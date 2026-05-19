from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import get_optional_current_user, resolve_company_scope
from app.models.company import Company
from app.models.user import User
from app.schemas.company import CompanyCreate, CompanyRead

router = APIRouter()


@router.get("/", response_model=list[CompanyRead])
def list_companies(
    company_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
) -> list[Company]:
    scope_company_id = resolve_company_scope(company_id, current_user)
    query = db.query(Company)
    if scope_company_id is not None:
        query = query.filter(Company.id == scope_company_id)
    return query.order_by(Company.name.asc()).all()


@router.post("/", response_model=CompanyRead, status_code=status.HTTP_201_CREATED)
def create_company(payload: CompanyCreate, db: Session = Depends(get_db)) -> Company:
    existing = db.query(Company).filter(Company.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Company already exists")
    company = Company(**payload.model_dump())
    db.add(company)
    db.commit()
    db.refresh(company)
    return company
