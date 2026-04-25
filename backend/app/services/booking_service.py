from datetime import datetime
import random
import string

from sqlalchemy.orm import Session, joinedload

from app.models.audit_log import AuditLog
from app.models.booking import Booking
from app.schemas.booking import AssistedFulfillmentComplete, AssistedFulfillmentRequest
from app.schemas.trip import TripRequestRead
from app.services.trip_service import TripService


class BookingService:
    def __init__(self) -> None:
        self.trip_service = TripService()

    def get_booking(self, db: Session, booking_id: int) -> Booking | None:
        return (
            db.query(Booking)
            .options(joinedload(Booking.trip_request), joinedload(Booking.trip_option))
            .filter(Booking.id == booking_id)
            .first()
        )

    def confirm_booking(self, db: Session, booking_id: int) -> TripRequestRead:
        booking = (
            db.query(Booking)
            .options(joinedload(Booking.trip_request), joinedload(Booking.trip_option))
            .filter(Booking.id == booking_id)
            .first()
        )
        if not booking:
            raise ValueError("Booking not found")

        trip = booking.trip_request
        if booking.status == "confirmed" or trip.status == "booked":
            raise ValueError("Booking has already been confirmed")
        if booking.status != "ready_to_book":
            raise ValueError("Booking is not ready to confirm")
        if not trip.traveler_profile:
            raise ValueError("Traveler profile is required before booking")
        if not trip.traveler_profile.email or not trip.traveler_profile.phone or not trip.traveler_profile.date_of_birth:
            raise ValueError("Traveler profile must include email, phone, and date of birth before booking")

        booking.status = "booking_in_progress"
        trip.status = "booking_in_progress"
        db.flush()

        confirmation_code = self._generate_code("TRIP")
        record_locator = self._generate_code("REC", size=6)

        booking.status = "confirmed"
        booking.confirmation_code = confirmation_code
        booking.provider_record_locator = record_locator
        booking.failure_reason = None
        booking.booked_at = datetime.utcnow()
        trip.status = "booked"

        db.add(
            AuditLog(
                entity_type="booking",
                entity_id=booking.id,
                action="confirmed",
                summary=f"Booking {confirmation_code} confirmed for trip {trip.id}",
                actor_user_id=trip.submitted_by_user_id,
            )
        )

        db.commit()
        hydrated_trip = self.trip_service.get_trip(db, trip.id)
        assert hydrated_trip is not None
        return hydrated_trip

    def request_assisted_fulfillment(
        self,
        db: Session,
        booking_id: int,
        payload: AssistedFulfillmentRequest | None = None,
    ) -> TripRequestRead:
        booking = (
            db.query(Booking)
            .options(joinedload(Booking.trip_request), joinedload(Booking.trip_option))
            .filter(Booking.id == booking_id)
            .first()
        )
        if not booking:
            raise ValueError("Booking not found")

        trip = booking.trip_request
        if booking.status == "confirmed" or trip.status == "booked":
            raise ValueError("Booking has already been confirmed")
        if booking.status != "ready_to_book":
            raise ValueError("Booking is not ready for assisted fulfillment")

        booking.status = "fulfillment_requested"
        booking.fulfillment_method = "assisted"
        booking.fulfillment_requested_at = datetime.utcnow()
        booking.fulfilled_by = None
        booking.fulfillment_notes = self._clean_optional(payload.fulfillment_notes) if payload else None
        booking.failure_reason = None
        trip.status = "booking_in_progress"

        db.add(
            AuditLog(
                entity_type="booking",
                entity_id=booking.id,
                action="assisted_fulfillment_requested",
                summary=f"Booking {booking.id} routed for assisted fulfillment",
                actor_user_id=trip.submitted_by_user_id,
            )
        )

        db.commit()
        hydrated_trip = self.trip_service.get_trip(db, trip.id)
        assert hydrated_trip is not None
        return hydrated_trip

    def complete_assisted_fulfillment(
        self,
        db: Session,
        booking_id: int,
        payload: AssistedFulfillmentComplete | None = None,
    ) -> TripRequestRead:
        booking = (
            db.query(Booking)
            .options(joinedload(Booking.trip_request), joinedload(Booking.trip_option))
            .filter(Booking.id == booking_id)
            .first()
        )
        if not booking:
            raise ValueError("Booking not found")

        trip = booking.trip_request
        if booking.status == "confirmed" or trip.status == "booked":
            raise ValueError("Booking has already been confirmed")
        if booking.status != "fulfillment_requested":
            raise ValueError("Booking is not awaiting assisted fulfillment")

        confirmation_code = self._clean_optional(payload.confirmation_code) if payload else None
        provider_record_locator = self._clean_optional(payload.provider_record_locator) if payload else None
        fulfilled_by = self._clean_optional(payload.fulfilled_by) if payload else None
        fulfillment_notes = self._clean_optional(payload.fulfillment_notes) if payload else None

        booking.status = "confirmed"
        booking.fulfillment_method = "assisted"
        booking.confirmation_code = confirmation_code or self._generate_code("TRIP")
        booking.provider_record_locator = provider_record_locator or self._generate_code("REC", size=6)
        booking.fulfilled_by = fulfilled_by
        booking.fulfillment_notes = fulfillment_notes or booking.fulfillment_notes
        booking.failure_reason = None
        booking.booked_at = datetime.utcnow()
        trip.status = "booked"

        db.add(
            AuditLog(
                entity_type="booking",
                entity_id=booking.id,
                action="assisted_fulfillment_completed",
                summary=f"Booking {booking.confirmation_code} completed through assisted fulfillment",
                actor_user_id=trip.submitted_by_user_id,
            )
        )

        db.commit()
        hydrated_trip = self.trip_service.get_trip(db, trip.id)
        assert hydrated_trip is not None
        return hydrated_trip

    def _generate_code(self, prefix: str, size: int = 8) -> str:
        suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=size))
        return f"{prefix}-{suffix}"

    def _clean_optional(self, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None
