#!/usr/bin/env python3
"""Consolidate full-card artwork acquisition reports and build a retry queue."""
import json
from collections import Counter
from pathlib import Path

R=Path(__file__).resolve().parents[1]
DOC=R/"docs"
reports=[]
for p in sorted(DOC.glob("FULL-CARD-ASSET-ACQUISITION-v2-shard-*.json")):
    reports.append(json.loads(p.read_text(encoding="utf-8")))
if len(reports)!=8:
    raise SystemExit(f"expected 8 shard reports, found {len(reports)}")

items=[]
for r in reports:
    items.extend(r.get("items",[]))
by_id={}
duplicates=[]
for row in items:
    cid=str(row.get("id",""))
    if cid in by_id: duplicates.append(cid)
    by_id[cid]=row

states=Counter(str(x.get("state","unknown")) for x in by_id.values())
complete=[x for x in by_id.values() if x.get("state")=="complete-source-set"]
retry=[x for x in by_id.values() if x.get("state")!="complete-source-set"]
missing_kinds=Counter()
for x in retry:
    for kind in x.get("missing",[]): missing_kinds[kind]+=1

retry_doc={
  "policy":"retry only cards without a complete exact-ID source set",
  "cards":len(retry),
  "items":[{"id":x.get("id"),"resourceId":x.get("resourceId"),"state":x.get("state"),
            "missing":x.get("missing",[]),"error":x.get("error")} for x in retry]
}
summary={
  "shards":len(reports),"reportedRows":len(items),"uniqueCards":len(by_id),
  "completeSourceSets":len(complete),"needsRetry":len(retry),
  "states":dict(sorted(states.items())),"missingAssetKinds":dict(sorted(missing_kinds.items())),
  "duplicateIds":sorted(set(duplicates)),
  "completionPercent":round((len(complete)/len(by_id)*100),2) if by_id else 0
}
(DOC/"FULL-CARD-ASSET-RETRY-v1.json").write_text(json.dumps(retry_doc,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
(DOC/"FULL-CARD-ASSET-SUMMARY-v1.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(summary,ensure_ascii=False))
