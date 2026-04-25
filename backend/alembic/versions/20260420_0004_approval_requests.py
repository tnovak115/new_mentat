"""add approval requests

Revision ID: 20260420_0004
Revises: 20260420_0003
Create Date: 2026-04-20 12:05:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260420_0004"
down_revision = "20260420_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "approval_requests",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("trip_request_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("requested_reason", sa.Text(), nullable=True),
        sa.Column("approver_name", sa.String(length=255), nullable=True),
        sa.Column("approver_notes", sa.Text(), nullable=True),
        sa.Column("requested_at", sa.DateTime(), nullable=False),
        sa.Column("decided_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["trip_request_id"], ["trip_requests.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("trip_request_id"),
    )
    op.create_index(op.f("ix_approval_requests_id"), "approval_requests", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_approval_requests_id"), table_name="approval_requests")
    op.drop_table("approval_requests")
