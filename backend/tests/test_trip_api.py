from app.models.recommendation import Recommendation
from app.models.trip_option import TripOption
from app.models.trip_request import TripRequest


def test_trip_submission_returns_ranked_recommendations(client) -> None:
    payload = {
        "traveler_name": "Jordan Smith",
        "company_id": 1,
        "origin": "sfo",
        "destination": "sea",
        "departure_date": "2026-05-05",
        "return_date": "2026-05-07",
        "preferred_arrival_deadline": "11:00",
        "budget_cap": 1000,
        "policy_preferences": "Prefer morning departure",
        "optimization_preference": "balanced",
        "traveler_profile": {
            "email": "jordan@testco.example",
            "phone": "415-555-0101",
            "date_of_birth": "1990-02-14",
        },
    }

    response = client.post("/api/v1/trips/", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["trip"]["origin"] == "SFO"
    assert data["trip"]["status"] == "options_ready"
    assert data["trip"]["traveler_profile"]["email"] == "jordan@testco.example"
    assert len(data["trip"]["recommendations"]) == 3
    assert data["summary"]["total_options"] >= 3


def test_trip_submission_rejects_invalid_dates(client) -> None:
    payload = {
        "traveler_name": "Jordan Smith",
        "company_id": 1,
        "origin": "SFO",
        "destination": "SEA",
        "departure_date": "2026-05-09",
        "return_date": "2026-05-07",
        "preferred_arrival_deadline": "11:00",
        "budget_cap": 1000,
        "policy_preferences": "",
        "optimization_preference": "balanced",
        "traveler_profile": {
            "email": "jordan@testco.example",
            "phone": "415-555-0101",
            "date_of_birth": "1990-02-14",
        },
    }

    response = client.post("/api/v1/trips/", json=payload)

    assert response.status_code == 422


def test_trip_submission_persists_trip_related_records(client, db_session) -> None:
    payload = {
        "traveler_name": "Casey Lee",
        "company_id": 1,
        "origin": "LAX",
        "destination": "DEN",
        "departure_date": "2026-06-01",
        "return_date": "2026-06-03",
        "preferred_arrival_deadline": "13:00",
        "budget_cap": 900,
        "policy_preferences": "",
        "optimization_preference": "cheapest",
        "traveler_profile": {
            "email": "casey@testco.example",
            "phone": "303-555-0101",
            "date_of_birth": "1988-10-03",
        },
    }

    response = client.post("/api/v1/trips/", json=payload)

    assert response.status_code == 201
    trip_count = db_session.query(TripRequest).count()
    option_count = db_session.query(TripOption).count()
    recommendation_count = db_session.query(Recommendation).count()
    assert trip_count == 1
    assert option_count >= 3
    assert recommendation_count == 3


def test_select_compliant_option_creates_ready_booking(client) -> None:
    payload = {
        "traveler_name": "Jordan Smith",
        "company_id": 1,
        "origin": "SFO",
        "destination": "SEA",
        "departure_date": "2026-05-05",
        "return_date": "2026-05-07",
        "preferred_arrival_deadline": "11:00",
        "budget_cap": 1000,
        "policy_preferences": "Prefer morning departure",
        "optimization_preference": "balanced",
        "traveler_profile": {
            "email": "jordan@testco.example",
            "phone": "415-555-0101",
            "date_of_birth": "1990-02-14",
        },
    }

    created = client.post("/api/v1/trips/", json=payload).json()["trip"]
    option_id = created["recommendations"][0]["option"]["id"]

    response = client.post(f"/api/v1/trips/{created['id']}/select", json={"trip_option_id": option_id})

    assert response.status_code == 200
    data = response.json()
    assert data["selected_option"]["id"] == option_id
    assert data["status"] == "approved"
    assert data["booking"]["status"] == "ready_to_book"


def test_select_non_compliant_option_requires_approval_before_booking(client) -> None:
    payload = {
        "traveler_name": "Jordan Smith",
        "company_id": 1,
        "origin": "SFO",
        "destination": "SEA",
        "departure_date": "2026-05-05",
        "return_date": "2026-05-07",
        "preferred_arrival_deadline": "11:00",
        "budget_cap": 1000,
        "policy_preferences": "Prefer morning departure",
        "optimization_preference": "balanced",
        "traveler_profile": {
            "email": "jordan@testco.example",
            "phone": "415-555-0101",
            "date_of_birth": "1990-02-14",
        },
    }

    created = client.post("/api/v1/trips/", json=payload).json()["trip"]
    non_compliant_option = next(
        recommendation["option"]
        for recommendation in created["recommendations"]
        if recommendation["option"]["policy_compliant"] is False
    )

    selected = client.post(
        f"/api/v1/trips/{created['id']}/select",
        json={"trip_option_id": non_compliant_option["id"]},
    )

    assert selected.status_code == 200
    selected_data = selected.json()
    assert selected_data["status"] == "pending_approval"
    assert selected_data["booking"]["status"] == "pending_approval"
    assert selected_data["approval_request"]["status"] == "pending"

    blocked_confirmation = client.post(f"/api/v1/bookings/{selected_data['booking']['id']}/confirm")
    assert blocked_confirmation.status_code == 400

    approved = client.post(
        f"/api/v1/trips/{created['id']}/approve",
        json={"approver_name": "Taylor Admin", "approver_notes": "Approved for the client meeting."},
    )
    assert approved.status_code == 200
    approved_data = approved.json()
    assert approved_data["status"] == "approved"
    assert approved_data["booking"]["status"] == "ready_to_book"
    assert approved_data["approval_request"]["status"] == "approved"
    assert approved_data["approval_request"]["approver_name"] == "Taylor Admin"

    confirmed = client.post(f"/api/v1/bookings/{approved_data['booking']['id']}/confirm")
    assert confirmed.status_code == 200
    confirmed_data = confirmed.json()
    assert confirmed_data["status"] == "booked"
    assert confirmed_data["booking"]["status"] == "confirmed"
    assert confirmed_data["booking"]["confirmation_code"]


def test_booking_confirmation_requires_traveler_profile(client) -> None:
    payload = {
        "traveler_name": "Jordan Smith",
        "company_id": 1,
        "origin": "SFO",
        "destination": "SEA",
        "departure_date": "2026-05-05",
        "return_date": "2026-05-07",
        "preferred_arrival_deadline": "11:00",
        "budget_cap": 1000,
        "policy_preferences": "Prefer morning departure",
        "optimization_preference": "balanced",
    }

    created = client.post("/api/v1/trips/", json=payload).json()["trip"]
    option_id = created["recommendations"][0]["option"]["id"]
    selected = client.post(f"/api/v1/trips/{created['id']}/select", json={"trip_option_id": option_id}).json()

    response = client.post(f"/api/v1/bookings/{selected['booking']['id']}/confirm")

    assert response.status_code == 400
    assert "Traveler profile is required" in response.json()["detail"]


def test_assisted_fulfillment_flow_completes_booking(client) -> None:
    payload = {
        "traveler_name": "Jordan Smith",
        "company_id": 1,
        "origin": "SFO",
        "destination": "SEA",
        "departure_date": "2026-05-05",
        "return_date": "2026-05-07",
        "preferred_arrival_deadline": "11:00",
        "budget_cap": 1000,
        "policy_preferences": "Prefer morning departure",
        "optimization_preference": "balanced",
        "traveler_profile": {
            "email": "jordan@testco.example",
            "phone": "415-555-0101",
            "date_of_birth": "1990-02-14",
        },
    }

    created = client.post("/api/v1/trips/", json=payload).json()["trip"]
    option_id = created["recommendations"][0]["option"]["id"]
    selected = client.post(f"/api/v1/trips/{created['id']}/select", json={"trip_option_id": option_id}).json()

    requested = client.post(
        f"/api/v1/bookings/{selected['booking']['id']}/request-fulfillment",
        json={"fulfillment_notes": "Need an agent to finalize due to negotiated corporate rate."},
    )

    assert requested.status_code == 200
    requested_data = requested.json()
    assert requested_data["status"] == "booking_in_progress"
    assert requested_data["booking"]["status"] == "fulfillment_requested"
    assert requested_data["booking"]["fulfillment_method"] == "assisted"
    assert requested_data["booking"]["fulfillment_notes"] == "Need an agent to finalize due to negotiated corporate rate."

    completed = client.post(
        f"/api/v1/bookings/{selected['booking']['id']}/complete-fulfillment",
        json={
            "fulfilled_by": "Taylor Ops",
            "provider_record_locator": "OPS123",
            "fulfillment_notes": "Booked with the negotiated client-visit fare.",
        },
    )

    assert completed.status_code == 200
    completed_data = completed.json()
    assert completed_data["status"] == "booked"
    assert completed_data["booking"]["status"] == "confirmed"
    assert completed_data["booking"]["fulfillment_method"] == "assisted"
    assert completed_data["booking"]["fulfilled_by"] == "Taylor Ops"
    assert completed_data["booking"]["provider_record_locator"] == "OPS123"
    assert completed_data["booking"]["confirmation_code"]


def test_trip_traveler_profile_can_be_updated(client) -> None:
    payload = {
        "traveler_name": "Jordan Smith",
        "company_id": 1,
        "origin": "SFO",
        "destination": "SEA",
        "departure_date": "2026-05-05",
        "return_date": "2026-05-07",
        "preferred_arrival_deadline": "11:00",
        "budget_cap": 1000,
        "policy_preferences": "Prefer morning departure",
        "optimization_preference": "balanced",
    }

    created = client.post("/api/v1/trips/", json=payload).json()["trip"]

    response = client.put(
        f"/api/v1/trips/{created['id']}/traveler-profile",
        json={
            "traveler_name": "Jordan Smith",
            "traveler_profile": {
                "email": "jordan@testco.example",
                "phone": "415-555-0101",
                "date_of_birth": "1990-02-14",
                "seat_preference": "Aisle",
            },
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["traveler_profile"]["seat_preference"] == "Aisle"
    assert data["traveler_profile"]["email"] == "jordan@testco.example"
