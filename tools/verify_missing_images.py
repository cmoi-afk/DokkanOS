#!/usr/bin/env python3
"""Résout uniquement les miniatures sans image qui répondent avec un type image."""
import json
import urllib.request
from pathlib import Path

root = Path(__file__).resolve().parents[1]
path = root / "catalog.json"
data = json.loads(path.read_text(encoding="utf-8"))
resolved, pending = [], []
for card in data["cards"]:
    if card.get("image"):
        continue
    card_id = str(card["id"])
    url = f"https://www.dbz-dokkanbattle.com/img/character/thumb/card_{card_id}_thumb/card_{card_id}_thumb.png"
    try:
        request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(request, timeout=20) as response:
            body = response.read(16)
            valid = response.status == 200 and response.headers.get("Content-Type", "").startswith("image/") and body.startswith(bytes([137, 80, 78, 71]))
        if valid:
            card["image"] = url
            resolved.append(card_id)
        else:
            pending.append(card_id)
    except Exception:
        pending.append(card_id)
path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
report = root / "docs" / "IMAGE-AUDIT-v0.7.json"
report.write_text(json.dumps({"verifiedAndFilled": resolved, "stillMissing": pending}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Images vérifiées: {len(resolved)}; encore absentes: {len(pending)}")
