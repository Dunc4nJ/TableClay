import { Migration } from "@mikro-orm/migrations"

export class Migration20251231160000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "newsletter_subscriber" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "first_name" TEXT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "subscribed_at" TIMESTAMPTZ NOT NULL,
        "unsubscribed_at" TIMESTAMPTZ NULL,
        "source" TEXT NOT NULL DEFAULT 'popup',
        "discount_code" TEXT NULL,
        "discount_code_sent" BOOLEAN NOT NULL DEFAULT false,
        "discount_code_used" BOOLEAN NOT NULL DEFAULT false,
        "discount_code_used_at" TIMESTAMPTZ NULL,
        "tags" JSONB NOT NULL DEFAULT '{}',
        "metadata" JSONB NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ NULL,
        CONSTRAINT "newsletter_subscriber_pkey" PRIMARY KEY ("id")
      );
    `)

    // Unique index on email (only for non-deleted records)
    this.addSql(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_newsletter_subscriber_email_unique"
      ON "newsletter_subscriber" (email) WHERE deleted_at IS NULL;
    `)

    // Index on discount code for lookup
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_newsletter_subscriber_discount_code"
      ON "newsletter_subscriber" (discount_code) WHERE discount_code IS NOT NULL;
    `)

    // Index on source for filtering
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_newsletter_subscriber_source"
      ON "newsletter_subscriber" (source);
    `)

    // Index on is_active for filtering active subscribers
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_newsletter_subscriber_is_active"
      ON "newsletter_subscriber" (is_active) WHERE deleted_at IS NULL;
    `)
  }

  async down(): Promise<void> {
    this.addSql('DROP TABLE IF EXISTS "newsletter_subscriber" CASCADE;')
  }
}
