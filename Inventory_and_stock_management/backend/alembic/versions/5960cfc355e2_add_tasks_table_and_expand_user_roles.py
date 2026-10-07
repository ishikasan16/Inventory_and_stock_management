"""add tasks table and expand user roles

Revision ID: 5960cfc355e2
Revises: 9f15a6a3363d
Create Date: 2026-09-16 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5960cfc355e2'
down_revision: Union[str, Sequence[str], None] = '9f15a6a3363d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # --------------------------------
    # WIDEN USERS ROLE
    # --------------------------------

    op.alter_column(
        'users',
        'role',
        existing_type=sa.String(20),
        type_=sa.String(30),
        existing_nullable=False
    )

    # --------------------------------
    # CREATE TASKS TABLE
    # --------------------------------

    op.create_table(
        'tasks',
        sa.Column(
            'id',
            sa.UUID(),
            nullable=False
        ),
        sa.Column(
            'title',
            sa.String(length=150),
            nullable=False
        ),
        sa.Column(
            'description',
            sa.String(length=500),
            nullable=True
        ),
        sa.Column(
            'priority',
            sa.String(length=10),
            nullable=False,
            server_default='MEDIUM'
        ),
        sa.Column(
            'status',
            sa.String(length=15),
            nullable=False,
            server_default='PENDING'
        ),
        sa.Column(
            'due_date',
            sa.DateTime(),
            nullable=True
        ),
        sa.Column(
            'assigned_to_id',
            sa.UUID(),
            nullable=False
        ),
        sa.Column(
            'assigned_by_id',
            sa.UUID(),
            nullable=False
        ),
        sa.Column(
            'target_type',
            sa.String(length=15),
            nullable=True
        ),
        sa.Column(
            'target_id',
            sa.UUID(),
            nullable=True
        ),
        sa.Column(
            'created_at',
            sa.DateTime(),
            nullable=False
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(),
            nullable=False
        ),
        sa.ForeignKeyConstraint(
            ['assigned_to_id'],
            ['users.id'],
        ),
        sa.ForeignKeyConstraint(
            ['assigned_by_id'],
            ['users.id'],
        ),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_index(
        op.f('ix_tasks_id'),
        'tasks',
        ['id'],
        unique=False
    )

    op.create_index(
        op.f('ix_tasks_assigned_by_id'),
        'tasks',
        ['assigned_by_id'],
        unique=False
    )

    op.create_index(
        op.f('ix_tasks_assigned_to_id'),
        'tasks',
        ['assigned_to_id'],
        unique=False
    )

    op.create_index(
        op.f('ix_tasks_target_id'),
        'tasks',
        ['target_id'],
        unique=False
    )

    # --------------------------------
    # DATA: PROMOTE ONE EXISTING ADMIN
    # TO SUPER_ADMIN (keeps dev DBs
    # usable)
    # --------------------------------

    op.execute(
        """
        UPDATE users
        SET role = 'SUPER_ADMIN'
        WHERE id = (
            SELECT id
            FROM users
            WHERE role = 'ADMIN'
            ORDER BY id
            LIMIT 1
        )
        """
    )

    # --------------------------------
    # DATA: NORMALISE ANY DIRTY LEGACY
    # ROLE VALUES (e.g. 'AD')
    # --------------------------------

    op.execute(
        """
        UPDATE users
        SET role = 'STAFF'
        WHERE role NOT IN (
            'SUPER_ADMIN',
            'ADMIN_MANAGER',
            'STAFF_MANAGER',
            'ADMIN',
            'STAFF'
        )
        """
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_index(
        op.f('ix_tasks_target_id'),
        table_name='tasks'
    )

    op.drop_index(
        op.f('ix_tasks_assigned_to_id'),
        table_name='tasks'
    )

    op.drop_index(
        op.f('ix_tasks_assigned_by_id'),
        table_name='tasks'
    )

    op.drop_index(
        op.f('ix_tasks_id'),
        table_name='tasks'
    )

    op.drop_table('tasks')

    op.alter_column(
        'users',
        'role',
        existing_type=sa.String(30),
        type_=sa.String(20),
        existing_nullable=False
    )