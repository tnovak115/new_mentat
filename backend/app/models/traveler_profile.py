from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class TravelerProfile(Base):
    __tablename__ = "traveler_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), nullable=False)
    traveler_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    known_traveler_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    loyalty_program: Mapped[str | None] = mapped_column(String(100), nullable=True)
    loyalty_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    seat_preference: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    company = relationship("Company", back_populates="traveler_profiles")
    trip_requests = relationship("TripRequest", back_populates="traveler_profile")
