#!/usr/bin/env python3
"""
Clone production catalog data to staging.

Copies products, categories, collections, reviews, FAQs, bundles,
community creations, store settings, and sales tracking from the
production database to the staging database via Railway CLI.

Usage:
    python scripts/clone-prod-to-staging.py --dry-run    # Preview without executing
    python scripts/clone-prod-to-staging.py              # Full clone
    python scripts/clone-prod-to-staging.py --tables custom  # Custom module tables only
    python scripts/clone-prod-to-staging.py --tables core    # Medusa core tables only
"""

import subprocess
import sys
import argparse
import csv
import io
import re
from datetime import datetime, timezone

# --- ID Remapping ---
# Production IDs → Staging IDs (queried from databases)
PROD_SALES_CHANNEL = "sc_01KCXBH6XWZGFE8ANEH8KM0HSX"
STAGING_SALES_CHANNEL = "sc_01KGSSD5HD8YEXR6EMGTFW4AZP"

PROD_SHIPPING_PROFILE = "sp_01KCXAWSY01KFWNRZF0M77XW6G"
STAGING_SHIPPING_PROFILE = "sp_01KGSSD1XWZ76VWB0T3RYFBMA8"

PROD_REGION = "reg_01KD1ZBZQWK3XB80DJT6N9J2PX"
STAGING_REGION = "reg_01KGWM7NN865104EZBJXNCQKTA"

STAGING_STOCK_LOCATION = "sloc_01KGWM7NRRXP53FZ64QG1JK8RQ"

# --- Table Definitions ---
# Order matters: delete in reverse, insert in forward order

CORE_TABLES = [
    # Medusa core product tables (no FK dependencies on each other except as noted)
    "product_type",
    "product_collection",
    "product_category",       # self-referential parent_category_id
    "product",                # FK to product_type, product_collection
    "product_option",         # FK to product
    "product_option_value",   # FK to product_option
    "product_variant",        # FK to product
    "product_variant_option", # FK to product_variant, product_option_value
    "image",                  # FK to product (product_id column)
    # Price tables
    "price_set",
    "price",                  # FK to price_set
    "price_rule",             # FK to price (remapping region_id in value)
    # Link tables
    "product_variant_price_set",       # FK to product_variant, price_set
    "product_category_product",        # FK to product_category, product
    "product_sales_channel",           # FK to product, sales_channel (REMAP)
    "product_shipping_profile",        # FK to product, shipping_profile (REMAP)
    # Inventory
    "inventory_item",
    "product_variant_inventory_item",  # FK to product_variant, inventory_item
]

CUSTOM_TABLES = [
    "content_review",
    "content_review_image",            # FK to content_review
    "content_product_review_stats",
    "content_faq",
    "content_community_creation",
    "bundle",
    "bundle_item",                     # FK to bundle
    "store_setting",
    "product_sales",
]

ALL_TABLES = CORE_TABLES + CUSTOM_TABLES

# Tables that need column-level remapping
REMAP_RULES = {
    "product_sales_channel": {
        "sales_channel_id": {PROD_SALES_CHANNEL: STAGING_SALES_CHANNEL}
    },
    "product_shipping_profile": {
        "shipping_profile_id": {PROD_SHIPPING_PROFILE: STAGING_SHIPPING_PROFILE}
    },
    "price_rule": {
        "value": {PROD_REGION: STAGING_REGION}
    },
}


def run_railway_sql(sql, environment, capture=True):
    """Run SQL via railway connect Postgres for a given environment."""
    cmd = ["railway", "connect", "Postgres"]
    proc = subprocess.run(
        cmd,
        input=sql,
        capture_output=capture,
        text=True,
        env={
            **subprocess.os.environ,
            "RAILWAY_ENVIRONMENT": environment,
        },
    )
    if proc.returncode != 0 and capture:
        stderr = proc.stderr.strip() if proc.stderr else ""
        # Filter out railway CLI noise
        if stderr and "error" in stderr.lower():
            print(f"  SQL error ({environment}): {stderr}", file=sys.stderr)
    return proc.stdout if capture else ""


