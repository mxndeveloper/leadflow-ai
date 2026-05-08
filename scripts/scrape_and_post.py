import os
import sys
import json
import requests
import time
from urllib.parse import urlencode

API_URL = os.environ.get('API_URL')
if not API_URL:
    print("ERROR: API_URL environment variable not set")
    sys.exit(1)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def scrape_with_cianparser():
    """Try using the cianparser library (if available)"""
    try:
        import cianparser
        print("Using cianparser library...")
        # Create parser with custom headers
        parser = cianparser.CianParser(location="Москва")
        # Force only first page to avoid infinite loop
        flats = parser.get_flats(
            deal_type="sale",
            rooms=(1, 4),
            additional_settings={"start_page": 1, "end_page": 1}
        )
        leads = []
        for flat in flats:
            desc = flat.get("description", "").lower()
            if "собственник" in desc:
                leads.append({
                    "address": flat.get("address"),
                    "price": flat.get("price"),
                    "owner_name": flat.get("owner_name", ""),
                    "phone": flat.get("phone", ""),
                    "days_on_market": flat.get("days_on_market", 0)
                })
        print(f"cianparser found {len(leads)} FSBO leads")
        return leads
    except Exception as e:
        print(f"cianparser failed: {e}")
        return None

def scrape_direct():
    """Fallback: fetch search page and parse manually"""
    print("Falling back to direct HTTP scraping...")
    leads = []
    base_url = "https://www.cian.ru/cat.php"
    params = {
        'deal_type': 'sale',
        'engine_version': '2',
        'offer_type': 'flat',
        'p': 1,
        'region': 1,
        'room1': 1,
        'room4': 1
    }
    url = f"{base_url}?{urlencode(params)}"
    print(f"Fetching {url}")
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        # Quick regex to find "собственник" and extract address and price
        # This is primitive but works when full parsing fails
        import re
        # Look for JSON-like data embedded in page (Cian uses window.__initialState__)
        # Simpler: find all listing blocks
        # We'll use a simple regex to extract address and price from owner listings
        owner_matches = re.findall(r'(?s)собственник.*?"address":"([^"]+)".*?"bargainTerm":\{"price":(\d+)', resp.text, re.IGNORECASE)
        for match in owner_matches:
            address, price = match
            leads.append({
                "address": address,
                "price": int(price),
                "owner_name": "Собственник",
                "phone": None,
                "days_on_market": None
            })
        # Alternative: find divs with specific class (more robust)
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(resp.text, 'html.parser')
        for card in soup.find_all('div', {'data-name': 'CardComponent'}):
            if 'собственник' in str(card).lower():
                addr = card.find('span', class_='_93444fe79')  # may vary
                price_span = card.find('span', {'data-mark': 'Price'})
                if addr and price_span:
                    address = addr.get_text(strip=True)
                    price_text = price_span.get_text(strip=True).replace('₽', '').replace(' ', '')
                    price = int(price_text) if price_text.isdigit() else None
                    leads.append({
                        "address": address,
                        "price": price,
                        "owner_name": "Собственник",
                        "phone": None,
                        "days_on_market": None
                    })
        print(f"Direct scraper found {len(leads)} leads")
        return leads
    except Exception as e:
        print(f"Direct scraping failed: {e}")
        return []

def main():
    leads = scrape_with_cianparser()
    if leads is None:
        leads = scrape_direct()
    if not leads:
        print("No FSBO leads found. Exiting.")
        sys.exit(0)
    print(f"Total leads to send: {len(leads)}")
    # Send in batches of 10 (avoid too large payload)
    batch_size = 10
    for i in range(0, len(leads), batch_size):
        batch = leads[i:i+batch_size]
        try:
            resp = requests.post(API_URL, json=batch, headers={"Content-Type": "application/json"}, timeout=60)
            if resp.status_code == 200:
                print(f"Batch {i//batch_size + 1} inserted: {resp.json().get('inserted', 0)}")
            else:
                print(f"Batch failed: {resp.status_code} - {resp.text}")
        except Exception as e:
            print(f"Request error: {e}")
    print("Scraping completed.")

if __name__ == "__main__":
    main()