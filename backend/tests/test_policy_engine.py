from datetime import date

from app.models.travel_policy import TravelPolicy
from app.models.trip_request import TripRequest
from app.providers.mock_travel import ProviderTripOption
from app.services.policy_engine import PolicyEngine


def test_policy_engine_flags_budget_and_cabin_violations() -> None:
    policy = TravelPolicy(
        company_id=1,
        budget_limit=500,
        max_hotel_nightly_rate=250,
        preferred_carriers="SkyBridge Air",
        allowed_cabin_classes="economy",
        rail_enabled=True,
        hotel_enabled=False,
    )
    trip = TripRequest(
        traveler_name="Robin",
        origin="SFO",
        destination="SEA",
        departure_date=date(2026, 5, 1),
        return_date=date(2026, 5, 3),
        preferred_arrival_deadline="11:00",
        budget_cap=450,
        optimization_preference="balanced",
        policy_preferences="",
        company_id=1,
        status="submitted",
    )
    option = ProviderTripOption(
        provider="MockAir",
        mode="flight",
        carrier="GlobalJet",
        cabin_class="business",
        total_cost=900,
        total_duration_minutes=180,
        convenience_score=9.0,
        departure_time="08:00",
        arrival_time="11:00",
        stops=0,
    )

    result = PolicyEngine().evaluate_option(policy, trip, option)

    assert result.compliant is False
    assert "Exceeds budget limit" in result.flags
    assert "Cabin class not allowed" in result.flags
    assert "Non-preferred carrier" in result.flags


def test_policy_engine_allows_compliant_train_option() -> None:
    policy = TravelPolicy(
        company_id=1,
        budget_limit=1200,
        max_hotel_nightly_rate=250,
        preferred_carriers="NorthLine Rail",
        allowed_cabin_classes="standard,first",
        rail_enabled=True,
        hotel_enabled=False,
    )
    trip = TripRequest(
        traveler_name="Robin",
        origin="SFO",
        destination="SEA",
        departure_date=date(2026, 5, 1),
        return_date=date(2026, 5, 3),
        preferred_arrival_deadline="11:00",
        budget_cap=1200,
        optimization_preference="balanced",
        policy_preferences="",
        company_id=1,
        status="submitted",
    )
    option = ProviderTripOption(
        provider="RailFlow",
        mode="train",
        carrier="NorthLine Rail",
        cabin_class="standard",
        total_cost=320,
        total_duration_minutes=320,
        convenience_score=7.5,
        departure_time="07:00",
        arrival_time="12:20",
        stops=0,
    )

    result = PolicyEngine().evaluate_option(policy, trip, option)

    assert result.compliant is True
    assert result.flags == []
    assert result.score == 1.0
