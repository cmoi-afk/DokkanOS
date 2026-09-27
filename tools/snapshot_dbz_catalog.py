#!/usr/bin/env python3
"""Capture les attributs publics des cartes listées par DBZ Dokkan Battle France."""
import json
import urllib.request
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
URL = "https://www.dbz-dokkanbattle.com/cards"
RARITY = {0: "N", 1: "R", 2: "SR", 3: "SSR", 4: "UR", 5: "LR"}
TYPE = {0: "AGI", 1: "TEC", 2: "INT", 3: "PUI", 4: "END"}
CLASS = {1: "Super", 2: "Extrême"}


class Cards(HTMLParser):
    def __init__(self):
        super().__init__()
        self.items = {}

    def handle_starttag(self, tag, attrs):
        attr = dict(attrs)
        card_id = attr.get("data-id")
        if not card_id or not card_id.isdigit() or "data-rarity" not in attr:
            return
        try:
            rarity = RARITY[int(attr["data-rarity"])]
            element = int(attr["data-element"])
            card_type = TYPE[element]
            card_class = CLASS.get(int(attr.get("data-classe") or 0), "")
        except (KeyError, TypeError, ValueError):
            return
        card = {
            "id": card_id,
            "name": attr.get("data-character") or "",
            "rarity": rarity,
            "type": card_type,
            "class": card_class,
            "hasDokkan": attr.get("data-has-dokkan"),
            "url": "https://www.dbz-dokkanbattle.com/card/" + card_id,
        }
        previous = self.items.get(card_id)
        if previous and (previous["rarity"], previous["type"]) != (rarity, card_type):
            raise ValueError("attributs contradictoires pour " + card_id)
        self.items[card_id] = card


def main():
    req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=45) as response:
        page = response.read().decode("utf-8", "ignore")
    parser = Cards()
    parser.feed(page)
    if len(parser.items) < 1000:
        raise ValueError(f"liste incomplète : {len(parser.items)} IDs")
    for card_id, card in parser.items.items():
        path = f"/img/character/thumb/card_{card_id}_thumb/card_{card_id}_thumb.png"
        if path in page:
            card["image"] = "https://www.dbz-dokkanbattle.com" + path
    entries = sorted(parser.items.values(), key=lambda row: int(row["id"]))
    out = {"provider": "DBZ Dokkan Battle France", "url": URL,
           "count": len(entries),
           "rarities": dict(Counter(row["rarity"] for row in entries)),
           "cards": entries}
    path = ROOT / "docs" / "DBZ-CARD-INDEX-v0.7.json"
    path.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Index direct: {len(entries)} IDs; images: {sum('image' in x for x in entries)}")
    print("Raretés", out["rarities"])


if __name__ == "__main__":
    main()
