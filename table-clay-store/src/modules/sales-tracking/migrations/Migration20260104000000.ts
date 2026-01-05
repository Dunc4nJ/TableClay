import { Migration } from "@mikro-orm/migrations"

export class Migration20260104000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "product_sales" (
        "id" TEXT NOT NULL,
        "product_id" TEXT NOT NULL,
        "sales_count" INTEGER NOT NULL DEFAULT 0,
        "last_sold_at" TIMESTAMPTZ NULL,
        "metadata" JSONB NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ NULL,
        CONSTRAINT "product_sales_pkey" PRIMARY KEY ("id")
      );
    `)

    // Unique index on product_id (only for non-deleted records)
    this.addSql(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_sales_product_id_unique"
      ON "product_sales" (product_id) WHERE deleted_at IS NULL;
    `)

    // Index on sales_count for sorting by bestseller
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_product_sales_sales_count"
      ON "product_sales" (sales_count DESC) WHERE deleted_at IS NULL;
    `)

    // Index on last_sold_at for recent sales queries
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_product_sales_last_sold_at"
      ON "product_sales" (last_sold_at DESC NULLS LAST) WHERE deleted_at IS NULL;
    `)
  }

  async down(): Promise<void> {
    this.addSql('DROP TABLE IF EXISTS "product_sales" CASCADE;')
  }
}
