from dataclasses import dataclass
from datetime import date


@dataclass
class ProviderTripOption:
    provider: str
    mode: str
    carrier: str
    cabin_class: str
    total_cost: float
    total_duration_minutes: int
    convenience_score: float
    departure_time: str
    arrival_time: str
    stops: int


class MockTravelProviderAdapter:
    def search(self, origin: str, destination: str, departure_date: date, return_date: date) -> list[ProviderTripOption]:
        city_pair_bias = (sum(ord(c) for c in origin + destination) % 50) + 1
        duration_bias = (departure_date.day + return_date.day) % 120

        return [
            ProviderTripOption(
                provider="MockAir",
                mode="flight",
                carrier="SkyBridge Air",
                cabin_class="economy",
                total_cost=420 + city_pair_bias,
                total_duration_minutes=210 + duration_bias,
                convenience_score=8.8,
                departure_time="07:15",
                arrival_time="11:05",
                stops=0,
            ),
            ProviderTripOption(
                provider="MockAir",
                mode="flight",
                carrier="GlobalJet",
                cabin_class="business",
                total_cost=980 + city_pair_bias,
                total_duration_minutes=180 + duration_bias,
                convenience_score=9.4,
                departure_time="09:00",
                arrival_time="12:30",
                stops=0,
            ),
            ProviderTripOption(
                provider="RailFlow",
                mode="train",
                carrier="NorthLine Rail",
                cabin_class="standard",
                total_cost=260 + city_pair_bias,
                total_duration_minutes=360 + duration_bias,
                convenience_score=7.6,
                departure_time="06:40",
                arrival_time="12:50",
                stops=1,
            ),
            ProviderTripOption(
                provider="RailFlow",
                mode="train",
                carrier="Express Continental",
                cabin_class="first",
                total_cost=530 + city_pair_bias,
                total_duration_minutes=300 + duration_bias,
                convenience_score=8.5,
                departure_time="08:10",
                arrival_time="13:45",
                stops=0,
            ),
        ]
