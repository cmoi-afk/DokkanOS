#!/usr/bin/env python3
"""Construit le socle canonique v1 à partir du catalogue courant, sans modifier catalog.json."""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
src=json.loads((ROOT/"catalog.json").read_text(encoding="utf-8"))
allowed={"LR","UR","SSR","SR"}
nonplay=re.compile(r"(statue de (?:m\.?|mr\.?|hercule)|hercule statue)",re.I)
cards=[]; rejected=[]; seen=set()
for c in src.get("cards",[]):
    cid=str(c.get("id") or "").strip()
    reasons=[]
    if not cid or not cid.isdigit(): reasons.append("ID canonique invalide")
    if cid in seen: reasons.append("ID dupliqué")
    if c.get("rarity") not in allowed: reasons.append("rareté hors périmètre")
    if nonplay.search(c.get("name") or ""): reasons.append("entrée non jouable")
    if c.get("rarity")=="SR" and not c.get("awakensTo"): reasons.append("SR sans éveil utile vérifié")
    if reasons:
        rejected.append({"id":cid,"name":c.get("name"),"reasons":reasons}); continue
    seen.add(cid)
    cards.append({
      "id":cid,"name":c.get("name") or "","title":c.get("title") or "",
      "rarity":c.get("rarity"),"type":c.get("type"),"class":c.get("class") or "",
      "image":c.get("image") or "",
      **({"awakensTo":str(c["awakensTo"])} if c.get("awakensTo") else {}),
      **({"awakensFrom":str(c["awakensFrom"])} if c.get("awakensFrom") else {}),
      "legacySource":c.get("source") or c.get("attributeSource") or None
    })
out={"version":"1.0-refonte-draft","status":"draft","sourceVersion":src.get("version"),"cards":cards}
(ROOT/"catalog-v1.draft.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
report={"sourceCards":len(src.get("cards",[])),"accepted":len(cards),"rejected":len(rejected),"uniqueAccepted":len({c["id"] for c in cards}),"rejectedItems":rejected}
(ROOT/"docs/CATALOG-REFONTE-v1.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps({k:v for k,v in report.items() if k!="rejectedItems"},ensure_ascii=False))
