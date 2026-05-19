from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.config import settings
from app.core.security import get_optional_current_user, resolve_company_scope
from app.models.user import User
from app.seed.seed_data import DEMO_COMPANY, DEMO_PASSWORD, DEMO_USERNAME, reset_demo_data
from app.schemas.admin import AdminDashboardResponse
from app.services.admin_service import AdminService

router = APIRouter()
admin_service = AdminService()


@router.get("/dashboard", response_model=AdminDashboardResponse)
def get_dashboard(
    company_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
) -> AdminDashboardResponse:
    scope_company_id = resolve_company_scope(company_id, current_user)
    return admin_service.get_dashboard(db, scope_company_id)


@router.post("/reset-demo-data")
def reset_demo() -> dict[str, str]:
    if settings.app_env == "production":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Demo reset is disabled in production")
    reset_demo_data()
    return {
        "status": "reset",
        "company": DEMO_COMPANY,
        "username": DEMO_USERNAME,
        "password": DEMO_PASSWORD,
    }
