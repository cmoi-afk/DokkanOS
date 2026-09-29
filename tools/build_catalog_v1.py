#!/usr/bin/env python3
"""Construit le socle canonique v1 à partir du catalogue courant, sans modifier catalog.json."""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
src=json.loads((ROOT/"catalog.json").read_text(encoding="utf-8"))
meta_path=ROOT/"card-meta.json"
meta=json.loads(meta_path.read_text(encoding="utf-8")).get("cards",{}) if meta_path.exists() else {}
allowed={"LR","UR","SSR","SR"}
nonplay=re.compile(r"(statue de (?:m\.?|mr\.?|hercule)|hercule statue)",re.I)
cards=[]; rejected=[]; seen=set()
by_id={str(c.get("id")):c for c in src.get("cards",[]) if c.get("id")}

def terminal_id(card):
    """Retourne la forme maximale vérifiée de la chaîne, sans deviner les éveils manquants."""
    cur=card; visited=set()
    while cur.get("awakensTo"):
        cid=str(cur.get("id")); nxt=str(cur.get("awakensTo"))
        if cid in visited or nxt not in by_id: break
        visited.add(cid); cur=by_id[nxt]
    return str(cur.get("id") or "")
for c in src.get("cards",[]):
    cid=str(c.get("id") or "").strip()
    reasons=[]
    if not cid or not cid.isdigit(): reasons.append("ID canonique invalide")
    if cid in seen: reasons.append("ID dupliqué")
    if c.get("rarity") not in allowed: reasons.append("rareté hors périmètre")
    if nonplay.search(c.get("name") or ""): reasons.append("entrée non jouable")
    # Une chaîne d’éveil ne doit produire qu’une entrée: sa forme maximale vérifiée.
    terminal=terminal_id(c)
    if terminal and terminal != cid: reasons.append("forme intermédiaire d’une chaîne d’éveil")
    if c.get("rarity")=="SR" and not c.get("awakensFrom") and not c.get("awakensTo"): reasons.append("SR isolé sans chaîne d’éveil vérifiée")
    if reasons:
        rejected.append({"id":cid,"name":c.get("name"),"reasons":reasons}); continue
    seen.add(cid)
    cards.append({
      "id":cid,"name":(official_fr.get("name") if fr_ok else None) or c.get("name") or "",
      "title":(official_fr.get("title") if fr_ok else None) or c.get("title") or "",
      "rarity":c.get("rarity"),"type":c.get("type"),"class":c.get("class") or "",
      "image":c.get("image") or "",
      **({"awakensTo":str(c["awakensTo"])} if c.get("awakensTo") else {}),
      **({"awakensFrom":str(c["awakensFrom"])} if c.get("awakensFrom") else {}),
      "legacySource":c.get("source") or c.get("attributeSource") or None,
      "nameLocale":"fr-official" if fr_ok and official_fr.get("name") else "source",
      "titleLocale":"fr-official" if fr_ok and official_fr.get("title") else "source"
    })
out={"version":"1.0-refonte-draft","status":"draft","sourceVersion":src.get("version"),"cards":cards}
(ROOT/"catalog-v1.draft.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"
",encoding="utf-8")
report={"sourceCards":len(src.get("cards",[])),"accepted":len(cards),"rejected":len(rejected),"uniqueAccepted":len({c["id"] for c in cards}),"intermediateAwakeningsRemoved":sum("forme intermédiaire" in r for x in rejected for r in x["reasons"]),
        "officialFrenchNames":sum(c.get("nameLocale")=="fr-official" for c in cards),
        "officialFrenchTitles":sum(c.get("titleLocale")=="fr-official" for c in cards),
        "sourceNameFallbacks":sum(c.get("nameLocale")!="fr-official" for c in cards),
        "sourceTitleFallbacks":sum(c.get("titleLocale")!="fr-official" for c in cards),
        "rejectedItems":rejected}
(ROOT/"docs/CATALOG-REFONTE-v1.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"
",encoding="utf-8")
print(json.dumps({k:v for k,v in report.items() if k!="rejectedItems"},ensure_ascii=False))
