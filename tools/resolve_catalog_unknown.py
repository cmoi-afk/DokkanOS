#!/usr/bin/env python3
"""Résout uniquement les métadonnées encore absentes du catalogue v0.7.

Chaque résultat est lié à une fiche DokkanInfo par ID exact. Les erreurs restent
visibles dans docs/CATALOG-UNKNOWN-v0.7.json pour une reprise ciblée.
"""
import html
import json
import re
import time
import urllib.request
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "catalog.json"
REPORT = ROOT / "docs" / "CATALOG-UNKNOWN-v0.7.json"
BASE = "https://dokkaninfo.com/cards/"
RARITY = {1: "R", 2: "SR", 3: "SSR", 4: "UR", 5: "LR"}
TYPE = {0: "AGI", 1: "TEC", 2: "INT", 3: "PUI", 4: "END"}
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36"


def norm(value):
    return re.sub(r"[^a-z0-9]", "", (value or "").lower())


def fetch(card_id):
    req = urllib.request.Request(BASE + card_id, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=25) as response:
        page = response.read().decode("utf-8", "ignore")
    match = re.search(r'datajson="([^"]*)"', page)
    if not match:
        raise ValueError("datajson absent")
    return json.loads(html.unescape(match.group(1)))


def main():
    doc = json.loads(CATALOG.read_text(encoding="utf-8"))
    pending = [card for card in doc["cards"] if not card.get("rarity") or not card.get("type")]
    resolved, errors = [], []
    for card in pending:
        card_id = str(card["id"])
        try:
            payload = fetch(card_id)
            source = payload.get("card") or {}
            returned_id = str(source.get("id") or "")
            # DokkanInfo may canonicalize legacy form IDs from ...0 to ...1.
            # Accept that only when the canonical ID is exactly +1 and the source name matches.
            canonical_alias = returned_id.isdigit() and card_id.isdigit() and int(returned_id)==int(card_id)+1
            source_name = (source.get("name") or "").replace("\n", " ")
            if returned_id != card_id and not canonical_alias:
                raise ValueError("ID de fiche différent: " + returned_id)
            if source_name and norm(source_name) != norm(card.get("name")):
                raise ValueError("nom différent: " + source_name[:80])
            rarity = RARITY.get(int(source["rarity"]))
            element = int(source["element"])
            card_type = TYPE.get(element % 10)
            if not rarity or not card_type:
                raise ValueError("rareté ou type hors du schéma connu")
            if card.get("rarity") and card["rarity"] != rarity:
                raise ValueError("conflit de rareté")
            if card.get("type") and card["type"] != card_type:
                raise ValueError("conflit de type")
            if not card.get("rarity"):
                card["rarity"] = rarity
            if not card.get("type"):
                card["type"] = card_type
            card["attributeSource"] = {
                "provider": "DokkanInfo GLOBAL",
                "url": BASE + card_id,
                "match": "canonical +1 alias and name" if canonical_alias else "exact card ID and name",
            }
            resolved.append(card_id)
        except Exception as exc:
            errors.append({"id": card_id, "reason": str(exc)[:160]})
        time.sleep(0.3)
    for field in ("rarity", "type"):
        values = Counter(card.get(field) or "inconnu" for card in doc["cards"])
        doc["audit"][field + "Counts"] = dict(sorted(values.items()))
    doc["audit"]["unknownResolvedFromDokkanInfo"] = len(resolved)
    doc["audit"]["unknownPendingAfterDokkanInfo"] = sum(
        not card.get("rarity") for card in doc["cards"]
    )
    CATALOG.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    REPORT.write_text(
        json.dumps({"requested": len(pending), "resolved": resolved, "errors": errors},
                   ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Fiches demandées: {len(pending)} ; résolues: {len(resolved)} ; erreurs: {len(errors)}")


if __name__ == "__main__":
    main()
