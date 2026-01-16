#!/usr/bin/env python3
"""
Rename shipping option from "Premium Protection Shipping"
to "Standard Shipping + Premium Protection".

This only changes the display name. The shipping option ID remains the same,
so Stripe integration and checkout flow are unaffected.

Usage:
    python scripts/rename-shipping.py [--dry-run]
"""
import json
import os
import sys
import urllib.request
import urllib.error

DEFAULT_BACKEND_URL = "https://tableclay-production.up.railway.app"
OLD_NAME = "Premium Protection Shipping"
NEW_NAME = "Standard Shipping + Premium Protection"


def http_json(method: str, url: str, data=None, headers=None):
    """Make HTTP request and return JSON response."""
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


def get_admin_token(backend_url: str, email: str, password: str) -> str:
    """Authenticate and get admin JWT token."""
    auth = http_json(
        "POST",
        f"{backend_url}/auth/user/emailpass",
        data={"email": email, "password": password},
    )
    token = auth.get("token")
    if not token:
        raise RuntimeError("Failed to obtain admin token")
    return token


def find_shipping_option(backend_url: str, headers: dict, name: str):
    """Find shipping option by name."""
    response = http_json(
        "GET",
        f"{backend_url}/admin/shipping-options",
        headers=headers,
    )
    options = response.get("shipping_options", [])
    for option in options:
        if option.get("name") == name:
            return option
    return None


def update_shipping_option(backend_url: str, headers: dict, option_id: str, new_name: str, dry_run: bool):
    """Update shipping option name."""
    if dry_run:
        print(f"[DRY RUN] Would update shipping option {option_id} name to: {new_name}")
        return {"dry_run": True, "name": new_name}

    return http_json(
        "POST",
        f"{backend_url}/admin/shipping-options/{option_id}",
        data={"name": new_name},
        headers=headers,
    )


def main():
    dry_run = "--dry-run" in sys.argv

    backend_url = os.environ.get("BACKEND_URL", DEFAULT_BACKEND_URL)
    admin_email = os.environ.get("ADMIN_EMAIL", "tableclayy@gmail.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Table.clay!")

    print(f"Backend URL: {backend_url}")
    print(f"Dry run: {dry_run}")
    print()

    # Authenticate
    print("Authenticating...")
    token = get_admin_token(backend_url, admin_email, admin_password)
    headers = {"Authorization": f"Bearer {token}"}
    print("Authenticated successfully")
    print()

    # Find shipping option
    print(f"Looking for shipping option: '{OLD_NAME}'")
    option = find_shipping_option(backend_url, headers, OLD_NAME)

    if not option:
        print(f"ERROR: Shipping option '{OLD_NAME}' not found")
        print("Available shipping options:")
        response = http_json("GET", f"{backend_url}/admin/shipping-options", headers=headers)
        for opt in response.get("shipping_options", []):
            print(f"  - {opt.get('name')} (ID: {opt.get('id')})")
        sys.exit(1)

    option_id = option.get("id")
    current_name = option.get("name")
    print(f"Found shipping option: {option_id}")
    print(f"  Current name: {current_name}")
    print(f"  New name: {NEW_NAME}")
    print()

    # Update
    print("Updating shipping option name...")
    result = update_shipping_option(backend_url, headers, option_id, NEW_NAME, dry_run)

    if dry_run:
        print("[DRY RUN] No changes made")
    else:
        print("Update successful!")
        print(f"  Shipping option {option_id} renamed to: {NEW_NAME}")

    # Verify
    if not dry_run:
        print()
        print("Verifying change...")
        updated_option = find_shipping_option(backend_url, headers, NEW_NAME)
        if updated_option:
            print(f"Verified: Shipping option now named '{updated_option.get('name')}'")
        else:
            print("WARNING: Could not verify the change")

    return 0


if __name__ == "__main__":
    sys.exit(main())
