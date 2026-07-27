"""add announcements table

Revision ID: 0004
Revises: 0003
Create Date: 2026-07-22

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    category = sa.Enum(
        "academic", "sports", "scholarships", "events", "emergency", name="announcement_category"
    )

    op.create_table(
        "announcements",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("category", category, nullable=False, server_default="academic"),
        sa.Column(
            "department_id", sa.Uuid(), sa.ForeignKey("departments.id", ondelete="CASCADE"), nullable=True
        ),
        sa.Column(
            "posted_by_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True
        ),
        sa.Column("is_pinned", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("announcements")
    sa.Enum(name="announcement_category").drop(op.get_bind(), checkfirst=True)
