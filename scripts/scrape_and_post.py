import cianparser
import requests
import os
import sys

API_URL = os.environ.get('API_URL')
if not API_URL:
    print("ERROR: API_URL environment variable not set")
    sys.exit(1)

# Cian may block default UA – use a real browser string
headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

print("Scraping Cian for Moscow FSBO listings...")

try:
    parser = cianparser.CianParser(location="Москва")
    flats = parser.get_flats(
        deal_type="sale",
        rooms=(1, 4),
        additional_settings={"start_page": 1, "end_page": 3}
    )
except Exception as e:
    print(f"Scraping error: {e}")
    sys.exit(1)

fsbo_leads = []
for flat in flats:
    desc = flat.get("description", "").lower()
    if "собственник" in desc:
        fsbo_leads.append({
            "address": flat.get("address"),
            "price": flat.get("price"),
            "owner_name": flat.get("owner_name", ""),
            "phone": flat.get("phone", ""),
            "days_on_market": flat.get("days_on_market", 0)
        })

if not fsbo_leads:
    print("No FSBO leads found.")
    sys.exit(0)

print(f"Sending {len(fsbo_leads)} leads to {API_URL}")

# Use a timeout and custom headers for the POST request
try:
    response = requests.post(
        API_URL,
        json=fsbo_leads,
        headers={"Content-Type": "application/json", "User-Agent": headers["User-Agent"]},
        timeout=60
    )
    if response.status_code == 200:
        print("Success:", response.json())
    else:
        print(f"Error {response.status_code}: {response.text}")
        sys.exit(1)
except Exception as e:
    print(f"Request error: {e}")
    sys.exit(1)