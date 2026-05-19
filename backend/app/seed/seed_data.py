from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy import or_, select

from app import models  # noqa: F401
from app.core.security import hash_password
from app.db.session import Base, SessionLocal, engine
from app.models.company import Company
from app.models.travel_policy import TravelPolicy
from app.models.trip_request import TripRequest
from app.models.user import User
from app.schemas.approval import ApprovalDecisionRequest
from app.schemas.booking import AssistedFulfillmentRequest
from app.schemas.traveler import TravelerProfileInput
from app.schemas.trip import TripOptionSelectionRequest, TripRequestCreate
from app.services.booking_service import BookingService
from app.services.trip_service import TripService


DEMO_COMPANY = "Northstar Advisory"
DEMO_USERNAME = "travel-admin"
DEMO_PASSWORD = "password123"


def reset_demo_data() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    seed(force=True)


def seed(force: bool = False) -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        existing_company = db.scalar(select(Company).where(Company.name == DEMO_COMPANY))
        if existing_company and not force:
            existing_admin = db.scalar(
                select(User).where(or_(User.username == DEMO_USERNAME, User.email == "avery@northstar.example"))
            )
            existing_trips = db.query(TripRequest).filter(TripRequest.company_id == existing_company.id).count()
            if existing_admin and existing_trips >= 4:
                return
            company = existing_company
        else:
            company = Company(
                name=DEMO_COMPANY,
                employee_count=420,
                primary_location="San Francisco, CA",
                default_currency="USD",
                travel_manager_name="Avery Chen",
                travel_manager_email="travel@northstar.example",
                travel_program_notes=(
                    "Consulting teams travel heavily between SF, NYC, Chicago, Austin, and Seattle. "
                    "Finance prioritizes lowest compliant fare unless arrival timing affects client meetings."
                ),
            )
            db.add(company)
            db.flush()

        company.employee_count = company.employee_count or 420
        company.primary_location = company.primary_location or "San Francisco, CA"
        company.default_currency = company.default_currency or "USD"
        company.travel_manager_name = company.travel_manager_name or "Avery Chen"
        company.travel_manager_email = company.travel_manager_email or "travel@northstar.example"

        admin = db.scalar(select(User).where(or_(User.username == DEMO_USERNAME, User.email == "avery@northstar.example")))
        if not admin:
            admin = User(
                username=DEMO_USERNAME,
                password_hash=hash_password(DEMO_PASSWORD),
                name="Avery Chen",
                email="avery@northstar.example",
                role="admin",
                company_id=company.id,
            )
            db.add(admin)
        else:
            admin.username = DEMO_USERNAME
            admin.password_hash = hash_password(DEMO_PASSWORD)
            admin.role = "admin"
        policy = db.scalar(select(TravelPolicy).where(TravelPolicy.company_id == company.id))
        if not policy:
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
        db.refresh(admin)

        existing_trips = db.query(TripRequest).filter(TripRequest.company_id == company.id).count()
        if existing_trips >= 4:
            return

        _seed_trip_flow(
            company_id=company.id,
            user_id=admin.id,
            traveler_name="Maya Patel",
            email="maya.patel@northstar.example",
            phone="415-555-0134",
            origin="SFO",
            destination="JFK",
            days_out=14,
            budget_cap=1250,
            preference="balanced",
            notes="Client kickoff at 3 PM local time. Avoid late arrival if savings are marginal.",
            flow="booked",
        )
        _seed_trip_flow(
            company_id=company.id,
            user_id=admin.id,
            traveler_name="Jordan Ellis",
            email="jordan.ellis@northstar.example",
            phone="312-555-0198",
            origin="ORD",
            destination="LGA",
            days_out=19,
            budget_cap=900,
            preference="cheapest",
            notes="Internal workshop; cost is more important than total duration.",
            flow="approval",
            choose_noncompliant=True,
        )
        _seed_trip_flow(
            company_id=company.id,
            user_id=admin.id,
            traveler_name="Priya Shah",
            email="priya.shah@northstar.example",
            phone="206-555-0177",
            origin="SEA",
            destination="AUS",
            days_out=27,
            budget_cap=1100,
            preference="fastest",
            notes="Needs travel desk support to apply negotiated fare code.",
            flow="fulfillment",
        )
        _seed_trip_flow(
            company_id=company.id,
            user_id=admin.id,
            traveler_name="Ethan Brooks",
            email="ethan.brooks@northstar.example",
            phone="646-555-0142",
            origin="BOS",
            destination="SFO",
            days_out=33,
            budget_cap=1500,
            preference="balanced",
            notes="Board meeting travel. Optimize for arrival before dinner.",
            flow="options",
        )


def _seed_trip_flow(
    *,
    company_id: int,
    user_id: int,
    traveler_name: str,
    email: str,
    phone: str,
    origin: str,
    destination: str,
    days_out: int,
    budget_cap: float,
    preference: str,
    notes: str,
    flow: str,
    choose_noncompliant: bool = False,
) -> None:
    trip_service = TripService()
    booking_service = BookingService()
    departure = date.today() + timedelta(days=days_out)
    payload = TripRequestCreate(
        traveler_name=traveler_name,
        company_id=company_id,
        origin=origin,
        destination=destination,
        departure_date=departure,
        return_date=departure + timedelta(days=3),
        preferred_arrival_deadline="15:00",
        budget_cap=budget_cap,
        policy_preferences=notes,
        optimization_preference=preference,
        submitted_by_user_id=user_id,
        traveler_profile=TravelerProfileInput(
            email=email,
            phone=phone,
            date_of_birth=date(1988, 5, 12),
            known_traveler_number="KTN123456",
            loyalty_program="SkyBridge Rewards",
            loyalty_number=f"NS{user_id}{days_out}",
            seat_preference="Aisle",
        ),
    )

    with SessionLocal() as db:
        submission = trip_service.create_trip_request(db, payload)
        trip = db.get(TripRequest, submission.trip.id)
        assert trip is not None

        if flow == "options":
            return

        options = sorted(trip.options, key=lambda option: option.total_cost)
        selected = next((option for option in options if not option.policy_compliant), None) if choose_noncompliant else None
        selected = selected or next((option for option in options if option.policy_compliant), options[0])
        trip_after_selection = trip_service.select_trip_option(
            db,
            trip.id,
            TripOptionSelectionRequest(trip_option_id=selected.id),
        )

        if flow == "approval":
            return

        if trip_after_selection.status == "pending_approval":
            trip_after_selection = trip_service.approve_trip(
                db,
                trip.id,
                ApprovalDecisionRequest(
                    approver_name="Avery Chen",
                    approver_notes="Approved for client-impacting timing.",
                ),
            )

        booking = db.get(TripRequest, trip_after_selection.id).booking
        assert booking is not None
        if flow == "fulfillment":
            booking_service.request_assisted_fulfillment(
                db,
                booking.id,
                AssistedFulfillmentRequest(fulfillment_notes="Apply negotiated consulting fare before ticketing."),
            )
            return

        booking_service.confirm_booking(db, booking.id)


if __name__ == "__main__":
    seed()
