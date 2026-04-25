from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.admin import AdminDashboardResponse
from app.services.admin_service import AdminService

router = APIRouter()
admin_service = AdminService()


@router.get("/dashboard", response_model=AdminDashboardResponse)
def get_dashboard(db: Session = Depends(get_db)) -> AdminDashboardResponse:
    return admin_service.get_dashboard(db)
