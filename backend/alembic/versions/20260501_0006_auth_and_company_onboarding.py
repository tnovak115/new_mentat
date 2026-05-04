"""add auth and company onboarding fields

Revision ID: 20260501_0006
Revises: 20260420_0005
Create Date: 2026-05-01 12:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260501_0006"
down_revision = "20260420_0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("companies", sa.Column("employee_count", sa.Integer(), nullable=True))
    op.add_column("companies", sa.Column("primary_location", sa.String(length=255), nullable=True))
    op.add_column("companies", sa.Column("default_currency", sa.String(length=10), nullable=True))
    op.add_column("companies", sa.Column("travel_manager_name", sa.String(length=255), nullable=True))
    op.add_column("companies", sa.Column("travel_manager_email", sa.String(length=255), nullable=True))
    op.add_column("companies", sa.Column("travel_program_notes", sa.String(length=1000), nullable=True))

    op.add_column("users", sa.Column("username", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("password_hash", sa.String(length=255), nullable=True))

    connection = op.get_bind()
    users = connection.execute(sa.text("SELECT id, email FROM users")).fetchall()
    for user_id, email in users:
        username = (email or f"user{user_id}").split("@")[0].lower()
        connection.execute(
            sa.text("UPDATE users SET username = :username, password_hash = :password_hash WHERE id = :id"),
            {
                "id": user_id,
                "username": f"{username}.{user_id}",
                "password_hash": "legacy_login_disabled",
            },
        )

    with op.batch_alter_table("users") as batch_op:
        batch_op.alter_column("username", nullable=False)
        batch_op.alter_column("password_hash", nullable=False)
        batch_op.create_unique_constraint("uq_users_username", ["username"])


def downgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_constraint("uq_users_username", type_="unique")
        batch_op.drop_column("password_hash")
        batch_op.drop_column("username")

    op.drop_column("companies", "travel_program_notes")
    op.drop_column("companies", "travel_manager_email")
    op.drop_column("companies", "travel_manager_name")
    op.drop_column("companies", "default_currency")
    op.drop_column("companies", "primary_location")
    op.drop_column("companies", "employee_count")
