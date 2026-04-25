from app.providers.mock_travel import ProviderTripOption
from app.services.policy_engine import PolicyEvaluation
from app.services.recommendation_engine import RecommendationEngine


def test_recommendation_engine_prefers_cheapest_when_requested() -> None:
    engine = RecommendationEngine()
    options = [
        (
            ProviderTripOption(
                provider="MockAir",
                mode="flight",
                carrier="SkyBridge Air",
                cabin_class="economy",
                total_cost=300,
                total_duration_minutes=240,
                convenience_score=8.2,
                departure_time="08:00",
                arrival_time="12:00",
                stops=0,
            ),
            PolicyEvaluation(compliant=True, flags=[], score=1.0),
        ),
        (
            ProviderTripOption(
                provider="MockAir",
                mode="flight",
                carrier="GlobalJet",
                cabin_class="economy",
                total_cost=700,
                total_duration_minutes=180,
                convenience_score=9.4,
                departure_time="09:00",
                arrival_time="12:00",
                stops=0,
            ),
            PolicyEvaluation(compliant=True, flags=[], score=1.0),
        ),
    ]

    scored = engine.score_options(options, "cheapest")

    assert scored[0].option.total_cost == 300


def test_recommendation_engine_penalizes_policy_issues() -> None:
    engine = RecommendationEngine()
    options = [
        (
            ProviderTripOption(
                provider="MockAir",
                mode="flight",
                carrier="GlobalJet",
                cabin_class="business",
                total_cost=280,
                total_duration_minutes=190,
                convenience_score=9.5,
                departure_time="09:00",
                arrival_time="12:10",
                stops=0,
            ),
            PolicyEvaluation(compliant=False, flags=["Cabin class not allowed"], score=0.75),
        ),
        (
            ProviderTripOption(
                provider="RailFlow",
                mode="train",
                carrier="NorthLine Rail",
                cabin_class="standard",
                total_cost=320,
                total_duration_minutes=240,
                convenience_score=8.1,
                departure_time="07:10",
                arrival_time="11:10",
                stops=0,
            ),
            PolicyEvaluation(compliant=True, flags=[], score=1.0),
        ),
    ]

    scored = engine.score_options(options, "balanced")

    assert scored[0].policy_evaluation.compliant is True
