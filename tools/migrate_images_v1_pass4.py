#!/usr/bin/env python3
"""Passe 4C: valide prudemment le schéma resource ID local.
Règle automatique: uniquement ID canonique finissant par 1 -> asset ID-1,
avec même base numérique, fichier image local réel. Les autres cas restent à confirmer.
"""
import json,os
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; CAT=ROOT/"catalog-v1.draft.json"; OUT=ROOT/"assets/cards"
SHARD=int(os.environ.get("SHARD","0")); TOTAL=int(os.environ.get("TOTAL_SHARDS","8"))
d=json.loads(CAT.read_text(encoding="utf-8"))
pending=[c for c in d["cards"] if not (c.get("image") or "").startswith("assets/cards/")]
batch=[c for i,c in enumerate(pending) if i%TOTAL==SHARD]
rows=[]
for c in batch:
 cid=str(c["id"]); n=int(cid); candidates=[]
 for delta in (-10,-1,1,10):
  nid=str(n+delta)
  for p in OUT.glob(nid+".*"):
   if p.is_file(): candidates.append({"resourceCandidateId":nid,"path":p.relative_to(ROOT).as_posix(),"delta":delta})
 exact=[x for x in candidates if cid.endswith("1") and x["delta"]==-1 and x["resourceCandidateId"]==str(n-1)]
 if len(exact)==1:
  rows.append({"id":cid,"name":c.get("name") or "","decision":"validated_resource_pattern","image":exact[0]["path"],"resourceId":exact[0]["resourceCandidateId"]})
 elif candidates:
  rows.append({"id":cid,"name":c.get("name") or "","decision":"manual_confirmation_required","candidates":candidates})
 else:
  rows.append({"id":cid,"name":c.get("name") or "","decision":"external_source_required"})
out=ROOT/f"docs/IMAGE-MIGRATION-v1-PASS4-SHARD-{SHARD}.json"
out.write_text(json.dumps({"shard":SHARD,"cards":len(rows),"items":rows},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("validated",sum(x["decision"]=="validated_resource_pattern" for x in rows),"manual",sum(x["decision"]=="manual_confirmation_required" for x in rows),"external",sum(x["decision"]=="external_source_required" for x in rows))
