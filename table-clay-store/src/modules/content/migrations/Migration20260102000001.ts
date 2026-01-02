import { Migration } from "@mikro-orm/migrations"

export class Migration20260102000001 extends Migration {
  async up(): Promise<void> {
    // ===== REVIEWS TABLE =====
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "content_review" (
        "id" TEXT NOT NULL,
        "product_id" TEXT NOT NULL,
        "customer_name" TEXT NOT NULL,
        "is_verified_buyer" BOOLEAN NOT NULL DEFAULT false,
        "rating" INTEGER NOT NULL,
        "title" TEXT NULL,
        "content" TEXT NOT NULL,
        "display_date" TIMESTAMPTZ NOT NULL,
        "helpful_count" INTEGER NOT NULL DEFAULT 0,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "sort_order" INTEGER NOT NULL DEFAULT 0,
        "metadata" JSONB NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ NULL,
        CONSTRAINT "content_review_pkey" PRIMARY KEY ("id")
      );
    `)

    // Index for product + active status (main query pattern)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_content_review_product_active"
      ON "content_review" (product_id, is_active) WHERE deleted_at IS NULL;
    `)

    // Index for sorting
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_content_review_sort_order"
      ON "content_review" (sort_order) WHERE deleted_at IS NULL;
    `)

    // ===== REVIEW IMAGES TABLE =====
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "content_review_image" (
        "id" TEXT NOT NULL,
        "review_id" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "alt_text" TEXT NULL,
        "sort_order" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ NULL,
        CONSTRAINT "content_review_image_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "content_review_image_review_fk" FOREIGN KEY ("review_id")
          REFERENCES "content_review" ("id") ON DELETE CASCADE
      );
    `)

    // Index for review lookup
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_content_review_image_review"
      ON "content_review_image" (review_id) WHERE deleted_at IS NULL;
    `)

    // ===== PRODUCT REVIEW STATS TABLE =====
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "content_product_review_stats" (
        "id" TEXT NOT NULL,
        "product_id" TEXT NOT NULL,
        "average_rating" NUMERIC(3,2) NOT NULL,
        "total_count" INTEGER NOT NULL,
        "rating_5_count" INTEGER NOT NULL DEFAULT 0,
        "rating_4_count" INTEGER NOT NULL DEFAULT 0,
        "rating_3_count" INTEGER NOT NULL DEFAULT 0,
        "rating_2_count" INTEGER NOT NULL DEFAULT 0,
        "rating_1_count" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ NULL,
        CONSTRAINT "content_product_review_stats_pkey" PRIMARY KEY ("id")
      );
    `)

    // Unique index on product_id (one stats record per product)
    this.addSql(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_content_product_review_stats_product_unique"
      ON "content_product_review_stats" (product_id) WHERE deleted_at IS NULL;
    `)

    // ===== FAQ TABLE =====
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "content_faq" (
        "id" TEXT NOT NULL,
        "product_id" TEXT NULL,
        "question" TEXT NOT NULL,
        "answer" TEXT NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "sort_order" INTEGER NOT NULL DEFAULT 0,
        "metadata" JSONB NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ NULL,
        CONSTRAINT "content_faq_pkey" PRIMARY KEY ("id")
      );
    `)

    // Index for product + active status (main query pattern)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_content_faq_product_active"
      ON "content_faq" (product_id, is_active) WHERE deleted_at IS NULL;
    `)

    // Index for global FAQs (product_id IS NULL)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_content_faq_global"
      ON "content_faq" (is_active, sort_order) WHERE product_id IS NULL AND deleted_at IS NULL;
    `)
  }

  async down(): Promise<void> {
    this.addSql('DROP TABLE IF EXISTS "content_review_image" CASCADE;')
    this.addSql('DROP TABLE IF EXISTS "content_review" CASCADE;')
    this.addSql('DROP TABLE IF EXISTS "content_product_review_stats" CASCADE;')
    this.addSql('DROP TABLE IF EXISTS "content_faq" CASCADE;')
  }
}
