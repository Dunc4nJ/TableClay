import { Migration } from "@mikro-orm/migrations"

/**
 * Multi-product bundles migration
 * - Removes product_id from bundle table (bundles no longer tied to single product)
 * - Adds product_id, product_title, variant_title to bundle_item (denormalized for querying)
 */
export class Migration20260102200000 extends Migration {
  async up(): Promise<void> {
    // Step 1: Add new columns to bundle_item
    this.addSql(`
      ALTER TABLE "bundle_item"
      ADD COLUMN IF NOT EXISTS "product_id" TEXT NULL,
      ADD COLUMN IF NOT EXISTS "product_title" TEXT NULL,
      ADD COLUMN IF NOT EXISTS "variant_title" TEXT NULL;
    `)

    // Step 2: Create index on bundle_item.product_id for efficient querying
    // This enables finding bundles that contain a specific product's variants
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_bundle_item_product_id"
      ON "bundle_item" (product_id) WHERE deleted_at IS NULL;
    `)

    // Step 3: Drop the product_id index from bundle table
    this.addSql(`
      DROP INDEX IF EXISTS "IDX_bundle_product_id";
    `)

    this.addSql(`
      DROP INDEX IF EXISTS "IDX_bundle_product_active";
    `)

    // Step 4: Drop product_id column from bundle table
    // Bundles are now associated with products through their items
    this.addSql(`
      ALTER TABLE "bundle"
      DROP COLUMN IF EXISTS "product_id";
    `)
  }

  async down(): Promise<void> {
    // Restore product_id column to bundle table
    this.addSql(`
      ALTER TABLE "bundle"
      ADD COLUMN IF NOT EXISTS "product_id" TEXT NULL;
    `)

    // Restore indexes
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_bundle_product_id"
      ON "bundle" (product_id) WHERE deleted_at IS NULL;
    `)

    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_bundle_product_active"
      ON "bundle" (product_id, is_active) WHERE deleted_at IS NULL;
    `)

    // Drop product_id index from bundle_item
    this.addSql(`
      DROP INDEX IF EXISTS "IDX_bundle_item_product_id";
    `)

    // Remove columns from bundle_item
    this.addSql(`
      ALTER TABLE "bundle_item"
      DROP COLUMN IF EXISTS "product_id",
      DROP COLUMN IF EXISTS "product_title",
      DROP COLUMN IF EXISTS "variant_title";
    `)
  }
}
