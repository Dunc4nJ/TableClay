import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260125090001 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "order_shipping_method_adjustment" add column if not exists "is_tax_inclusive" boolean not null default false;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "order_shipping_method_adjustment" drop column if exists "is_tax_inclusive";`);
  }

}
