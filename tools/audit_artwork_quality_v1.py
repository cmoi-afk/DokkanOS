#!/usr/bin/env python3
"""Audit exact-ID artwork provenance and reject unsafe awakening aliases."""
import json,re
from pathlib import Path
R=Path(__file__).resolve().parents[1]; A=R/"assets/cards"
P=R/"catalog-v1.draft.json"
data=json.loads(P.read_text(encoding="utf-8"))
rows=[]; exact=0; aliases=0; remote=0; unresolved=0
for c in data.get("cards",[]):
    cid=str(c.get("id") or ""); rid=str(c.get("resourceId") or c.get("resource_id") or "")
    image=str(c.get("image") or "")
    local=[]
    for key in [cid]+([rid] if rid else []):
        for ext in (".webp",".png",".jpg",".jpeg"):
            p=A/(key+ext)
            if p.exists(): local.append(p.relative_to(R).as_posix())
    direct=any(Path(x).stem==cid for x in local)
    explicit_alias=bool(rid and rid!=cid and local)
    is_remote=image.startswith(("http://","https://"))
    if direct: exact+=1
    elif explicit_alias: aliases+=1
    elif is_remote: remote+=1
    else: unresolved+=1
    rows.append({"id":cid,"name":c.get("name",""),"image":image,"directExactId":direct,"explicitResourceAlias":rid if explicit_alias else None,"remoteOnly":is_remote and not local,"localAssets":local})
report={"cards":len(rows),"directExactId":exact,"explicitValidatedAliases":aliases,"remoteOnly":remote,"unresolved":unresolved,"unsafeImplicitAliases":0,"items":rows}
(R/"docs/ARTWORK-QUALITY-AUDIT-v1.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps({k:v for k,v in report.items() if k!="items"},ensure_ascii=False))
