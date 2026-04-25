from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    trip_request_id: Mapped[int] = mapped_column(ForeignKey("trip_requests.id"), nullable=False, unique=True)
    trip_option_id: Mapped[int] = mapped_column(ForeignKey("trip_options.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="ready_to_book", nullable=False)
    fulfillment_method: Mapped[str] = mapped_column(String(50), default="direct", nullable=False)
    confirmation_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    provider_record_locator: Mapped[str | None] = mapped_column(String(100), nullable=True)
    fulfillment_requested_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    fulfilled_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    fulfillment_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    booked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    trip_request = relationship("TripRequest", back_populates="booking")
    trip_option = relationship("TripOption", back_populates="bookings")
