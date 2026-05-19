import json

from sqlalchemy.orm import Session, joinedload

from app.models.recommendation import Recommendation
from app.models.trip_request import TripRequest
from app.schemas.admin import AdminDashboardResponse, AdminQueueRow, AdminTripRow, DashboardMetric


class AdminService:
    def get_dashboard(self, db: Session, company_id: int | None = None) -> AdminDashboardResponse:
        query = (
            db.query(TripRequest)
            .options(
                joinedload(TripRequest.recommendations).joinedload(Recommendation.trip_option),
                joinedload(TripRequest.selected_trip_option),
                joinedload(TripRequest.booking),
                joinedload(TripRequest.approval_request),
            )
        )
        if company_id is not None:
            query = query.filter(TripRequest.company_id == company_id)
        trips = query.order_by(TripRequest.created_at.desc()).all()

        total_trips = len(trips)
        total_savings = 0.0
        compliant_count = 0
        pending_approval_count = 0
        booked_count = 0
        fulfillment_queue_count = 0
        trip_rows: list[AdminTripRow] = []
        approval_queue: list[AdminQueueRow] = []
        fulfillment_queue: list[AdminQueueRow] = []

        for trip in trips:
            recommendation = next(iter(sorted(trip.recommendations, key=lambda rec: rec.rank)), None)
            selected_option = trip.selected_trip_option
            booking = trip.booking
            option = selected_option or (recommendation.trip_option if recommendation else None)
            if not option:
                continue
            if recommendation:
                total_savings += recommendation.projected_savings
            if option.policy_compliant:
                compliant_count += 1
            if trip.status == "pending_approval":
                pending_approval_count += 1
                approval_queue.append(
                    AdminQueueRow(
                        trip_id=trip.id,
                        booking_id=booking.id if booking else None,
                        traveler_name=trip.traveler_name,
                        route=f"{trip.origin} -> {trip.destination}",
                        trip_status=trip.status,
                        booking_status=booking.status if booking else None,
                        booking_reference=booking.confirmation_code if booking else None,
                        fulfillment_method=booking.fulfillment_method if booking else None,
                        requested_reason=trip.approval_request.requested_reason if trip.approval_request else None,
                        fulfillment_requested_at=booking.fulfillment_requested_at.isoformat()
                        if booking and booking.fulfillment_requested_at
                        else None,
                        action_label="Review trip",
                        action_href=f"/trips/{trip.id}",
                    )
                )
            if trip.status == "booked":
                booked_count += 1
            if booking and booking.status == "fulfillment_requested":
                fulfillment_queue_count += 1
                fulfillment_queue.append(
                    AdminQueueRow(
                        trip_id=trip.id,
                        booking_id=booking.id,
                        traveler_name=trip.traveler_name,
                        route=f"{trip.origin} -> {trip.destination}",
                        trip_status=trip.status,
                        booking_status=booking.status,
                        booking_reference=booking.confirmation_code,
                        fulfillment_method=booking.fulfillment_method,
                        requested_reason=trip.approval_request.requested_reason if trip.approval_request else None,
                        fulfillment_requested_at=booking.fulfillment_requested_at.isoformat()
                        if booking.fulfillment_requested_at
                        else None,
                        action_label="Complete fulfillment",
                        action_href=f"/trips/{trip.id}",
                    )
                )
            trip_rows.append(
                AdminTripRow(
                    trip_id=trip.id,
                    traveler_name=trip.traveler_name,
                    route=f"{trip.origin} -> {trip.destination}",
                    optimization_preference=trip.optimization_preference,
                    trip_status=trip.status,
                    booking_status=booking.status if booking else None,
                    booking_reference=booking.confirmation_code if booking else None,
                    recommended_mode=option.mode,
                    recommended_carrier=option.carrier,
                    recommended_cost=option.total_cost,
                    projected_savings=recommendation.projected_savings if recommendation else 0.0,
                    policy_compliant=option.policy_compliant,
                    flags=json.loads(option.policy_flags or "[]"),
                )
            )

        compliance_rate = f"{(compliant_count / total_trips * 100):.0f}%" if total_trips else "0%"
        metrics = [
            DashboardMetric(label="Trips submitted", value=str(total_trips), detail="Total requests in the workspace"),
            DashboardMetric(label="Booked trips", value=str(booked_count), detail="Trips with confirmed booking references"),
            DashboardMetric(label="Pending approvals", value=str(pending_approval_count), detail="Trips waiting on exception review"),
            DashboardMetric(label="Fulfillment queue", value=str(fulfillment_queue_count), detail="Trips handed to ops for booking completion"),
            DashboardMetric(label="Projected savings", value=f"${total_savings:,.0f}", detail="Compared to highest-priced returned option"),
            DashboardMetric(label="Compliance rate", value=compliance_rate, detail="Selected or top option policy adherence"),
        ]
        return AdminDashboardResponse(
            metrics=metrics,
            trips=trip_rows,
            approval_queue=approval_queue,
            fulfillment_queue=fulfillment_queue,
        )
