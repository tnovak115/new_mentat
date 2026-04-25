from dataclasses import dataclass

from app.providers.mock_travel import ProviderTripOption
from app.services.policy_engine import PolicyEvaluation


@dataclass
class ScoredOption:
    option: ProviderTripOption
    total_score: float
    projected_savings: float
    rationale: str
    policy_evaluation: PolicyEvaluation


class RecommendationEngine:
    def score_options(
        self,
        options: list[tuple[ProviderTripOption, PolicyEvaluation]],
        optimization_preference: str,
    ) -> list[ScoredOption]:
        if not options:
            return []

        min_cost = min(item[0].total_cost for item in options)
        max_cost = max(item[0].total_cost for item in options)
        min_duration = min(item[0].total_duration_minutes for item in options)
        max_duration = max(item[0].total_duration_minutes for item in options)
        weights = self._get_weights(optimization_preference)

        scored: list[ScoredOption] = []
        for option, policy_eval in options:
            cost_score = self._invert_normalized(option.total_cost, min_cost, max_cost)
            duration_score = self._invert_normalized(option.total_duration_minutes, min_duration, max_duration)
            convenience_score = option.convenience_score / 10.0
            total_score = (
                cost_score * weights["cost"]
                + duration_score * weights["duration"]
                + policy_eval.score * weights["policy"]
                + convenience_score * weights["convenience"]
            )

            rationale_parts = []
            if cost_score > 0.75:
                rationale_parts.append("strong on price")
            if duration_score > 0.75:
                rationale_parts.append("time efficient")
            if policy_eval.compliant:
                rationale_parts.append("fully policy compliant")
            else:
                rationale_parts.append("policy exception requires review")
            if convenience_score > 0.8:
                rationale_parts.append("high convenience")

            rationale = ", ".join(rationale_parts) if rationale_parts else "balanced tradeoff across cost and time"
            scored.append(
                ScoredOption(
                    option=option,
                    total_score=round(total_score, 4),
                    projected_savings=round(max_cost - option.total_cost, 2),
                    rationale=rationale,
                    policy_evaluation=policy_eval,
                )
            )

        # In a corporate travel workflow, compliant options should be prioritized
        # ahead of non-compliant ones when both are available.
        return sorted(
            scored,
            key=lambda item: (item.policy_evaluation.compliant, item.total_score),
            reverse=True,
        )

    def _get_weights(self, optimization_preference: str) -> dict[str, float]:
        presets = {
            "cheapest": {"cost": 0.45, "duration": 0.2, "policy": 0.2, "convenience": 0.15},
            "fastest": {"cost": 0.15, "duration": 0.45, "policy": 0.2, "convenience": 0.2},
            "balanced": {"cost": 0.3, "duration": 0.3, "policy": 0.2, "convenience": 0.2},
        }
        return presets.get(optimization_preference, presets["balanced"])

    def _invert_normalized(self, value: float, minimum: float, maximum: float) -> float:
        if maximum == minimum:
            return 1.0
        return 1.0 - ((value - minimum) / (maximum - minimum))
