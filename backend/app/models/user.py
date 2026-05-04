from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, event
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="traveler", nullable=False)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    company = relationship("Company", back_populates="users")


@event.listens_for(User, "before_insert")
def populate_legacy_auth_fields(mapper, connection, target: User) -> None:  # type: ignore[no-untyped-def]
    if not target.username:
        prefix = (target.email or target.name or "user").split("@")[0].strip().lower()
        target.username = prefix.replace(" ", ".")
    if not target.password_hash:
        target.password_hash = "legacy_login_disabled"
