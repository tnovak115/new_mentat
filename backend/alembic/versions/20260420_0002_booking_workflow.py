"""add booking workflow

Revision ID: 20260420_0002
Revises: 20260413_0001
Create Date: 2026-04-20 10:15:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260420_0002"
down_revision = "20260413_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("trip_requests") as batch_op:
        batch_op.add_column(sa.Column("selected_trip_option_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            "fk_trip_requests_selected_trip_option_id_trip_options",
            "trip_options",
            ["selected_trip_option_id"],
            ["id"],
        )

    op.create_table(
        "bookings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("trip_request_id", sa.Integer(), nullable=False),
        sa.Column("trip_option_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("confirmation_code", sa.String(length=100), nullable=True),
        sa.Column("provider_record_locator", sa.String(length=100), nullable=True),
        sa.Column("failure_reason", sa.Text(), nullable=True),
        sa.Column("booked_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["trip_option_id"], ["trip_options.id"]),
        sa.ForeignKeyConstraint(["trip_request_id"], ["trip_requests.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("trip_request_id"),
    )
    op.create_index(op.f("ix_bookings_id"), "bookings", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_bookings_id"), table_name="bookings")
    op.drop_table("bookings")
    with op.batch_alter_table("trip_requests") as batch_op:
        batch_op.drop_constraint("fk_trip_requests_selected_trip_option_id_trip_options", type_="foreignkey")
        batch_op.drop_column("selected_trip_option_id")
