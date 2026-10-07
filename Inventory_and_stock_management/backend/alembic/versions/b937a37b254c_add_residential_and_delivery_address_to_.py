"""add_residential_and_delivery_address_to_customers

Revision ID: b937a37b254c
Revises: 9d677a1fda5d
Create Date: 2026-10-01 14:57:59.021640

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b937a37b254c'
down_revision: Union[str, Sequence[str], None] = '9d677a1fda5d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('customers', sa.Column('residential_address', sa.String(length=500), nullable=True))
    op.add_column('customers', sa.Column('delivery_address', sa.String(length=500), nullable=True))
    op.execute("UPDATE customers SET residential_address = address, delivery_address = address WHERE address IS NOT NULL")


def downgrade() -> None:
    op.drop_column('customers', 'delivery_address')
    op.drop_column('customers', 'residential_address')
