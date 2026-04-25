from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.company import Company
from app.schemas.company import CompanyCreate, CompanyRead

router = APIRouter()


@router.get("/", response_model=list[CompanyRead])
def list_companies(db: Session = Depends(get_db)) -> list[Company]:
    return db.query(Company).order_by(Company.name.asc()).all()


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
