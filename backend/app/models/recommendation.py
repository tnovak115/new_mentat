from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    trip_request_id: Mapped[int] = mapped_column(ForeignKey("trip_requests.id"), nullable=False)
    trip_option_id: Mapped[int] = mapped_column(ForeignKey("trip_options.id"), nullable=False)
    rank: Mapped[int] = mapped_column(Integer, nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    projected_savings: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    rationale: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    trip_request = relationship("TripRequest", back_populates="recommendations")
    trip_option = relationship("TripOption", back_populates="recommendations")
