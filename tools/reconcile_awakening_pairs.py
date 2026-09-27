#!/usr/bin/env python3
"""Relie deux formes adjacentes uniquement si la fiche de base montre les deux."""
import json
import re
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from snapshot_dbz_catalog import Cards

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "catalog.json"
REPORT = ROOT / "docs" / "AWAKENING-PAIR-AUDIT-v0.7.json"
BASE = "https://www.dbz-dokkanbattle.com/card/"


def norm(value):
    return re.sub(r"[^a-z0-9]", "", (value or "").lower())


def check(pair):
    first, second = pair
    try:
        req = urllib.request.Request(BASE + str(first["id"]), headers={"User-Agent":"Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as response:
            page = response.read().decode("utf-8", "ignore")
        parser = Cards()
        parser.feed(page)
        a, b = parser.items.get(str(first["id"])), parser.items.get(str(second["id"]))
        if not a or not b:
            raise ValueError("une des deux formes absente de la page")
        if a["type"] != b["type"] or norm(a["name"]) != norm(b["name"]):
            raise ValueError("type ou nom différents sur la source")
        return first["id"], second["id"], None
    except Exception as exc:
        return first["id"], second["id"], str(exc)[:140]


def main():
    doc = json.loads(CATALOG.read_text(encoding="utf-8"))
    by_id = {str(card["id"]):card for card in doc["cards"]}
    candidates = []
    for first in doc["cards"]:
        if first.get("awakensTo"):
            continue
        second = by_id.get(str(int(first["id"]) + 1))
        if second and first.get("type") == second.get("type") and (
            norm(first.get("name")) == norm(second.get("name"))
        ):
            candidates.append((first, second))
    confirmed, pending = [], []
    with ThreadPoolExecutor(max_workers=2) as pool:
        for a, b, error in pool.map(check, candidates):
            if error:
                pending.append({"from":a,"to":b,"reason":error})
                continue
            by_id[str(a)]["awakensTo"] = str(b)
            by_id[str(a)]["awakeningSource"] = BASE + str(a)
            by_id[str(b)]["awakensFrom"] = str(a)
            confirmed.append({"from":a,"to":b})
    doc["audit"]["exactAwakeningPairs"] = len(confirmed)
    CATALOG.write_text(json.dumps(doc,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    REPORT.write_text(json.dumps({"candidates":len(candidates),"confirmed":confirmed,
                                  "pending":pending},ensure_ascii=False,indent=2)+"\n",
                      encoding="utf-8")
    print(f"Paires: {len(confirmed)}/{len(candidates)} vérifiées")


if __name__ == "__main__":
    main()
