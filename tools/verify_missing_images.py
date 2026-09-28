#!/usr/bin/env python3
"""Fresh exhaustive DokkanOS image audit. No legacy URL rewriting."""
import json,re,urllib.request
from concurrent.futures import ThreadPoolExecutor,as_completed
from pathlib import Path
root=Path(__file__).resolve().parents[1]
catalog=root/"catalog.json"
data=json.loads(catalog.read_text(encoding="utf-8"))

def check(card):
    cid=str(card["id"]); url=card.get("image") or ""
    if not url: return cid,url,False,"image vide",None
    mismatch=None
    m=re.search(r"card_(\\d+)_thumb",url)
    if m and m.group(1)!=cid: mismatch={"id":cid,"imageId":m.group(1),"url":url}
    try:
        if not re.match(r"^https?://",url):
            p=root/url
            if not p.is_file(): return cid,url,False,"fichier local absent",mismatch
            b=p.read_bytes()[:16]
        else:
            req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"})
            with urllib.request.urlopen(req,timeout=12) as r:
                if r.status!=200 or not r.headers.get("Content-Type","").startswith("image/"):
                    return cid,url,False,"réponse distante non-image",mismatch
                b=r.read(16)
        valid=b.startswith(b"\\x89PNG") or b[:3]==b"\\xff\\xd8\\xff" or (b.startswith(b"RIFF") and b[8:12]==b"WEBP")
        return cid,url,valid,None if valid else "signature image invalide",mismatch
    except Exception as e: return cid,url,False,str(e)[:160],mismatch

broken=[]; mismatches=[]; checked=0
with ThreadPoolExecutor(max_workers=24) as ex:
    futures=[ex.submit(check,c) for c in data["cards"]]
    for fut in as_completed(futures):
        cid,url,valid,reason,mismatch=fut.result(); checked+=1
        if not valid: broken.append({"id":cid,"url":url,"reason":reason})
        if mismatch: mismatches.append(mismatch)
empty=[str(c["id"]) for c in data["cards"] if not c.get("image")]
report={"catalogCards":len(data["cards"]),"imagesChecked":checked,"emptyBeforeAudit":empty,"stillMissing":empty,"brokenImages":sorted(broken,key=lambda x:x["id"]),"idImageMismatches":sorted(mismatches,key=lambda x:x["id"])}
out=root/"docs/IMAGE-AUDIT-FINAL.json"
out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps({k:(len(v) if isinstance(v,list) else v) for k,v in report.items()},ensure_ascii=False))
if empty or broken or mismatches: raise SystemExit(1)