def switch_environment(env_name):
    """Switch Railway CLI to the given environment."""
    subprocess.run(
        ["railway", "environment", "link", env_name],
        capture_output=True, text=True
    )
    subprocess.run(
        ["railway", "service", "link", "TableClay"],
        capture_output=True, text=True
    )
    # Verify
    result = subprocess.run(
        ["railway", "status"],
        capture_output=True, text=True
    )
    if env_name not in result.stdout.lower():
        print(f"WARNING: Failed to switch to {env_name}!", file=sys.stderr)
        print(f"  Status: {result.stdout.strip()}", file=sys.stderr)
        return False
    return True


def export_table(table_name, environment):
    """Export table data from the given environment using COPY TO STDOUT."""
    switch_environment(environment)
    sql = f"\\COPY (SELECT * FROM {table_name}) TO STDOUT WITH CSV HEADER"
    output = run_railway_sql(sql, environment)
    if not output or not output.strip():
        return [], []

    reader = csv.reader(io.StringIO(output))
    headers = next(reader)
    rows = list(reader)
    return headers, rows


def get_row_count(table_name, environment):
    """Get the count of rows in a table."""
    switch_environment(environment)
    sql = f"SELECT count(*) FROM {table_name};"
    output = run_railway_sql(sql, environment)
    # Parse psql output: header, separator, value
    for line in output.strip().split("\n"):
        line = line.strip()
        if line.isdigit():
            return int(line)
    return 0


def remap_row(table_name, headers, row):
    """Apply remapping rules to a row if the table has remapping configured."""
    if table_name not in REMAP_RULES:
        return row

    rules = REMAP_RULES[table_name]
    new_row = list(row)
    for col_name, mapping in rules.items():
        if col_name in headers:
            idx = headers.index(col_name)
            if new_row[idx] in mapping:
                new_row[idx] = mapping[new_row[idx]]
    return new_row


def escape_csv_value(val):
    """Escape a value for PostgreSQL COPY CSV format."""
    if val == "" or val is None:
        return ""
    # If it contains comma, quote, or newline, wrap in quotes
    if "," in val or '"' in val or "\n" in val:
        return '"' + val.replace('"', '""') + '"'
    return val


