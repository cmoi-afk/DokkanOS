#!/usr/bin/env python3
"""Audit global catalogue -> assets locaux, sans modifier les images."""
import json,re,hashlib
from pathlib import Path
R=Path(__file__).resolve().parents[1]; A=R/"assets/cards"
cat_path=(R/"catalog-v1.draft.json") if (R/"catalog-v1.draft.json").exists() else (R/"catalog.json")\ncat=json.loads(cat_path.read_text(encoding="utf-8"))
cards=cat.get("cards",[])
assets={}
hashes={}
for p in A.rglob("*"):
 if not p.is_file() or p.suffix.lower() not in {".webp",".png",".jpg",".jpeg"}: continue
 m=re.fullmatch(r"(\d+)",p.stem)
 if m: assets.setdefault(m.group(1),[]).append(p.relative_to(R).as_posix())
 try: hashes.setdefault(hashlib.sha256(p.read_bytes()).hexdigest(),[]).append(p.relative_to(R).as_posix())
 except OSError: pass
rows=[]; missing=[]
for c in cards:
 cid=str(c.get("id",""))
 rid=str(c.get("resourceId") or "")\n files=assets.get(cid,[]) or (assets.get(rid,[]) if rid else [])
 row={"id":cid,"name":c.get("name",""),"rarity":c.get("rarity"),"localAssets":files,"hasDirectLocalAsset":bool(files),"resourceId":rid or None,"image":c.get("image") or ""}
 rows.append(row)
 if not files: missing.append(row)
same_binary=[v for v in hashes.values() if len(v)>1]
out={"catalogSource":cat_path.name,"catalogCards":len(cards),"uniqueCardIds":len({str(c.get("id")) for c in cards}),"numericAssetIds":len(assets),"directAssetMatches":len(cards)-len(missing),"missingDirectAssets":len(missing),"duplicateBinaryGroups":len(same_binary),"missing":missing,"duplicateBinaryFiles":same_binary}
(R/"docs/CATALOG-ASSET-AUDIT-v0.9.11.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print({k:out[k] for k in ("catalogCards","uniqueCardIds","numericAssetIds","directAssetMatches","missingDirectAssets","duplicateBinaryGroups")})
