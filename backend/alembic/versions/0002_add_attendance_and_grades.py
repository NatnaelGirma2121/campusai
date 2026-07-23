"""add attendance and grades tables

Revision ID: 0002
Revises: 0001
Create Date: 2026-07-21

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    attendance_status = sa.Enum("present", "absent", "excused", "late", name="attendance_status")
    attendance_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "attendance",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "enrollment_id", sa.Uuid(), sa.ForeignKey("enrollments.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("status", attendance_status, nullable=False, server_default="present"),
        sa.Column("note", sa.String(length=255), nullable=True),
        sa.Column(
            "recorded_by_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("enrollment_id", "date", name="uq_attendance_enrollment_date"),
    )

    grade_component = sa.Enum(
        "assignment", "quiz", "midterm", "final", "project", "participation", name="grade_component"
    )
    grade_component.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "grades",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "enrollment_id", sa.Uuid(), sa.ForeignKey("enrollments.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("component", grade_component, nullable=False),
        sa.Column("label", sa.String(length=100), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("max_score", sa.Float(), nullable=False, server_default="100.0"),
        sa.Column(
            "graded_by_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint(
            "enrollment_id", "component", "label", name="uq_grade_enrollment_component_label"
        ),
    )


def downgrade() -> None:
    op.drop_table("grades")
    sa.Enum(name="grade_component").drop(op.get_bind(), checkfirst=True)
    op.drop_table("attendance")
    sa.Enum(name="attendance_status").drop(op.get_bind(), checkfirst=True)
