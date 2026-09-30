#!/usr/bin/env python3
"""Retry only incomplete full-card asset rows from the consolidated retry queue."""
import json,os,re,urllib.request,urllib.parse
from pathlib import Path
R=Path(__file__).resolve().parents[1]
Q=R/"docs/FULL-CARD-ASSET-RETRY-PRIORITY-v1.json"; D=R/"assets/card-source"; D.mkdir(parents=True,exist_ok=True)
if not Q.exists(): raise SystemExit("retry queue missing")
q=json.loads(Q.read_text(encoding="utf-8")); shard=int(os.environ.get("SHARD","0")); total=int(os.environ.get("SHARDS","1"))
selected=[r for i,r in enumerate(q.get("items",[])) if i%total==shard]
UA={"User-Agent":"Mozilla/5.0 (compatible; DokkanOS asset retry)"}
def get(url):
    req=urllib.request.Request(url,headers=UA)
    with urllib.request.urlopen(req,timeout=20) as r:return r.read()
out=[]; recovered=0
for row in selected:
    cid=str(row.get("id","")); rid=str(row.get("resourceId") or cid)
    page="https://www.dbz-dokkanbattle.com/card/"+cid
    missing=list(row.get("missing") or ["background","character","effect","piece","circle"])
    assets={k:f"card_{rid}_{k}.png" for k in ["background","character","effect","piece","circle"]}
    got=[]; still=[]; urls={}
    try: html=get(page).decode("utf-8","ignore")
    except Exception as e:
        out.append({**row,"retryState":"page-error","error":type(e).__name__}); continue
    for kind in missing:
        fn=assets.get(kind)
        if not fn: continue
        candidates=[]
        for pat in [r'["\\\']([^"\\\']*'+re.escape(fn)+r'[^"\\\']*)["\\\']',r'(https?://[^\\s"\\\'<>]*'+re.escape(fn)+r'[^\\s"\\\'<>]*)']:
            for x in re.findall(pat,html,re.I):
                candidates.append(urllib.parse.urljoin(page,x.replace("\\/","/").replace("&amp;","&")))
        done=False
        for u in dict.fromkeys(candidates):
            try:
                b=get(u)
                if len(b)>100:
                    (D/fn).write_bytes(b); got.append(kind); urls[kind]=u; done=True; break
            except Exception: pass
        if not done: still.append(kind)
    if len(still)<len(missing): recovered+=1
    out.append({"id":cid,"resourceId":rid,"previousMissing":missing,"recovered":got,"stillMissing":still,"urls":urls,
                "retryState":"complete" if not still else ("improved" if got else "unresolved")})
report={"shard":shard,"shards":total,"cards":len(out),"cardsImproved":recovered,"items":out}
(R/f"docs/FULL-CARD-ASSET-RETRY-RESULT-v1-shard-{shard}.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps({"shard":shard,"cards":len(out),"cardsImproved":recovered}))
