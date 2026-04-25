from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    trip_request_id: Mapped[int] = mapped_column(ForeignKey("trip_requests.id"), nullable=False, unique=True)
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    requested_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    approver_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    approver_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    requested_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    trip_request = relationship("TripRequest", back_populates="approval_request")
