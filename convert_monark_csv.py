import csv
import json
import os
import re

# File paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.abspath(os.path.join(BASE_DIR, '../Monark latest - merged all medicines.csv'))
OUTPUT_JS_PATH = os.path.abspath(os.path.join(BASE_DIR, 'src/data/medicines.js'))
OUTPUT_JSON_PATH = os.path.abspath(os.path.join(BASE_DIR, 'src/data/medicines.json'))

print(f"Reading CSV from: {CSV_PATH}")

with open(CSV_PATH, mode='r', encoding='utf-8', errors='replace') as f:
    reader = csv.reader(f)
    rows = list(reader)

header = [c.strip() for c in rows[0] if c.strip()]
print(f"CSV Header detected: {header}")

medicines = []
for idx, row in enumerate(rows[1:], start=1):
    brand = row[0].strip() if len(row) > 0 else ''
    comp = row[1].strip() if len(row) > 1 else ''
    pack = row[2].strip() if len(row) > 2 else ''
    style = row[3].strip() if len(row) > 3 else ''
    mrp = row[4].strip() if len(row) > 4 else ''
    dosage = row[5].strip() if len(row) > 5 else ''
    moq = row[6].strip() if len(row) > 6 else ''

    # Clean whitespace and multiline linebreaks
    brand = ' '.join(brand.split())
    comp = ' '.join(comp.split())
    pack = ' '.join(pack.split())
    style = ' '.join(style.split())
    dosage = ' '.join(dosage.split())
    moq = ' '.join(moq.split())

    packing = f"{pack} {style}".strip() if style else pack

    # Parse MRP
    try:
        current_mrp = float(mrp.replace(',', ''))
    except ValueError:
        current_mrp = mrp if mrp else None

    medicines.append({
        "Sno": idx,
        "Brand Name": brand,
        "Composition": comp,
        "Dosage": dosage if dosage else None,
        "Pack": pack if pack else None,
        "Packing": packing if packing else None,
        "Style": style if style else None,
        "Current Mrp": current_mrp,
        "MOQ": moq if moq else None
    })

# Write to medicines.js
js_content = f"export const medicineDb = {json.dumps(medicines, indent=2, ensure_ascii=False)};\n"
with open(OUTPUT_JS_PATH, mode='w', encoding='utf-8') as f:
    f.write(js_content)

print(f"Successfully converted and exported {len(medicines)} medicines to {OUTPUT_JS_PATH}")

# Also write medicines.json as convenient raw JSON
with open(OUTPUT_JSON_PATH, mode='w', encoding='utf-8') as f:
    json.dump(medicines, f, indent=2, ensure_ascii=False)

print(f"Also saved JSON artifact to {OUTPUT_JSON_PATH}")
