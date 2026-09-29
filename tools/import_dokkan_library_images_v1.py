#!/usr/bin/env python3
"""Import exact-ID thumbnails from the DokkanBattleLibrary archive."""
import json, os, re, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAT = ROOT / "catalog-v1.draft.json"
OUT = ROOT / "assets/cards"
SRC = Path(os.environ["THUMB_DIR"])
OUT.mkdir(parents=True, exist_ok=True)

data = json.loads(CAT.read_text(encoding="utf-8"))
byid = {str(card["id"]): card for card in data["cards"]}

audit_path = ROOT / "docs/IMAGE-AUDIT-FINAL.json"
broken = set()
if audit_path.exists():
    audit = json.loads(audit_path.read_text(encoding="utf-8"))
    broken = {str(item["id"]) for item in audit.get("brokenImages", [])}

pending = {
    cid for cid, card in byid.items()
    if cid in broken or not (card.get("image") or "").startswith("assets/cards/")
}

found = {}
for path in SRC.rglob("*"):
    if not path.is_file() or path.suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp"}:
        continue
    match = re.search(r"(\d{7})", path.stem)
    key = match.group(1) if match else path.stem
    if key in pending:
        found.setdefault(key, path)

recovered = []
for cid, source in found.items():
    ext = ".jpg" if source.suffix.lower() == ".jpeg" else source.suffix.lower()
    dest = OUT / (cid + ext)
    shutil.copy2(source, dest)
    byid[cid]["image"] = dest.relative_to(ROOT).as_posix()
    byid[cid]["imageSource"] = "DokkanBattleLibrary exact card ID"
    recovered.append(cid)

CAT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + chr(10), encoding="utf-8")
remaining = [{"id": cid, "name": byid[cid].get("name")} for cid in pending if cid not in found]
report = {
    "pendingBefore": len(pending),
    "recovered": len(recovered),
    "remaining": len(remaining),
    "recoveredIds": sorted(recovered),
    "remainingItems": sorted(remaining, key=lambda x: x["id"]),
}
(ROOT / "docs/IMAGE-MIGRATION-v1-LIBRARY.json").write_text(
    json.dumps(report, ensure_ascii=False, indent=2) + chr(10), encoding="utf-8"
)
print("pending", len(pending), "recovered", len(recovered), "remaining", len(remaining))
