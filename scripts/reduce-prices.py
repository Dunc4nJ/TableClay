#!/usr/bin/env python3
"""
Reduce all product prices by $5 via Medusa Admin API.

Usage:
    python scripts/reduce-prices.py --dry-run    # Test without making changes
    python scripts/reduce-prices.py              # Apply changes to production
"""

import urllib.request
import json
import argparse
import sys

BASE_URL = "https://tableclay-production.up.railway.app"
AUTH_EMAIL = "tableclayy@gmail.com"
AUTH_PASSWORD = "Table.clay!"
REDUCTION_CENTS = 500  # $5 in cents
MIN_PRICE_CENTS = 500  # Don't reduce below $5


def get_auth_token():
    """Authenticate with Admin API and return JWT token."""
    auth_data = json.dumps({
        "email": AUTH_EMAIL,
        "password": AUTH_PASSWORD
    }).encode()

    req = urllib.request.Request(
        f"{BASE_URL}/auth/user/emailpass",
        data=auth_data,
        headers={"Content-Type": "application/json"}
    )

    try:
        response = urllib.request.urlopen(req)
        data = json.loads(response.read())
        return data.get("token")
    except urllib.error.HTTPError as e:
        print(f"Authentication failed: {e.code} {e.reason}")
        print(e.read().decode())
        sys.exit(1)


def get_all_products(token):
    """Fetch all products with their variants."""
    req = urllib.request.Request(
        f"{BASE_URL}/admin/products?limit=100",
        headers={"Authorization": f"Bearer {token}"}
    )

    try:
        response = urllib.request.urlopen(req)
        data = json.loads(response.read())
        return data.get("products", [])
    except urllib.error.HTTPError as e:
        print(f"Failed to fetch products: {e.code} {e.reason}")
        print(e.read().decode())
        sys.exit(1)


def update_variant_price(token, product_id, variant_id, new_price, dry_run=False):
    """Update a variant's price."""
    if dry_run:
        return True

    update_data = json.dumps({
        "prices": [
            {
                "currency_code": "usd",
                "amount": new_price
            }
        ]
    }).encode()

    req = urllib.request.Request(
        f"{BASE_URL}/admin/products/{product_id}/variants/{variant_id}",
        data=update_data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        },
        method="POST"
    )

    try:
        urllib.request.urlopen(req)
        return True
    except urllib.error.HTTPError as e:
        print(f"  ERROR updating variant {variant_id}: {e.code} {e.reason}")
        try:
            print(f"  {e.read().decode()}")
        except:
            pass
        return False


def get_variant_price(variant):
    """Extract USD price from variant prices array."""
    prices = variant.get("prices", [])
    for price in prices:
        if price.get("currency_code") == "usd":
            return price.get("amount")
    return None


def main():
    parser = argparse.ArgumentParser(description="Reduce all product prices by $5")
    parser.add_argument("--dry-run", action="store_true", help="Test without making changes")
    args = parser.parse_args()

    mode = "DRY RUN" if args.dry_run else "PRODUCTION"
    print(f"\n=== Price Reduction Script ({mode}) ===\n")

    # Authenticate
    print("Authenticating...")
    token = get_auth_token()
    print("Authentication successful.\n")

    # Fetch products
    print("Fetching products...")
    products = get_all_products(token)
    print(f"Found {len(products)} products.\n")

    # Process each product
    changes_made = 0
    skipped = 0
    errors = 0

    for product in products:
        product_title = product.get("title", "Unknown")
        product_id = product.get("id")
        variants = product.get("variants", [])

        print(f"Product: {product_title}")

        for variant in variants:
            variant_id = variant.get("id")
            variant_title = variant.get("title", "Default")
            current_price = get_variant_price(variant)

            if current_price is None:
                print(f"  - {variant_title}: No USD price found, skipping")
                skipped += 1
                continue

            new_price = current_price - REDUCTION_CENTS

            if new_price < MIN_PRICE_CENTS:
                print(f"  - {variant_title}: ${current_price/100:.2f} -> Would be ${new_price/100:.2f} (below min), SKIPPING")
                skipped += 1
                continue

            print(f"  - {variant_title}: ${current_price/100:.2f} -> ${new_price/100:.2f}", end="")

            if args.dry_run:
                print(" [DRY RUN]")
                changes_made += 1
            else:
                success = update_variant_price(token, product_id, variant_id, new_price)
                if success:
                    print(" [UPDATED]")
                    changes_made += 1
                else:
                    print(" [FAILED]")
                    errors += 1

        print()

    # Summary
    print("=" * 50)
    print(f"Summary ({mode}):")
    print(f"  Changes {'would be made' if args.dry_run else 'made'}: {changes_made}")
    print(f"  Skipped (below min price or no USD): {skipped}")
    print(f"  Errors: {errors}")
    print("=" * 50)

    if args.dry_run:
        print("\nThis was a dry run. Run without --dry-run to apply changes.")


if __name__ == "__main__":
    main()
