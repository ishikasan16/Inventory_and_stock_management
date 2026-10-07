"""add token type to revoked tokens

Revision ID: 51da2109bb98
Revises: 54b58217aa63
Create Date: 2026-09-14 15:19:33.902161

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.

revision: str = "51da2109bb98"
down_revision: Union[str, Sequence[str], None] = "54b58217aa63"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.add_column(
        "revoked_tokens",
        sa.Column(
            "token_type",
            sa.String(length=20),
            nullable=True
        )
    )

    op.execute(
        "UPDATE revoked_tokens "
        "SET token_type = 'access' "
        "WHERE token_type IS NULL"
    )

    op.alter_column(
        "revoked_tokens",
        "token_type",
        nullable=False
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_column(
        "revoked_tokens",
        "token_type"
    )