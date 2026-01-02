import { Migration } from "@mikro-orm/migrations"

export class Migration20260102000000 extends Migration {
  async up(): Promise<void> {
    // Create enum types
    this.addSql(`
      DO $$ BEGIN
        CREATE TYPE "bundle_pricing_type" AS ENUM ('fixed', 'percentage');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    this.addSql(`
      DO $$ BEGIN
        CREATE TYPE "bundle_badge_type" AS ENUM ('bestseller', 'popular', 'new', 'limited', 'sale', 'none');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    // Create bundle table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "bundle" (
        "id" TEXT NOT NULL,
        "product_id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT NULL,
        "pricing_type" bundle_pricing_type NOT NULL DEFAULT 'fixed',
        "fixed_original_price" NUMERIC NULL,
        "fixed_sale_price" NUMERIC NULL,
        "discount_percentage" INTEGER NULL,
        "badge" bundle_badge_type NOT NULL DEFAULT 'none',
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "sort_order" INTEGER NOT NULL DEFAULT 0,
        "metadata" JSONB NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ NULL,
        CONSTRAINT "bundle_pkey" PRIMARY KEY ("id")
      );
    `)

    // Create bundle_item table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "bundle_item" (
        "id" TEXT NOT NULL,
        "bundle_id" TEXT NOT NULL,
        "variant_id" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL DEFAULT 1,
        "sort_order" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ NULL,
        CONSTRAINT "bundle_item_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "bundle_item_bundle_fkey" FOREIGN KEY ("bundle_id")
          REFERENCES "bundle" ("id") ON DELETE CASCADE
      );
    `)

    // Create indexes for bundle table
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_bundle_product_id"
      ON "bundle" (product_id) WHERE deleted_at IS NULL;
    `)

    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_bundle_is_active"
      ON "bundle" (is_active) WHERE deleted_at IS NULL;
    `)

    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_bundle_product_active"
      ON "bundle" (product_id, is_active) WHERE deleted_at IS NULL;
    `)

    // Create indexes for bundle_item table
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_bundle_item_bundle_id"
      ON "bundle_item" (bundle_id) WHERE deleted_at IS NULL;
    `)

    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_bundle_item_variant_id"
      ON "bundle_item" (variant_id) WHERE deleted_at IS NULL;
    `)
  }

  async down(): Promise<void> {
    this.addSql('DROP TABLE IF EXISTS "bundle_item" CASCADE;')
    this.addSql('DROP TABLE IF EXISTS "bundle" CASCADE;')
    this.addSql('DROP TYPE IF EXISTS "bundle_badge_type";')
    this.addSql('DROP TYPE IF EXISTS "bundle_pricing_type";')
  }
}
