import json
from datetime import datetime

from sqlalchemy.orm import Session, joinedload

from app.models.approval_request import ApprovalRequest
from app.models.audit_log import AuditLog
from app.models.booking import Booking
from app.models.company import Company
from app.models.recommendation import Recommendation
from app.models.travel_policy import TravelPolicy
from app.models.traveler_profile import TravelerProfile
from app.models.trip_option import TripOption
from app.models.trip_request import TripRequest
from app.providers.mock_travel import MockTravelProviderAdapter
from app.schemas.approval import ApprovalDecisionRequest, ApprovalRequestRead
from app.schemas.booking import BookingRead
from app.schemas.traveler import TravelerProfileInput, TravelerProfileRead, TripTravelerProfileUpdate
from app.schemas.trip import (
    RecommendationRead,
    TripOptionRead,
    TripOptionSelectionRequest,
    TripRequestCreate,
    TripRequestRead,
    TripSearchSummary,
    TripSubmissionResponse,
)
from app.services.policy_engine import PolicyEngine
from app.services.recommendation_engine import RecommendationEngine


class TripService:
    def __init__(self) -> None:
        self.provider = MockTravelProviderAdapter()
        self.policy_engine = PolicyEngine()
        self.recommendation_engine = RecommendationEngine()

    def create_trip_request(self, db: Session, payload: TripRequestCreate) -> TripSubmissionResponse:
        company = db.get(Company, payload.company_id)
        if not company:
            raise ValueError("Company not found")

        policy = db.query(TravelPolicy).filter(TravelPolicy.company_id == payload.company_id).first()
        if not policy:
            raise ValueError("Travel policy not found for company")

        traveler_profile = self._upsert_traveler_profile(
            db,
            company_id=payload.company_id,
            traveler_name=payload.traveler_name,
            profile_payload=payload.traveler_profile,
        )

        trip_payload = payload.model_dump(exclude={"traveler_profile"})
        trip_request = TripRequest(
            **trip_payload,
            traveler_profile_id=traveler_profile.id if traveler_profile else None,
            status="options_ready",
        )
        db.add(trip_request)
        db.flush()

        provider_options = self.provider.search(
            payload.origin,
            payload.destination,
            payload.departure_date,
            payload.return_date,
        )

        policy_evaluations = [
            (option, self.policy_engine.evaluate_option(policy, trip_request, option))
            for option in provider_options
        ]
        scored_options = self.recommendation_engine.score_options(
            policy_evaluations, payload.optimization_preference
        )

        persisted_options: list[TripOption] = []
        for scored in scored_options:
            option = TripOption(
                trip_request_id=trip_request.id,
                provider=scored.option.provider,
                mode=scored.option.mode,
                carrier=scored.option.carrier,
                cabin_class=scored.option.cabin_class,
                total_cost=scored.option.total_cost,
                total_duration_minutes=scored.option.total_duration_minutes,
                convenience_score=scored.option.convenience_score,
                policy_compliant=scored.policy_evaluation.compliant,
                policy_flags=json.dumps(scored.policy_evaluation.flags),
                metadata_json=json.dumps(
                    {
                        "departure_time": scored.option.departure_time,
                        "arrival_time": scored.option.arrival_time,
                        "stops": scored.option.stops,
                    }
                ),
            )
            db.add(option)
            db.flush()
            persisted_options.append(option)

        option_lookup = {
            (
                option.provider,
                option.mode,
                option.carrier,
                option.cabin_class,
                option.total_cost,
                option.total_duration_minutes,
            ): option
            for option in persisted_options
        }

        for idx, scored in enumerate(scored_options[:3], start=1):
            matching_option = option_lookup[
                (
                    scored.option.provider,
                    scored.option.mode,
                    scored.option.carrier,
                    scored.option.cabin_class,
                    scored.option.total_cost,
                    scored.option.total_duration_minutes,
                )
            ]
            db.add(
                Recommendation(
                    trip_request_id=trip_request.id,
                    trip_option_id=matching_option.id,
                    rank=idx,
                    score=scored.total_score,
                    projected_savings=scored.projected_savings,
                    rationale=scored.rationale,
                )
            )

        db.add(
            AuditLog(
                entity_type="trip_request",
                entity_id=trip_request.id,
                action="created",
                summary=f"Trip created for {trip_request.traveler_name} from {trip_request.origin} to {trip_request.destination}",
                actor_user_id=trip_request.submitted_by_user_id,
            )
        )

        db.commit()
        hydrated_trip = self.get_trip(db, trip_request.id)
        assert hydrated_trip is not None
        return TripSubmissionResponse(
            trip=hydrated_trip,
            summary=TripSearchSummary(
                total_options=len(provider_options),
                cheapest_option_cost=min(option.total_cost for option in provider_options),
                top_recommendation_score=hydrated_trip.recommendations[0].score if hydrated_trip.recommendations else 0.0,
            ),
        )

    def list_trips(self, db: Session, company_id: int | None = None) -> list[TripRequestRead]:
        query = (
            db.query(TripRequest)
            .options(
                joinedload(TripRequest.recommendations).joinedload(Recommendation.trip_option),
                joinedload(TripRequest.traveler_profile),
                joinedload(TripRequest.approval_request),
                joinedload(TripRequest.selected_trip_option),
                joinedload(TripRequest.booking),
            )
        )
        if company_id is not None:
            query = query.filter(TripRequest.company_id == company_id)
        trips = query.order_by(TripRequest.created_at.desc()).all()
        return [self._serialize_trip(trip) for trip in trips]

    def get_trip(self, db: Session, trip_id: int, company_id: int | None = None) -> TripRequestRead | None:
        query = (
            db.query(TripRequest)
            .options(
                joinedload(TripRequest.recommendations).joinedload(Recommendation.trip_option),
                joinedload(TripRequest.traveler_profile),
                joinedload(TripRequest.approval_request),
                joinedload(TripRequest.selected_trip_option),
                joinedload(TripRequest.booking),
            )
            .filter(TripRequest.id == trip_id)
        )
        if company_id is not None:
            query = query.filter(TripRequest.company_id == company_id)
        trip = query.first()
        if not trip:
            return None
        return self._serialize_trip(trip)

    def select_trip_option(
        self,
        db: Session,
        trip_id: int,
        payload: TripOptionSelectionRequest,
    ) -> TripRequestRead:
        trip = (
            db.query(TripRequest)
            .options(
                joinedload(TripRequest.options),
                joinedload(TripRequest.booking),
                joinedload(TripRequest.approval_request),
            )
            .filter(TripRequest.id == trip_id)
            .first()
        )
        if not trip:
            raise ValueError("Trip not found")
        if trip.status == "booked":
            raise ValueError("Trip has already been booked")

        selected_option = next((option for option in trip.options if option.id == payload.trip_option_id), None)
        if not selected_option:
            raise ValueError("Trip option not found")

        requires_approval = not selected_option.policy_compliant
        trip.selected_trip_option_id = selected_option.id
        trip.status = "pending_approval" if requires_approval else "approved"

        if trip.booking:
            trip.booking.trip_option_id = selected_option.id
            trip.booking.status = "pending_approval" if requires_approval else "ready_to_book"
            trip.booking.fulfillment_method = "direct"
            trip.booking.confirmation_code = None
            trip.booking.provider_record_locator = None
            trip.booking.fulfillment_requested_at = None
            trip.booking.fulfilled_by = None
            trip.booking.fulfillment_notes = None
            trip.booking.failure_reason = None
            trip.booking.booked_at = None
        else:
            db.add(
                Booking(
                    trip_request_id=trip.id,
                    trip_option_id=selected_option.id,
                    status="pending_approval" if requires_approval else "ready_to_book",
                )
            )

        if requires_approval:
            requested_reason = ", ".join(json.loads(selected_option.policy_flags or "[]")) or "Policy exception requires review"
            if trip.approval_request:
                trip.approval_request.status = "pending"
                trip.approval_request.requested_reason = requested_reason
                trip.approval_request.approver_name = None
                trip.approval_request.approver_notes = None
                trip.approval_request.requested_at = datetime.utcnow()
                trip.approval_request.decided_at = None
            else:
                db.add(
                    ApprovalRequest(
                        trip_request_id=trip.id,
                        status="pending",
                        requested_reason=requested_reason,
                    )
                )
        elif trip.approval_request:
            db.delete(trip.approval_request)

        db.add(
            AuditLog(
                entity_type="trip_request",
                entity_id=trip.id,
                action="option_selected",
                summary=f"Selected option {selected_option.id} for trip {trip.id}",
                actor_user_id=trip.submitted_by_user_id,
            )
        )
        if requires_approval:
            db.add(
                AuditLog(
                    entity_type="trip_request",
                    entity_id=trip.id,
                    action="approval_requested",
                    summary=f"Trip {trip.id} requires approval before booking",
                    actor_user_id=trip.submitted_by_user_id,
                )
            )

        db.commit()
        hydrated_trip = self.get_trip(db, trip.id)
        assert hydrated_trip is not None
        return hydrated_trip

    def update_traveler_profile(
        self,
        db: Session,
        trip_id: int,
        payload: TripTravelerProfileUpdate,
    ) -> TripRequestRead:
        trip = (
            db.query(TripRequest)
            .options(joinedload(TripRequest.traveler_profile))
            .filter(TripRequest.id == trip_id)
            .first()
        )
        if not trip:
            raise ValueError("Trip not found")
        if trip.status == "booked":
            raise ValueError("Traveler details cannot be edited after booking")

        trip.traveler_name = payload.traveler_name
        traveler_profile = self._upsert_traveler_profile(
            db,
            company_id=trip.company_id,
            traveler_name=payload.traveler_name,
            profile_payload=payload.traveler_profile,
            existing_profile=trip.traveler_profile,
        )
        trip.traveler_profile_id = traveler_profile.id if traveler_profile else None

        db.add(
            AuditLog(
                entity_type="trip_request",
                entity_id=trip.id,
                action="traveler_profile_updated",
                summary=f"Traveler profile updated for trip {trip.id}",
                actor_user_id=trip.submitted_by_user_id,
            )
        )
        db.commit()
        hydrated_trip = self.get_trip(db, trip.id)
        assert hydrated_trip is not None
        return hydrated_trip

    def approve_trip(
        self,
        db: Session,
        trip_id: int,
        payload: ApprovalDecisionRequest | None = None,
    ) -> TripRequestRead:
        trip = (
            db.query(TripRequest)
            .options(
                joinedload(TripRequest.booking),
                joinedload(TripRequest.selected_trip_option),
                joinedload(TripRequest.approval_request),
            )
            .filter(TripRequest.id == trip_id)
            .first()
        )
        if not trip:
            raise ValueError("Trip not found")
        if not trip.booking or not trip.selected_trip_option_id:
            raise ValueError("Trip does not have a selected option")
        if trip.status != "pending_approval":
            raise ValueError("Trip is not pending approval")

        trip.status = "approved"
        trip.booking.status = "ready_to_book"
        trip.booking.failure_reason = None
        if trip.approval_request:
            trip.approval_request.status = "approved"
            trip.approval_request.approver_name = self._clean_optional(payload.approver_name) if payload else None
            trip.approval_request.approver_notes = self._clean_optional(payload.approver_notes) if payload else None
            trip.approval_request.decided_at = datetime.utcnow()

        db.add(
            AuditLog(
                entity_type="trip_request",
                entity_id=trip.id,
                action="approved",
                summary=f"Approval granted for trip {trip.id}",
                actor_user_id=trip.submitted_by_user_id,
            )
        )
        db.commit()
        hydrated_trip = self.get_trip(db, trip.id)
        assert hydrated_trip is not None
        return hydrated_trip

    def reject_trip(
        self,
        db: Session,
        trip_id: int,
        payload: ApprovalDecisionRequest | None = None,
    ) -> TripRequestRead:
        trip = (
            db.query(TripRequest)
            .options(
                joinedload(TripRequest.booking),
                joinedload(TripRequest.selected_trip_option),
                joinedload(TripRequest.approval_request),
            )
            .filter(TripRequest.id == trip_id)
            .first()
        )
        if not trip:
            raise ValueError("Trip not found")
        if not trip.booking or not trip.selected_trip_option_id:
            raise ValueError("Trip does not have a selected option")
        if trip.status != "pending_approval":
            raise ValueError("Trip is not pending approval")

        selected_option_id = trip.selected_trip_option_id
        trip.selected_trip_option_id = None
        trip.status = "options_ready"
        db.delete(trip.booking)
        if trip.approval_request:
            trip.approval_request.status = "rejected"
            trip.approval_request.approver_name = self._clean_optional(payload.approver_name) if payload else None
            trip.approval_request.approver_notes = self._clean_optional(payload.approver_notes) if payload else None
            trip.approval_request.decided_at = datetime.utcnow()

        db.add(
            AuditLog(
                entity_type="trip_request",
                entity_id=trip.id,
                action="rejected",
                summary=f"Approval rejected for trip {trip.id}; option {selected_option_id} cleared",
                actor_user_id=trip.submitted_by_user_id,
            )
        )
        db.commit()
        hydrated_trip = self.get_trip(db, trip.id)
        assert hydrated_trip is not None
        return hydrated_trip

    def _serialize_trip(self, trip: TripRequest) -> TripRequestRead:
        ordered_recommendations = sorted(trip.recommendations, key=lambda rec: rec.rank)
        return TripRequestRead(
            id=trip.id,
            traveler_name=trip.traveler_name,
            company_id=trip.company_id,
            origin=trip.origin,
            destination=trip.destination,
            departure_date=trip.departure_date,
            return_date=trip.return_date,
            preferred_arrival_deadline=trip.preferred_arrival_deadline,
            budget_cap=trip.budget_cap,
            policy_preferences=trip.policy_preferences,
            optimization_preference=trip.optimization_preference,
            status=trip.status,
            created_at=trip.created_at,
            traveler_profile=self._serialize_traveler_profile(trip.traveler_profile) if trip.traveler_profile else None,
            approval_request=self._serialize_approval_request(trip.approval_request) if trip.approval_request else None,
            selected_option=self._serialize_option(trip.selected_trip_option) if trip.selected_trip_option else None,
            booking=self._serialize_booking(trip.booking) if trip.booking else None,
            recommendations=[
                RecommendationRead(
                    id=rec.id,
                    rank=rec.rank,
                    score=rec.score,
                    projected_savings=rec.projected_savings,
                    rationale=rec.rationale,
                    option=self._serialize_option(rec.trip_option),
                )
                for rec in ordered_recommendations
            ],
        )

    def _serialize_option(self, option: TripOption) -> TripOptionRead:
        return TripOptionRead(
            id=option.id,
            provider=option.provider,
            mode=option.mode,
            carrier=option.carrier,
            cabin_class=option.cabin_class,
            total_cost=option.total_cost,
            total_duration_minutes=option.total_duration_minutes,
            convenience_score=option.convenience_score,
            policy_compliant=option.policy_compliant,
            policy_flags=json.loads(option.policy_flags or "[]"),
            metadata=json.loads(option.metadata_json or "{}"),
        )

    def _serialize_booking(self, booking: Booking) -> BookingRead:
        return BookingRead(
            id=booking.id,
            trip_request_id=booking.trip_request_id,
            trip_option_id=booking.trip_option_id,
            status=booking.status,
            fulfillment_method=booking.fulfillment_method,
            confirmation_code=booking.confirmation_code,
            provider_record_locator=booking.provider_record_locator,
            fulfillment_requested_at=booking.fulfillment_requested_at,
            fulfilled_by=booking.fulfilled_by,
            fulfillment_notes=booking.fulfillment_notes,
            failure_reason=booking.failure_reason,
            booked_at=booking.booked_at,
            created_at=booking.created_at,
            updated_at=booking.updated_at,
        )

    def _serialize_traveler_profile(self, profile: TravelerProfile) -> TravelerProfileRead:
        return TravelerProfileRead(
            id=profile.id,
            company_id=profile.company_id,
            traveler_name=profile.traveler_name,
            email=profile.email,
            phone=profile.phone,
            date_of_birth=profile.date_of_birth,
            known_traveler_number=profile.known_traveler_number,
            loyalty_program=profile.loyalty_program,
            loyalty_number=profile.loyalty_number,
            seat_preference=profile.seat_preference,
            created_at=profile.created_at,
            updated_at=profile.updated_at,
        )

    def _serialize_approval_request(self, approval_request: ApprovalRequest) -> ApprovalRequestRead:
        return ApprovalRequestRead(
            id=approval_request.id,
            trip_request_id=approval_request.trip_request_id,
            status=approval_request.status,
            requested_reason=approval_request.requested_reason,
            approver_name=approval_request.approver_name,
            approver_notes=approval_request.approver_notes,
            requested_at=approval_request.requested_at,
            decided_at=approval_request.decided_at,
            created_at=approval_request.created_at,
            updated_at=approval_request.updated_at,
        )

    def _upsert_traveler_profile(
        self,
        db: Session,
        company_id: int,
        traveler_name: str,
        profile_payload: TravelerProfileInput | None,
        existing_profile: TravelerProfile | None = None,
    ) -> TravelerProfile | None:
        if not profile_payload:
            return existing_profile

        email = profile_payload.email.strip().lower() if profile_payload.email else None
        profile = existing_profile
        if profile is None and email:
            profile = (
                db.query(TravelerProfile)
                .filter(
                    TravelerProfile.company_id == company_id,
                    TravelerProfile.email == email,
                )
                .first()
            )

        if profile is None:
            profile = TravelerProfile(company_id=company_id, traveler_name=traveler_name)
            db.add(profile)

        profile.traveler_name = traveler_name
        profile.email = email
        profile.phone = self._clean_optional(profile_payload.phone)
        profile.date_of_birth = profile_payload.date_of_birth
        profile.known_traveler_number = self._clean_optional(profile_payload.known_traveler_number)
        profile.loyalty_program = self._clean_optional(profile_payload.loyalty_program)
        profile.loyalty_number = self._clean_optional(profile_payload.loyalty_number)
        profile.seat_preference = self._clean_optional(profile_payload.seat_preference)
        db.flush()
        return profile

    def _clean_optional(self, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None
