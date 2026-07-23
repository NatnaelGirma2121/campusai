"""add campus_locations and notifications tables

Revision ID: 0005
Revises: 0004
Create Date: 2026-07-22

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    location_category = sa.Enum(
        "academic", "lab", "library", "cafeteria", "dormitory", "administration", "parking", "other",
        name="location_category",
    )
    location_category.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "campus_locations",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("category", location_category, nullable=False, server_default="other"),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "department_id", sa.Uuid(), sa.ForeignKey("departments.id", ondelete="SET NULL"), nullable=True
        ),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
    )

    notification_kind = sa.Enum(
        "announcement", "attendance_risk", "grade_posted", "general", name="notification_kind"
    )
    notification_kind.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "notifications",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("kind", notification_kind, nullable=False, server_default="general"),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("related_id", sa.Uuid(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("notifications")
    sa.Enum(name="notification_kind").drop(op.get_bind(), checkfirst=True)
    op.drop_table("campus_locations")
    sa.Enum(name="location_category").drop(op.get_bind(), checkfirst=True)
