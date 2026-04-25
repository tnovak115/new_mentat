from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401
from app.db.session import Base, get_db
from app.main import app
from app.models.company import Company
from app.models.travel_policy import TravelPolicy
from app.models.user import User


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, class_=Session)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()

    company = Company(name="TestCo")
    session.add(company)
    session.flush()
    session.add(
        User(
            name="Taylor Admin",
            email="taylor@testco.example",
            role="admin",
            company_id=company.id,
        )
    )
    session.add(
        TravelPolicy(
            company_id=company.id,
            budget_limit=1200,
            max_hotel_nightly_rate=250,
            preferred_carriers="SkyBridge Air,NorthLine Rail",
            allowed_cabin_classes="economy,standard,first",
            rail_enabled=True,
            hotel_enabled=False,
        )
    )
    session.commit()

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
