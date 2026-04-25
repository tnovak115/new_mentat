"""add traveler profiles

Revision ID: 20260420_0003
Revises: 20260420_0002
Create Date: 2026-04-20 11:20:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260420_0003"
down_revision = "20260420_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "traveler_profiles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("company_id", sa.Integer(), nullable=False),
        sa.Column("traveler_name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("date_of_birth", sa.Date(), nullable=True),
        sa.Column("known_traveler_number", sa.String(length=100), nullable=True),
        sa.Column("loyalty_program", sa.String(length=100), nullable=True),
        sa.Column("loyalty_number", sa.String(length=100), nullable=True),
        sa.Column("seat_preference", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_traveler_profiles_id"), "traveler_profiles", ["id"], unique=False)

    with op.batch_alter_table("trip_requests") as batch_op:
        batch_op.add_column(sa.Column("traveler_profile_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            "fk_trip_requests_traveler_profile_id_traveler_profiles",
            "traveler_profiles",
            ["traveler_profile_id"],
            ["id"],
        )


def downgrade() -> None:
    with op.batch_alter_table("trip_requests") as batch_op:
        batch_op.drop_constraint("fk_trip_requests_traveler_profile_id_traveler_profiles", type_="foreignkey")
        batch_op.drop_column("traveler_profile_id")

    op.drop_index(op.f("ix_traveler_profiles_id"), table_name="traveler_profiles")
    op.drop_table("traveler_profiles")
