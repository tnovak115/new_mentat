from dataclasses import dataclass

from app.models.travel_policy import TravelPolicy
from app.models.trip_request import TripRequest
from app.providers.mock_travel import ProviderTripOption


@dataclass
class PolicyEvaluation:
    compliant: bool
    flags: list[str]
    score: float


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


class PolicyEngine:
    def evaluate_option(
        self,
        policy: TravelPolicy,
        trip_request: TripRequest,
        option: ProviderTripOption,
    ) -> PolicyEvaluation:
        flags: list[str] = []

        if option.total_cost > min(policy.budget_limit, trip_request.budget_cap):
            flags.append("Exceeds budget limit")

        allowed_cabin_classes = _split_csv(policy.allowed_cabin_classes)
        if allowed_cabin_classes and option.cabin_class not in allowed_cabin_classes:
            flags.append("Cabin class not allowed")

        preferred_carriers = _split_csv(policy.preferred_carriers)
        if preferred_carriers and option.carrier not in preferred_carriers:
            flags.append("Non-preferred carrier")

        if option.mode == "train" and not policy.rail_enabled:
            flags.append("Rail not allowed by policy")

        compliance_score = max(0.0, 1.0 - (0.25 * len(flags)))
        return PolicyEvaluation(compliant=len(flags) == 0, flags=flags, score=compliance_score)
