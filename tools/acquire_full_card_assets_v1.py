#!/usr/bin/env python3
"""Acquire card assets by parsing each exact-ID source page.
Never infer an asset from a character name. URLs must be exposed by the page.
"""
import json,os,re,urllib.request,urllib.parse
from pathlib import Path
R=Path(__file__).resolve().parents[1]
M=R/"docs/FULL-CARD-RENDER-MANIFEST-v1.json"; D=R/"assets/card-source"; D.mkdir(parents=True,exist_ok=True)
m=json.loads(M.read_text(encoding="utf-8")); shard=int(os.environ.get("SHARD","0")); total=int(os.environ.get("SHARDS","1"))
selected=[r for i,r in enumerate(m["items"]) if i%total==shard]; report=[]; ok=0
UA={"User-Agent":"Mozilla/5.0 (compatible; DokkanOS asset audit)"}
def get(url):
    req=urllib.request.Request(url,headers=UA)
    with urllib.request.urlopen(req,timeout=20) as r:return r.read()
for row in selected:
    page=row["sourcePage"]; got=[]; missing=[]; discovered={}
    try:
        html=get(page).decode("utf-8","ignore")
    except Exception as e:
        report.append({"id":row["id"],"resourceId":row["resourceId"],"state":"page-error","error":type(e).__name__}); continue
    # Collect every URL/path exposed by HTML/JS containing the exact resource asset filename.
    for kind,fn in row["assets"].items():
        pats=[r'["\\\']([^"\\\']*'+re.escape(fn)+r'[^"\\\']*)["\\\']', r'(https?://[^\\s"\\\'<>]*'+re.escape(fn)+r'[^\\s"\\\'<>]*)']
        candidates=[]
        for pat in pats:
            for x in re.findall(pat,html,re.I):
                x=x.replace("\\/","/").replace("&amp;","&")
                u=urllib.parse.urljoin(page,x); candidates.append(u)
        done=False
        for u in dict.fromkeys(candidates):
            try:
                b=get(u)
                if len(b)>100:
                    (D/fn).write_bytes(b); got.append(kind); discovered[kind]=u; done=True; break
            except Exception: pass
        if not done: missing.append(kind)
    state="complete-source-set" if "character" in got and "background" in got else ("partial" if got else "missing")
    if state=="complete-source-set":ok+=1
    report.append({"id":row["id"],"resourceId":row["resourceId"],"state":state,"downloaded":got,"missing":missing,"urls":discovered})
out={"shard":shard,"shards":total,"cards":len(report),"completeSourceSets":ok,"items":report}
(R/f"docs/FULL-CARD-ASSET-ACQUISITION-v2-shard-{shard}.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps({"shard":shard,"cards":len(report),"completeSourceSets":ok}))
