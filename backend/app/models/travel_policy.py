from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class TravelPolicy(Base):
    __tablename__ = "travel_policies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), nullable=False, unique=True)
    budget_limit: Mapped[float] = mapped_column(Float, default=1200.0, nullable=False)
    max_hotel_nightly_rate: Mapped[float] = mapped_column(Float, default=250.0, nullable=False)
    preferred_carriers: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    allowed_cabin_classes: Mapped[str] = mapped_column(String(255), default="economy,premium_economy", nullable=False)
    rail_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    hotel_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    company = relationship("Company", back_populates="travel_policy")
