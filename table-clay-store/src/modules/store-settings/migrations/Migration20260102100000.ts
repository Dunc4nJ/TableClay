import { Migration } from "@mikro-orm/migrations"

export class Migration20260102100000 extends Migration {
  async up(): Promise<void> {
    // Create store_setting table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "store_setting" (
        "id" TEXT NOT NULL,
        "key" TEXT NOT NULL,
        "value" TEXT NULL,
        "metadata" JSONB NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ NULL,
        CONSTRAINT "store_setting_pkey" PRIMARY KEY ("id")
      );
    `)

    // Create unique index on key
    this.addSql(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_store_setting_key"
      ON "store_setting" ("key") WHERE deleted_at IS NULL;
    `)

    // Seed default settings
    this.addSql(`
      INSERT INTO "store_setting" ("id", "key", "value", "metadata")
      VALUES
        ('sset_bundle_promo_text', 'bundle_promo_text', NULL, NULL),
        ('sset_bundle_promo_enabled', 'bundle_promo_enabled', 'false', NULL)
      ON CONFLICT DO NOTHING;
    `)
  }

  async down(): Promise<void> {
    this.addSql('DROP TABLE IF EXISTS "store_setting" CASCADE;')
  }
}
