from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class TripRequest(Base):
    __tablename__ = "trip_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    traveler_name: Mapped[str] = mapped_column(String(255), nullable=False)
    origin: Mapped[str] = mapped_column(String(10), nullable=False)
    destination: Mapped[str] = mapped_column(String(10), nullable=False)
    departure_date: Mapped[date] = mapped_column(Date, nullable=False)
    return_date: Mapped[date] = mapped_column(Date, nullable=False)
    preferred_arrival_deadline: Mapped[str] = mapped_column(String(50), nullable=False)
    budget_cap: Mapped[float] = mapped_column(Float, nullable=False)
    optimization_preference: Mapped[str] = mapped_column(String(50), default="balanced", nullable=False)
    policy_preferences: Mapped[str] = mapped_column(Text, default="", nullable=False)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), nullable=False)
    submitted_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    traveler_profile_id: Mapped[int | None] = mapped_column(ForeignKey("traveler_profiles.id"), nullable=True)
    selected_trip_option_id: Mapped[int | None] = mapped_column(ForeignKey("trip_options.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="options_ready", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    company = relationship("Company", back_populates="trip_requests")
    traveler_profile = relationship("TravelerProfile", back_populates="trip_requests")
    options = relationship(
        "TripOption",
        back_populates="trip_request",
        cascade="all, delete-orphan",
        foreign_keys="TripOption.trip_request_id",
    )
    selected_trip_option = relationship("TripOption", foreign_keys=[selected_trip_option_id], post_update=True)
    recommendations = relationship("Recommendation", back_populates="trip_request", cascade="all, delete-orphan")
    booking = relationship("Booking", back_populates="trip_request", uselist=False, cascade="all, delete-orphan")
    approval_request = relationship("ApprovalRequest", back_populates="trip_request", uselist=False, cascade="all, delete-orphan")
