from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class TripOption(Base):
    __tablename__ = "trip_options"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    trip_request_id: Mapped[int] = mapped_column(ForeignKey("trip_requests.id"), nullable=False)
    provider: Mapped[str] = mapped_column(String(100), nullable=False)
    mode: Mapped[str] = mapped_column(String(50), nullable=False)
    carrier: Mapped[str] = mapped_column(String(100), nullable=False)
    cabin_class: Mapped[str] = mapped_column(String(50), nullable=False)
    total_cost: Mapped[float] = mapped_column(Float, nullable=False)
    total_duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    convenience_score: Mapped[float] = mapped_column(Float, nullable=False)
    policy_compliant: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    policy_flags: Mapped[str] = mapped_column(Text, default="", nullable=False)
    metadata_json: Mapped[str] = mapped_column(Text, default="{}", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    trip_request = relationship("TripRequest", back_populates="options", foreign_keys=[trip_request_id])
    bookings = relationship("Booking", back_populates="trip_option")
    recommendations = relationship("Recommendation", back_populates="trip_option", cascade="all, delete-orphan")
