#!/usr/bin/env python3
import argparse
import csv
import json
import os
import re
import sys
from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional, Tuple
import urllib.request
import urllib.error

DEFAULT_BACKEND_URL = "https://tableclay-production.up.railway.app"
DEFAULT_CSV_PATH = "Product Research - Sheet1 (1).csv"


def http_json(method: str, url: str, data=None, headers: Optional[Dict[str, str]] = None):
    payload = None
    if data is not None:
        payload = json.dumps(data).encode()
    req = urllib.request.Request(url, data=payload, method=method)
    req.add_header("Content-Type", "application/json")
    if headers:
        for key, value in headers.items():
            req.add_header(key, value)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as exc:
        body = exc.read().decode()
        raise RuntimeError(f"{method} {url} failed {exc.code}: {body}")


def normalize_name(name: str) -> str:
    normalized = name.lower()
    normalized = normalized.replace("&", "and")
    normalized = normalized.replace("boal", "bowl")
    normalized = normalized.replace("jewlery", "jewelry")
    normalized = normalized.replace("tripple", "triple")
    normalized = re.sub(r"[^a-z0-9\s]", " ", normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return normalized


def parse_price_to_cents(price_str: str) -> int:
    value = Decimal(price_str.strip())
    return int((value * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def stable_rating(seed: str) -> float:
    choices = [4.7, 4.8, 4.9]
    total = sum(ord(ch) for ch in seed)
    return choices[total % len(choices)]


def load_csv_rows(path: str) -> List[Dict[str, str]]:
    with open(path, newline="") as csvfile:
        reader = csv.DictReader(csvfile)
        return [row for row in reader if row.get("Name")]


def fetch_all_products(headers: Dict[str, str], backend_url: str):
    products: List[Dict[str, object]] = []
    limit = 100
    offset = 0
    while True:
        resp = http_json(
            "GET",
            f"{backend_url}/admin/products?limit={limit}&offset={offset}&fields=+variants.id,+variants.prices",
            headers=headers,
        )
        batch = resp.get("products") or []
        products.extend(batch)
        if len(batch) < limit:
            break
        offset += limit
    return products


def build_product_index(products: List[Dict[str, object]]):
    index: Dict[str, List[Dict[str, object]]] = defaultdict(list)
    for product in products:
        title = product.get("title") or ""
        index[normalize_name(str(title))].append(product)
    return index


def build_alias_map() -> Dict[str, str]:
    alias_pairs = {
        "Blue and Pink Cloud Mug & Plate": "Blue and Pink Mug & Saucer Set (x2 mugs)",
        "Flower / Lotus / Willow / Etc.": "Ceramic Toothpick Holder",
        "Flower / Lotus / Willow / Etc. With Cover": "Toothpick Holder with Cover",
        "Leaf Jewlery Holder With Bird": "Leaf Jewelry Holder with Bird",
        "Star Bowl": "Flower Bowl",
        "Tripple Vase": "Triple Vase Set",
        "flower Mug x 4": "Flower Mug Set (4 Pieces)",
        "Bow Pot with glass lid": "Bow Ramen Bowl with Glass Lid",
        "Cute Painting Boal": "Vintage Painted Bowl",
        "6 multi color mini pots": "Mini Ceramic Pots Set (6 Pieces)",
        "Round Vase": "Round Circular Vase",
        "Ash Tray": "Ceramic Ash Tray",
        "Japanese 7.5 inch bowl": "Japanese 7.5\" Bowl",
    }
    normalized = {}
    for csv_name, product_title in alias_pairs.items():
        normalized[normalize_name(csv_name)] = product_title
    return normalized


def resolve_product(
    row: Dict[str, str],
    product_index: Dict[str, List[Dict[str, object]]],
    alias_map: Dict[str, str],
) -> Tuple[Optional[Dict[str, object]], Optional[str]]:
    name = row.get("Name", "").strip()
    normalized = normalize_name(name)
    direct_matches = product_index.get(normalized, [])
    if len(direct_matches) == 1:
        return direct_matches[0], None

    if normalized in alias_map:
        target_title = alias_map[normalized]
        alias_matches = product_index.get(normalize_name(target_title), [])
        if len(alias_matches) == 1:
            return alias_matches[0], None
        return None, f"Alias target not found: {target_title}"

    if len(direct_matches) > 1:
        return None, f"Ambiguous match for '{name}'"

    return None, f"No match for '{name}'"


def extract_usd_price(variant: Dict[str, object]) -> Optional[int]:
    prices = variant.get("prices") or []
    for price in prices:
        if price.get("currency_code") == "usd":
            return int(price.get("amount", 0))
    return None


def update_variant_price(
    backend_url: str,
    headers: Dict[str, str],
    product_id: str,
    variant_id: str,
    amount: int,
    apply_changes: bool,
):
    payload = {"prices": [{"currency_code": "usd", "amount": amount}]}
    if not apply_changes:
        return payload
    return http_json(
        "POST",
        f"{backend_url}/admin/products/{product_id}/variants/{variant_id}",
        data=payload,
        headers=headers,
    )


def upsert_review_stats(
    backend_url: str,
    headers: Dict[str, str],
    product_id: str,
    average_rating: float,
    total_count: int,
    apply_changes: bool,
):
    payload = {
        "product_id": product_id,
        "average_rating": average_rating,
        "total_count": total_count,
    }
    if not apply_changes:
        return payload
    return http_json(
        "POST",
        f"{backend_url}/admin/reviews/product-stats",
        data=payload,
        headers=headers,
    )


def main():
    parser = argparse.ArgumentParser(description="Sync product prices and review stats from CSV.")
    parser.add_argument("--csv", default=DEFAULT_CSV_PATH, help="Path to CSV file")
    parser.add_argument("--backend-url", default=os.environ.get("BACKEND_URL", DEFAULT_BACKEND_URL))
    parser.add_argument("--admin-email", default=os.environ.get("ADMIN_EMAIL"))
    parser.add_argument("--admin-password", default=os.environ.get("ADMIN_PASSWORD"))
    parser.add_argument("--apply", action="store_true", help="Apply changes (default is dry run)")
    args = parser.parse_args()

    if not args.admin_email or not args.admin_password:
        print("Missing ADMIN_EMAIL or ADMIN_PASSWORD env vars.", file=sys.stderr)
        sys.exit(1)

    rows = load_csv_rows(args.csv)

    auth = http_json(
        "POST",
        f"{args.backend_url}/auth/user/emailpass",
        data={"email": args.admin_email, "password": args.admin_password},
    )
    token = auth.get("token")
    if not token:
        print("Failed to obtain admin token.", file=sys.stderr)
        sys.exit(1)

    headers = {"Authorization": f"Bearer {token}"}

    products = fetch_all_products(headers, args.backend_url)
    product_index = build_product_index(products)
    alias_map = build_alias_map()

    unmatched = []
    price_updates = []
    stats_updates = []

    for row in rows:
        product, error = resolve_product(row, product_index, alias_map)
        if not product:
            unmatched.append({"name": row.get("Name"), "error": error})
            continue

        product_id = product.get("id")
        product_title = product.get("title")
        target_price = parse_price_to_cents(row.get("Price", "0"))
        review_count = int(Decimal(row.get("# of Reviews", "0")))
        average_rating = stable_rating(str(product_id))

        variants = product.get("variants") or []
        for variant in variants:
            current_price = extract_usd_price(variant)
            if current_price != target_price:
                price_updates.append({
                    "product": product_title,
                    "variant_id": variant.get("id"),
                    "from": current_price,
                    "to": target_price,
                })
                update_variant_price(
                    args.backend_url,
                    headers,
                    str(product_id),
                    str(variant.get("id")),
                    target_price,
                    args.apply,
                )

        stats_updates.append({
            "product": product_title,
            "product_id": product_id,
            "total_count": review_count,
            "average_rating": average_rating,
        })
        upsert_review_stats(
            args.backend_url,
            headers,
            str(product_id),
            average_rating,
            review_count,
            args.apply,
        )

    summary = {
        "apply": args.apply,
        "price_updates": len(price_updates),
        "stats_updates": len(stats_updates),
        "unmatched": unmatched,
    }

    print(json.dumps(summary, indent=2))

    if price_updates:
        print("\nPrice changes:")
        for item in price_updates:
            print(
                f"- {item['product']} ({item['variant_id']}): {item['from']} -> {item['to']}"
            )

    if stats_updates:
        print("\nReview stats updates:")
        for item in stats_updates:
            print(
                f"- {item['product']}: total_count={item['total_count']} average_rating={item['average_rating']}"
            )

    if unmatched:
        print("\nUnmatched CSV rows:")
        for item in unmatched:
            print(f"- {item['name']}: {item['error']}")


if __name__ == "__main__":
    main()
