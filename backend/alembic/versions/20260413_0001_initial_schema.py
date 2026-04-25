"""initial schema

Revision ID: 20260413_0001
Revises: None
Create Date: 2026-04-13 21:55:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260413_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "companies",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index(op.f("ix_companies_id"), "companies", ["id"], unique=False)

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False),
        sa.Column("company_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)

    op.create_table(
        "travel_policies",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("company_id", sa.Integer(), nullable=False),
        sa.Column("budget_limit", sa.Float(), nullable=False),
        sa.Column("max_hotel_nightly_rate", sa.Float(), nullable=False),
        sa.Column("preferred_carriers", sa.String(length=255), nullable=False),
        sa.Column("allowed_cabin_classes", sa.String(length=255), nullable=False),
        sa.Column("rail_enabled", sa.Boolean(), nullable=False),
        sa.Column("hotel_enabled", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("company_id"),
    )
    op.create_index(op.f("ix_travel_policies_id"), "travel_policies", ["id"], unique=False)

    op.create_table(
        "trip_requests",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("traveler_name", sa.String(length=255), nullable=False),
        sa.Column("origin", sa.String(length=10), nullable=False),
        sa.Column("destination", sa.String(length=10), nullable=False),
        sa.Column("departure_date", sa.Date(), nullable=False),
        sa.Column("return_date", sa.Date(), nullable=False),
        sa.Column("preferred_arrival_deadline", sa.String(length=50), nullable=False),
        sa.Column("budget_cap", sa.Float(), nullable=False),
        sa.Column("optimization_preference", sa.String(length=50), nullable=False),
        sa.Column("policy_preferences", sa.Text(), nullable=False),
        sa.Column("company_id", sa.Integer(), nullable=False),
        sa.Column("submitted_by_user_id", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["submitted_by_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_trip_requests_id"), "trip_requests", ["id"], unique=False)

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("entity_type", sa.String(length=100), nullable=False),
        sa.Column("entity_id", sa.Integer(), nullable=False),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("actor_user_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_audit_logs_id"), "audit_logs", ["id"], unique=False)

    op.create_table(
        "trip_options",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("trip_request_id", sa.Integer(), nullable=False),
        sa.Column("provider", sa.String(length=100), nullable=False),
        sa.Column("mode", sa.String(length=50), nullable=False),
        sa.Column("carrier", sa.String(length=100), nullable=False),
        sa.Column("cabin_class", sa.String(length=50), nullable=False),
        sa.Column("total_cost", sa.Float(), nullable=False),
        sa.Column("total_duration_minutes", sa.Integer(), nullable=False),
        sa.Column("convenience_score", sa.Float(), nullable=False),
        sa.Column("policy_compliant", sa.Boolean(), nullable=False),
        sa.Column("policy_flags", sa.Text(), nullable=False),
        sa.Column("metadata_json", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["trip_request_id"], ["trip_requests.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_trip_options_id"), "trip_options", ["id"], unique=False)

    op.create_table(
        "recommendations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("trip_request_id", sa.Integer(), nullable=False),
        sa.Column("trip_option_id", sa.Integer(), nullable=False),
        sa.Column("rank", sa.Integer(), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("projected_savings", sa.Float(), nullable=False),
        sa.Column("rationale", sa.String(length=500), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["trip_option_id"], ["trip_options.id"]),
        sa.ForeignKeyConstraint(["trip_request_id"], ["trip_requests.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_recommendations_id"), "recommendations", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_recommendations_id"), table_name="recommendations")
    op.drop_table("recommendations")
    op.drop_index(op.f("ix_trip_options_id"), table_name="trip_options")
    op.drop_table("trip_options")
    op.drop_index(op.f("ix_audit_logs_id"), table_name="audit_logs")
    op.drop_table("audit_logs")
    op.drop_index(op.f("ix_trip_requests_id"), table_name="trip_requests")
    op.drop_table("trip_requests")
    op.drop_index(op.f("ix_travel_policies_id"), table_name="travel_policies")
    op.drop_table("travel_policies")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_table("users")
    op.drop_index(op.f("ix_companies_id"), table_name="companies")
    op.drop_table("companies")
