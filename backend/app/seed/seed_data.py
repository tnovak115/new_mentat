from sqlalchemy import select

from app import models  # noqa: F401
from app.db.session import Base, SessionLocal, engine
from app.models.company import Company
from app.models.travel_policy import TravelPolicy
from app.models.user import User


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        existing_company = db.scalar(select(Company).where(Company.name == "Northstar Advisory"))
        if existing_company:
            return

        company = Company(name="Northstar Advisory")
        db.add(company)
        db.flush()
        db.add(
            User(
                name="Avery Chen",
                email="avery@northstar.example",
                role="admin",
                company_id=company.id,
            )
        )
        db.add(
            TravelPolicy(
                company_id=company.id,
                budget_limit=1400,
                max_hotel_nightly_rate=275,
                preferred_carriers="SkyBridge Air,NorthLine Rail",
                allowed_cabin_classes="economy,standard,first",
                rail_enabled=True,
                hotel_enabled=False,
            )
        )
        db.commit()


if __name__ == "__main__":
    seed()
