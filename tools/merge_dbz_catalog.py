#!/usr/bin/env python3
"""Réconcilie les fiches de DokkanOS avec les IDs du catalogue français.

La liste publiée fournit les SSR/UR/LR. Les SR sont réservées à une revue
d'éveil séparée. Pour les IDs validés de Box absents de la liste, une fiche
individuelle est contrôlée par ID exact avant de remplir ses champs manquants.
"""
import json
import urllib.request
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from snapshot_dbz_catalog import Cards, RARITY, TYPE

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "catalog.json"
INDEX = ROOT / "docs" / "DBZ-CARD-INDEX-v0.7.json"
REVIEW = ROOT / "docs" / "SR-AWAKENING-REVIEW-v0.7.json"
REPORT = ROOT / "docs" / "DBZ-RECONCILIATION-v0.7.json"
BASE = "https://www.dbz-dokkanbattle.com"
NON_PLAYABLE = ("statue de m. satan", "statue de mr satan", "mr. satan statue", "hercule statue")
VERIFIED_SR_AWAKENINGS = {"1001851": {"name":"Son Gohan (jeune)","reason":"hasDokkan=2 on French reference; retained as useful SR awakening source"}}


def thumb(card_id):
    return f"{BASE}/img/character/thumb/card_{card_id}_thumb/card_{card_id}_thumb.png"


def one(card_id):
    url = f"{BASE}/card/{card_id}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as response:
            page = response.read().decode("utf-8", "ignore")
        parser = Cards()
        parser.feed(page)
        card = parser.items.get(card_id)
        if not card:
            raise ValueError("ID exact absent de la page")
        return card_id, card, None
    except Exception as exc:
        return card_id, None, str(exc)[:160]


def main():
    doc = json.loads(CATALOG.read_text(encoding="utf-8"))
    index = json.loads(INDEX.read_text(encoding="utf-8"))
    by_id = {str(card["id"]): card for card in doc["cards"]}
    if len(by_id) != len(doc["cards"]) or index["count"] < 1000:
        raise ValueError("catalogue ou référence tronqués")
    pending = [cid for cid, card in by_id.items() if not card.get("rarity") or not card.get("type")]
    resolved, errors, conflicts, added, reviewed = [], [], [], [], []
    with ThreadPoolExecutor(max_workers=2) as pool:
        for card_id, source, error in pool.map(one, pending):
            if error:
                errors.append({"id": card_id, "reason": error})
            elif source:
                resolved.append(source)
    source_cards = index["cards"] + resolved
    for source in source_cards:
        card_id = str(source["id"])
        card = by_id.get(card_id)
        if card is None:
            if source["rarity"] == "SR":
                sname=(source.get("name") or "").lower()
                if any(token in sname for token in NON_PLAYABLE):
                    continue
                if card_id in VERIFIED_SR_AWAKENINGS:
                    card = {
                        "sourceId": card_id, "id": card_id, "name": source["name"], "title": "",
                        "rarity": source["rarity"], "type": source["type"], "class": source["class"],
                        "image": source.get("image") or thumb(card_id),
                        "source": {"provider":"DBZ Dokkan Battle France","url":source["url"],"match":"verified SR awakening source"}
                    }
                    by_id[card_id]=card
                    added.append(card_id)
                    continue
                reviewed.append(source)
                continue
            if source["rarity"] not in {"SSR", "UR", "LR"}:
                continue
            card = {
                "sourceId": card_id, "id": card_id, "name": source["name"],
                "title": "", "rarity": source["rarity"], "type": source["type"],
                "class": source["class"], "image": source.get("image") or thumb(card_id),
                "source": {"provider": "DBZ Dokkan Battle France",
                           "url": source["url"], "match": "exact card ID"},
            }
            by_id[card_id] = card
            added.append(card_id)
            continue
        if (card.get("rarity") and card["rarity"] != source["rarity"]) or (
            card.get("type") and card["type"] != source["type"]
        ):
            conflicts.append({"id": card_id, "old": [card.get("rarity"), card.get("type")],
                              "verified": [source["rarity"], source["type"]]})
        card["rarity"] = source["rarity"]
        card["type"] = source["type"]
        if source["class"]:
            card["class"] = source["class"]
        if not card.get("image"):
            card["image"] = source.get("image") or thumb(card_id)
        card["attributeSource"] = {
            "provider": "DBZ Dokkan Battle France", "url": source["url"],
            "match": "exact data-id on public card listing or individual card page",
        }
    # Remove sell-only treasure/statue entries: they are not playable characters.
    removed_non_playable=[]
    for cid, card in list(by_id.items()):
        name=(card.get("name") or "").lower()
        if any(token in name for token in NON_PLAYABLE):
            removed_non_playable.append({"id":cid,"name":card.get("name")})
            del by_id[cid]
    doc["cards"] = sorted(by_id.values(), key=lambda card: int(card["id"]))
    if len(doc["cards"]) != len(by_id):
        raise ValueError("doublons après réconciliation")
    for field in ("rarity", "type"):
        counts = Counter(card.get(field) or "inconnu" for card in doc["cards"])
        doc["audit"][field + "Counts"] = dict(sorted(counts.items()))
    doc["audit"]["count"] = len(doc["cards"])
    doc["audit"]["uniqueIds"] = len(by_id)
    doc["audit"]["duplicateIds"] = 0
    doc["audit"]["nonPlayableRemoved"] = len(removed_non_playable)
    doc["audit"]["frenchReferenceNewCards"] = len(added)
    doc["audit"]["frenchReferenceConflicts"] = len(conflicts)
    doc["audit"]["srAwaitingAwakeningReview"] = len(reviewed)
    REVIEW.write_text(json.dumps({"reason": "éveil utile à vérifier par chaîne d'ID",
                                  "count": len(reviewed), "cards": reviewed},
                                 ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    REPORT.write_text(json.dumps({"referenceCount": index["count"], "added": len(added),
                                  "resolvedFromIndividualPages": len(resolved),
                                  "conflicts": conflicts, "errors": errors,
                                  "nonPlayableRemoved": removed_non_playable},
                                 ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    CATALOG.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Catalogue {len(doc['cards'])}; nouvelles cartes {len(added)}; "
          f"fiches directes {len(resolved)}; conflits {len(conflicts)}; erreurs {len(errors)}")


if __name__ == "__main__":
    main()
