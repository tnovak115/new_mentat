"""add assisted fulfillment fields to bookings

Revision ID: 20260420_0005
Revises: 20260420_0004
Create Date: 2026-04-20 22:35:00
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260420_0005"
down_revision = "20260420_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "bookings",
        sa.Column("fulfillment_method", sa.String(length=50), nullable=False, server_default="direct"),
    )
    op.add_column("bookings", sa.Column("fulfillment_requested_at", sa.DateTime(), nullable=True))
    op.add_column("bookings", sa.Column("fulfilled_by", sa.String(length=100), nullable=True))
    op.add_column("bookings", sa.Column("fulfillment_notes", sa.Text(), nullable=True))
    op.alter_column("bookings", "fulfillment_method", server_default=None)


def downgrade() -> None:
    op.drop_column("bookings", "fulfillment_notes")
    op.drop_column("bookings", "fulfilled_by")
    op.drop_column("bookings", "fulfillment_requested_at")
    op.drop_column("bookings", "fulfillment_method")
