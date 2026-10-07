from alembic import op
import sqlalchemy as sa


revision = "d11f33b183eb"
down_revision = "b6e23cdc5395"
branch_labels = None
depends_on = None


def upgrade():

    # Enable UUID generation
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    # =========================================================
    # 1. Add temporary UUID columns
    # =========================================================

    op.add_column(
        "categories",
        sa.Column(
            "uuid_id",
            sa.UUID(),
            nullable=True
        )
    )

    op.add_column(
        "suppliers",
        sa.Column(
            "uuid_id",
            sa.UUID(),
            nullable=True
        )
    )

    op.add_column(
        "users",
        sa.Column(
            "uuid_id",
            sa.UUID(),
            nullable=True
        )
    )

    op.add_column(
        "products",
        sa.Column(
            "uuid_id",
            sa.UUID(),
            nullable=True
        )
    )

    op.add_column(
        "products",
        sa.Column(
            "uuid_category_id",
            sa.UUID(),
            nullable=True
        )
    )

    op.add_column(
        "products",
        sa.Column(
            "uuid_supplier_id",
            sa.UUID(),
            nullable=True
        )
    )

    # =========================================================
    # 2. Generate UUIDs for existing rows
    # =========================================================

    op.execute("""
        UPDATE categories
        SET uuid_id = gen_random_uuid()
        WHERE uuid_id IS NULL
    """)

    op.execute("""
        UPDATE suppliers
        SET uuid_id = gen_random_uuid()
        WHERE uuid_id IS NULL
    """)

    op.execute("""
        UPDATE users
        SET uuid_id = gen_random_uuid()
        WHERE uuid_id IS NULL
    """)

    op.execute("""
        UPDATE products
        SET uuid_id = gen_random_uuid()
        WHERE uuid_id IS NULL
    """)

    # =========================================================
    # 3. Convert product foreign keys using old integer IDs
    # =========================================================

    op.execute("""
        UPDATE products p
        SET uuid_category_id = c.uuid_id
        FROM categories c
        WHERE p.category_id = c.id
    """)

    op.execute("""
        UPDATE products p
        SET uuid_supplier_id = s.uuid_id
        FROM suppliers s
        WHERE p.supplier_id = s.id
    """)

    # =========================================================
    # 4. Remove old foreign key constraints
    # =========================================================

    op.drop_constraint(
        "products_category_id_fkey",
        "products",
        type_="foreignkey"
    )

    op.drop_constraint(
        "products_supplier_id_fkey",
        "products",
        type_="foreignkey"
    )

    # =========================================================
    # 5. Remove old primary keys
    # =========================================================

    op.drop_constraint(
        "products_pkey",
        "products",
        type_="primary"
    )

    op.drop_constraint(
        "categories_pkey",
        "categories",
        type_="primary"
    )

    op.drop_constraint(
        "suppliers_pkey",
        "suppliers",
        type_="primary"
    )

    op.drop_constraint(
        "users_pkey",
        "users",
        type_="primary"
    )

    # =========================================================
    # 6. Drop old integer columns
    # =========================================================

    op.drop_column("products", "category_id")
    op.drop_column("products", "supplier_id")

    op.drop_column("products", "id")
    op.drop_column("categories", "id")
    op.drop_column("suppliers", "id")
    op.drop_column("users", "id")

    # =========================================================
    # 7. Rename UUID columns
    # =========================================================

    op.alter_column(
        "categories",
        "uuid_id",
        new_column_name="id",
        nullable=False
    )

    op.alter_column(
        "suppliers",
        "uuid_id",
        new_column_name="id",
        nullable=False
    )

    op.alter_column(
        "users",
        "uuid_id",
        new_column_name="id",
        nullable=False
    )

    op.alter_column(
        "products",
        "uuid_id",
        new_column_name="id",
        nullable=False
    )

    op.alter_column(
        "products",
        "uuid_category_id",
        new_column_name="category_id",
        nullable=False
    )

    op.alter_column(
        "products",
        "uuid_supplier_id",
        new_column_name="supplier_id",
        nullable=False
    )

    # =========================================================
    # 8. Re-create primary keys
    # =========================================================

    op.create_primary_key(
        "categories_pkey",
        "categories",
        ["id"]
    )

    op.create_primary_key(
        "suppliers_pkey",
        "suppliers",
        ["id"]
    )

    op.create_primary_key(
        "users_pkey",
        "users",
        ["id"]
    )

    op.create_primary_key(
        "products_pkey",
        "products",
        ["id"]
    )

    # =========================================================
    # 9. Re-create foreign keys
    # =========================================================

    op.create_foreign_key(
        "products_category_id_fkey",
        "products",
        "categories",
        ["category_id"],
        ["id"]
    )

    op.create_foreign_key(
        "products_supplier_id_fkey",
        "products",
        "suppliers",
        ["supplier_id"],
        ["id"]
    )

    # =========================================================
    # 10. Re-create indexes
    # =========================================================

    op.create_index(
        "ix_categories_id",
        "categories",
        ["id"]
    )

    op.create_index(
        "ix_suppliers_id",
        "suppliers",
        ["id"]
    )

    op.create_index(
        "ix_users_id",
        "users",
        ["id"]
    )

    op.create_index(
        "ix_products_id",
        "products",
        ["id"]
    )


def downgrade():

    raise NotImplementedError(
        "Downgrade from UUID to INTEGER is not supported."
    )