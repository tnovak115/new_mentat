from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    users = relationship("User", back_populates="company", cascade="all, delete-orphan")
    travel_policy = relationship("TravelPolicy", back_populates="company", uselist=False, cascade="all, delete-orphan")
    traveler_profiles = relationship("TravelerProfile", back_populates="company", cascade="all, delete-orphan")
    trip_requests = relationship("TripRequest", back_populates="company", cascade="all, delete-orphan")
