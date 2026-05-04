from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    employee_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    primary_location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    default_currency: Mapped[str | None] = mapped_column(String(10), nullable=True)
    travel_manager_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    travel_manager_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    travel_program_notes: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    users = relationship("User", back_populates="company", cascade="all, delete-orphan")
    travel_policy = relationship("TravelPolicy", back_populates="company", uselist=False, cascade="all, delete-orphan")
    traveler_profiles = relationship("TravelerProfile", back_populates="company", cascade="all, delete-orphan")
    trip_requests = relationship("TripRequest", back_populates="company", cascade="all, delete-orphan")
