from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.security import create_auth_token, hash_password, verify_password
from app.db.session import get_db
from app.models.company import Company
from app.models.user import User
from app.schemas.auth import AuthResponse, AuthUserRead, LoginRequest, SignupRequest

router = APIRouter()


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)) -> AuthResponse:
    normalized_username = payload.username.strip().lower()
    normalized_email = payload.email.strip().lower()
    company_name = payload.company_name.strip()

    existing_user = (
        db.query(User)
        .filter(or_(User.username == normalized_username, User.email == normalized_email))
        .first()
    )
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    existing_company = db.query(Company).filter(Company.name == company_name).first()
    if existing_company:
        raise HTTPException(status_code=400, detail="Company already exists")

    company = Company(
        name=company_name,
        employee_count=payload.employee_count,
        primary_location=payload.primary_location,
        default_currency=payload.default_currency,
        travel_manager_name=payload.travel_manager_name,
        travel_manager_email=payload.travel_manager_email,
        travel_program_notes=payload.travel_program_notes,
    )
    db.add(company)
    db.flush()

    user = User(
        username=normalized_username,
        password_hash=hash_password(payload.password),
        name=normalized_username,
        email=normalized_email,
        role="admin",
        company_id=company.id,
    )
    db.add(user)
    db.commit()
    db.refresh(company)
    db.refresh(user)
    return _auth_response(user, company)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    identifier = payload.username.strip().lower()
    user = db.query(User).filter(or_(User.username == identifier, User.email == identifier)).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    company = db.query(Company).filter(Company.id == user.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found for user")
    return _auth_response(user, company)


def _auth_response(user: User, company: Company) -> AuthResponse:
    return AuthResponse(
        user=AuthUserRead(
            id=user.id,
            username=user.username,
            name=user.name,
            email=user.email,
            role=user.role,
            company_id=user.company_id,
            created_at=user.created_at,
        ),
        company_id=company.id,
        company_name=company.name,
        access_token=create_auth_token(user),
    )
