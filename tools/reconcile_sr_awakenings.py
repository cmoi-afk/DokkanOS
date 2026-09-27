#!/usr/bin/env python3
"""Vérifie les éveils SR explicitement visibles sur la page de chaque carte."""
import json
import re
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from snapshot_dbz_catalog import Cards

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "catalog.json"
REVIEW = ROOT / "docs" / "SR-AWAKENING-REVIEW-v0.7.json"
REPORT = ROOT / "docs" / "SR-AWAKENING-AUDIT-v0.7.json"
BASE = "https://www.dbz-dokkanbattle.com"


def norm(text):
    return re.sub(r"[^a-z0-9]", "", (text or "").lower())


def inspect(source):
    card_id = str(source["id"])
    try:
        req = urllib.request.Request(source["url"], headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as response:
            page = response.read().decode("utf-8", "ignore")
        parsed = Cards()
        parsed.feed(page)
        if card_id not in parsed.items:
            raise ValueError("SR absente de sa page")
        next_id = str(int(card_id) + 1)
        awakened = parsed.items.get(next_id)
        if not awakened:
            return source, None, "forme +1 non affichée sur la page"
        if awakened["rarity"] not in {"SSR", "UR", "LR"}:
            return source, None, "forme +1 sans rareté supérieure"
        if awakened["type"] != source["type"]:
            return source, None, "type différent dans la forme +1"
        if norm(awakened["name"]) != norm(source["name"]):
            return source, None, "nom différent dans la forme +1"
        return source, awakened, None
    except Exception as exc:
        return source, None, str(exc)[:160]


def main():
    doc = json.loads(CATALOG.read_text(encoding="utf-8"))
    review = json.loads(REVIEW.read_text(encoding="utf-8"))
    by_id = {str(card["id"]): card for card in doc["cards"]}
    if len(by_id) != len(doc["cards"]):
        raise ValueError("IDs dupliqués avant revue")
    confirmed, pending = [], []
    with ThreadPoolExecutor(max_workers=2) as pool:
        for source, awakened, reason in pool.map(inspect, review["cards"]):
            card_id = str(source["id"])
            if awakened:
                if card_id in by_id:
                    continue
                by_id[card_id] = {
                    "sourceId": card_id, "id": card_id,
                    "name": source["name"], "title": "",
                    "rarity": "SR", "type": source["type"],
                    "class": source["class"], "image": source.get("image"),
                    "awakensTo": str(awakened["id"]),
                    "awakeningSource": source["url"],
                    "source": {"provider": "DBZ Dokkan Battle France",
                               "url": source["url"], "match": "exact SR and adjacent awakened ID"},
                }
                confirmed.append({"id": card_id, "awakensTo": str(awakened["id"]),
                                  "rarityAfterAwakening": awakened["rarity"]})
            else:
                pending.append({"id": card_id, "reason": reason})
    doc["cards"] = sorted(by_id.values(), key=lambda card: int(card["id"]))
    doc["audit"]["count"] = len(doc["cards"])
    doc["audit"]["uniqueIds"] = len(by_id)
    doc["audit"]["srAwakeningConfirmed"] = len(confirmed)
    doc["audit"]["srAwakeningPending"] = len(pending)
    doc["audit"]["rarityCounts"]["SR"] = sum(
        card.get("rarity") == "SR" for card in doc["cards"]
    )
    CATALOG.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    REPORT.write_text(json.dumps({"requested": review["count"],
                                  "confirmed": confirmed, "pending": pending},
                                 ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"SR vérifiées {len(confirmed)}/{review['count']}; restantes {len(pending)}")


if __name__ == "__main__":
    main()