def build_csv_data(headers, rows):
    """Build CSV string from headers and rows."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    for row in rows:
        writer.writerow(row)
    return output.getvalue()


def delete_table_data(table_name, environment, dry_run=False):
    """Delete all data from a table in the given environment."""
    if dry_run:
        print(f"  [DRY RUN] Would DELETE FROM {table_name}")
        return True

    switch_environment(environment)
    sql = f"DELETE FROM {table_name};"
    output = run_railway_sql(sql, environment)
    return True


def parse_psql_column_list(output):
    """Parse a single-column psql result set into a set of values."""
    result = set()
    for line in output.strip().split("\n"):
        line = line.strip()
        # Skip header, separator lines, row count, empty lines
        if not line or line.startswith("-") or line.startswith("(") or line == "column_name":
            continue
        result.add(line)
    return result


def get_nullable_columns(table_name, environment):
    """Query which columns are nullable for a given table."""
    switch_environment(environment)
    sql = f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table_name}' AND is_nullable = 'YES';"
    output = run_railway_sql(sql, environment)
    return parse_psql_column_list(output)


# Cache for nullable columns per table
_nullable_cache = {}


def get_nullable_cached(table_name, environment):
    """Get nullable columns with caching."""
    if table_name not in _nullable_cache:
        _nullable_cache[table_name] = get_nullable_columns(table_name, environment)
    return _nullable_cache[table_name]


# Cache for boolean columns per table
_boolean_cache = {}


def get_boolean_columns(table_name, environment):
    """Query which columns are boolean for a given table."""
    if table_name in _boolean_cache:
        return _boolean_cache[table_name]
    switch_environment(environment)
    sql = f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table_name}' AND data_type = 'boolean';"
    output = run_railway_sql(sql, environment)
    _boolean_cache[table_name] = parse_psql_column_list(output)
    return _boolean_cache[table_name]


def escape_sql_value(val, col_name, nullable_cols, boolean_cols):
    """Escape a value for SQL INSERT statements."""
    if val == "":
        if col_name in nullable_cols:
            return "NULL"
        else:
            # NOT NULL column: use empty string for text, 0 for numeric
            return "''"
    if col_name in boolean_cols:
        if val == "t":
            return "TRUE"
        if val == "f":
            return "FALSE"
    # Escape single quotes
    escaped = val.replace("'", "''")
    return f"'{escaped}'"


def import_table_data(table_name, headers, rows, environment, dry_run=False):
    """Import data into a table using batched INSERT statements."""
    if not rows:
        print(f"  No data to import for {table_name}")
        return True

    if dry_run:
        print(f"  [DRY RUN] Would import {len(rows)} rows into {table_name}")
        return True

    switch_environment(environment)

    # Get column metadata for proper NULL/empty handling
    nullable_cols = get_nullable_cached(table_name, environment)
    boolean_cols = get_boolean_columns(table_name, environment)

    # Build INSERT statements in batches of 20 rows
    col_list = ", ".join(headers)
    batch_size = 20
    total_imported = 0

    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        values_list = []
        for row in batch:
            vals = ", ".join(
                escape_sql_value(v, headers[j], nullable_cols, boolean_cols)
                for j, v in enumerate(row)
            )
            values_list.append(f"({vals})")

        sql = f"INSERT INTO {table_name} ({col_list}) VALUES\n" + ",\n".join(values_list) + ";"
        output = run_railway_sql(sql, environment)

        # Check for errors in psql output
        if output and "ERROR" in output:
            print(f"  IMPORT ERROR for {table_name} (batch {i}): {output.strip()}", file=sys.stderr)
            return False

        total_imported += len(batch)

    return True


def create_inventory_levels(environment, dry_run=False):
    """Create inventory_level entries for all inventory_items in staging."""
    if dry_run:
        print("  [DRY RUN] Would create inventory_level entries")
        return True

    switch_environment(environment)
    sql = f"""
INSERT INTO inventory_level (id, inventory_item_id, location_id, stocked_quantity, reserved_quantity, incoming_quantity, metadata, created_at, updated_at, deleted_at)
SELECT
    'iloc_' || substr(md5(random()::text), 1, 28),
    ii.id,
    '{STAGING_STOCK_LOCATION}',
    100,
    0,
    0,
    NULL,
    NOW(),
    NOW(),
    NULL
