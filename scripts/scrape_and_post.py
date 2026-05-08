import requests
from bs4 import BeautifulSoup
import re
import os
import sys
import time

API_URL = os.environ.get('API_URL')
if not API_URL:
    print("ERROR: API_URL environment variable not set")
    sys.exit(1)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

def scrape_cian_fsbo(max_pages=3):
    leads = []
    for page in range(1, max_pages+1):
        url = f"https://www.cian.ru/cat.php?deal_type=sale&engine_version=2&offer_type=flat&p={page}&region=1&room1=1&room2=1&room3=1&room4=1&room5=1&room6=1"
        print(f"Fetching {url}")
        try:
            resp = requests.get(url, headers=HEADERS, timeout=30)
            if resp.status_code != 200:
                print(f"Failed page {page}, status {resp.status_code}")
                continue
            soup = BeautifulSoup(resp.text, 'html.parser')
            # Find all listing containers
            listings = soup.find_all('div', {'data-name': 'CardComponent'})
            if not listings:
                # Fallback selector (sometimes class changes)
                listings = soup.find_all('article', class_=re.compile('_93444fe79'))
            for card in listings:
                # Check if "собственник" appears anywhere in the card
                if "собственник" not in str(card).lower():
                    continue
                # Extract address
                addr_elem = card.find('span', class_=re.compile('address'))
                address = addr_elem.text.strip() if addr_elem else None
                # Extract price
                price_elem = card.find('span', class_=re.compile('price'))
                price_text = price_elem.text.replace('₽', '').replace(' ', '').strip() if price_elem else None
                price = int(price_text) if price_text and price_text.isdigit() else None
                # Owner name placeholder (Cian doesn't show owner on listing page)
                owner_name = "Собственник"
                # Phone placeholder
                phone = None
                # Days on market (not easily available on listing page)
                days_on_market = None
                leads.append({
                    "address": address,
                    "price": price,
                    "owner_name": owner_name,
                    "phone": phone,
                    "days_on_market": days_on_market
                })
            # Be nice to the server
            time.sleep(1)
        except Exception as e:
            print(f"Error on page {page}: {e}")
    return leads

if __name__ == "__main__":
    print("Scraping Cian FSBO listings...")
    leads = scrape_cian_fsbo(max_pages=2)
    print(f"Found {len(leads)} FSBO leads.")
    if leads:
        print(f"Sending to {API_URL}")
        resp = requests.post(API_URL, json=leads, headers={"Content-Type": "application/json"}, timeout=60)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            print("Success:", resp.json())
        else:
            print("Error:", resp.text)
            sys.exit(1)
    else:
        print("No leads found. Exiting.")
        sys.exit(0)