from fastapi import APIRouter

from app.api.routes import admin, auth, bookings, companies, policies, trips

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(companies.router, prefix="/companies", tags=["companies"])
api_router.include_router(policies.router, prefix="/policies", tags=["policies"])
api_router.include_router(trips.router, prefix="/trips", tags=["trips"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["bookings"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
