#!/usr/bin/env python3
"""Acquire exact-ID Dokkan graphical assets for the full render manifest.
Best-effort: missing assets are recorded, never substituted by name.
"""
import json,urllib.request,urllib.error,time
from pathlib import Path
R=Path(__file__).resolve().parents[1]
M=R/"docs/FULL-CARD-RENDER-MANIFEST-v1.json"
D=R/"assets/card-source"; D.mkdir(parents=True,exist_ok=True)
m=json.loads(M.read_text(encoding="utf-8")); report=[]; ok=0
base="https://www.dbz-dokkanbattle.com/assets/"
import os
shard=int(os.environ.get("SHARD","0")); total=int(os.environ.get("SHARDS","1"))
selected=[r for i,r in enumerate(m["items"]) if i % total == shard]
for row in selected:
    rid=row["resourceId"]; got=[]; missing=[]
    for kind,fn in row["assets"].items():
        out=D/fn
        if out.exists() and out.stat().st_size>100: got.append(kind); continue
        # Source site exposes these filenames; acquisition URL may evolve.
        urls=[base+fn, "https://www.dbz-dokkanbattle.com/images/cards/"+fn]
        done=False
        for url in urls:
            try:
                req=urllib.request.Request(url,headers={"User-Agent":"DokkanOS-asset-audit/1.0"})
                with urllib.request.urlopen(req,timeout=15) as r:
                    b=r.read()
                if len(b)>100:
                    out.write_bytes(b); got.append(kind); done=True; break
            except Exception: pass
        if not done: missing.append(kind)
    state="complete-source-set" if "character" in got and "background" in got else ("partial" if got else "missing")
    if state=="complete-source-set": ok+=1
    report.append({"id":row["id"],"resourceId":rid,"state":state,"downloaded":got,"missing":missing})
out={"shard":shard,"shards":total,"cards":len(report),"completeSourceSets":ok,"items":report}
(R/f"docs/FULL-CARD-ASSET-ACQUISITION-v1-shard-{shard}.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps({"cards":len(report),"completeSourceSets":ok}))
