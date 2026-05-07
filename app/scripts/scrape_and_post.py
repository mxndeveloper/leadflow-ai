import cianparser
import requests
import time

# Cian scraper configuration
parser = cianparser.CianParser(location="Москва")
flats = parser.get_flats(
    deal_type="sale",
    rooms=(1, 4),
    additional_settings={"start_page": 1, "end_page": 3}  # adjust pages as needed
)

# Filter FSBO (собственник)
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

# Send to your Next.js API
if fsbo_leads:
    response = requests.post(
        "http://localhost:3000/api/ingest-leads",
        json=fsbo_leads,
        headers={"Content-Type": "application/json"}
    )
    print(f"Sent {len(fsbo_leads)} leads. Response: {response.json()}")
else:
    print("No FSBO leads found.")