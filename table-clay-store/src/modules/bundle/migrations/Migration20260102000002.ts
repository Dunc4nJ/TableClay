import { Migration } from "@mikro-orm/migrations"

/**
 * Fix: Add missing raw_* columns required by Medusa's bigNumber fields
 */
export class Migration20260102000002 extends Migration {
  async up(): Promise<void> {
    // Add missing raw columns for bigNumber fields
    this.addSql(`
      ALTER TABLE "bundle"
      ADD COLUMN IF NOT EXISTS "raw_fixed_original_price" JSONB NULL,
      ADD COLUMN IF NOT EXISTS "raw_fixed_sale_price" JSONB NULL,
      ADD COLUMN IF NOT EXISTS "raw_discount_percentage" JSONB NULL;
    `)
  }

  async down(): Promise<void> {
    this.addSql(`
      ALTER TABLE "bundle"
      DROP COLUMN IF EXISTS "raw_fixed_original_price",
      DROP COLUMN IF EXISTS "raw_fixed_sale_price",
      DROP COLUMN IF EXISTS "raw_discount_percentage";
    `)
  }
}