FROM inventory_item ii
WHERE NOT EXISTS (
    SELECT 1 FROM inventory_level il
    WHERE il.inventory_item_id = ii.id
    AND il.location_id = '{STAGING_STOCK_LOCATION}'
);
"""
    output = run_railway_sql(sql, environment)
    return True


def main():
    parser = argparse.ArgumentParser(
        description="Clone production catalog data to staging"
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Preview what would be cloned without making changes"
    )
    parser.add_argument(
        "--tables", choices=["all", "core", "custom"], default="all",
        help="Which tables to clone (default: all)"
    )
    args = parser.parse_args()

    mode = "DRY RUN" if args.dry_run else "LIVE"
    print(f"\n{'='*60}")
    print(f"  Production → Staging Catalog Clone ({mode})")
    print(f"  Tables: {args.tables}")
    print(f"  Started: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print(f"{'='*60}\n")

    # Select tables based on --tables flag
    if args.tables == "core":
        tables = CORE_TABLES
    elif args.tables == "custom":
        tables = CUSTOM_TABLES
    else:
        tables = ALL_TABLES

    # Phase 1: Export from production
    print("Phase 1: Exporting from production...")
    print("-" * 40)
    exported_data = {}
    for table in tables:
        headers, rows = export_table(table, "production")
        exported_data[table] = (headers, rows)
        print(f"  {table}: {len(rows)} rows")

    total_rows = sum(len(rows) for _, rows in exported_data.values())
    print(f"\nTotal rows exported: {total_rows}\n")

    if total_rows == 0:
        print("No data to clone. Exiting.")
        return

    # Phase 2: Apply remapping
    print("Phase 2: Remapping IDs...")
    print("-" * 40)
    for table in tables:
        if table in REMAP_RULES:
            headers, rows = exported_data[table]
            remapped = [remap_row(table, headers, row) for row in rows]
            exported_data[table] = (headers, remapped)
            print(f"  {table}: remapped {len(remapped)} rows")
            for col, mapping in REMAP_RULES[table].items():
                for old_id, new_id in mapping.items():
                    print(f"    {col}: {old_id[:20]}... → {new_id[:20]}...")
    print()

    # Phase 3: Clean staging data
    print("Phase 3: Cleaning staging data...")
    print("-" * 40)
    # Delete in reverse order to respect FK constraints
    for table in reversed(tables):
        delete_table_data(table, "staging", dry_run=args.dry_run)
        if not args.dry_run:
            print(f"  Deleted from {table}")
        else:
            pass  # dry-run message already printed

    # Also clean inventory_level for staging stock location
    if "inventory_item" in tables:
        if not args.dry_run:
            switch_environment("staging")
            run_railway_sql("DELETE FROM inventory_level;", "staging")
            print("  Deleted from inventory_level")
        else:
            print("  [DRY RUN] Would DELETE FROM inventory_level")
    print()

    # Phase 4: Import into staging
    print("Phase 4: Importing into staging...")
    print("-" * 40)
    errors = []
    for table in tables:
        headers, rows = exported_data[table]
        if rows:
            success = import_table_data(table, headers, rows, "staging", dry_run=args.dry_run)
            if success:
                if not args.dry_run:
                    print(f"  {table}: imported {len(rows)} rows")
            else:
                errors.append(table)
                print(f"  {table}: FAILED")
        else:
            print(f"  {table}: skipped (no data)")

    # Phase 5: Create inventory levels
    if "inventory_item" in tables:
        print("\nPhase 5: Creating inventory levels...")
        print("-" * 40)
        create_inventory_levels("staging", dry_run=args.dry_run)
        if not args.dry_run:
            print("  Created inventory levels for staging stock location")

    # Phase 6: Verify
    if not args.dry_run:
        print("\nPhase 6: Verifying staging data...")
        print("-" * 40)
        switch_environment("staging")
        mismatches = []
        for table in tables:
            expected = len(exported_data[table][1])
            sql = f"SELECT count(*) FROM {table};"
            output = run_railway_sql(sql, "staging")
            actual = 0
            for line in output.strip().split("\n"):
                line = line.strip()
                if line.isdigit():
                    actual = int(line)
                    break
            status = "OK" if actual == expected else "MISMATCH"
            if status == "MISMATCH":
                mismatches.append(table)
            print(f"  {table}: {actual}/{expected} {status}")

        if mismatches:
            print(f"\n  WARNING: Mismatches in: {', '.join(mismatches)}")
            errors.extend(mismatches)

    # Summary
    print(f"\n{'='*60}")
    print(f"  Clone Complete ({mode})")
    print(f"  Tables processed: {len(tables)}")
    print(f"  Total rows: {total_rows}")
    if errors:
        print(f"  ERRORS: {', '.join(errors)}")
    else:
        print(f"  Errors: none")
    print(f"{'='*60}\n")

    if args.dry_run:
        print("This was a dry run. Run without --dry-run to apply changes.\n")

    # Restore staging context
    switch_environment("staging")


if __name__ == "__main__":
    main()
