#!/usr/bin/env python3
"""Audit parallèle de toutes les miniatures du catalogue DokkanOS."""
import json,re,urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
root=Path(__file__).resolve().parents[1]
IMAGE_ALIASES={"1004631":"1003640","1015691":"1015680","1015701":"1015680","1015711":"1015680"}

path=root/"catalog.json"; data=json.loads(path.read_text(encoding="utf-8"))

def check(card):
    cid=str(card["id"]); url=card.get("image") or ""
    empty=not bool(url)
    if empty:url=f"https://www.dbz-dokkanbattle.com/img/character/thumb/card_{cid}_thumb/card_{cid}_thumb.png"
    # French DB pages ending in 1 normally expose the base artwork asset ending in 0.
    if re.match(r"^https?://(?:www\.)?dbz-dokkanbattle\.com/",url) and cid.endswith("1"):
        canonical_id=cid[:-1]+"0"
        url=f"https://www.dbz-dokkanbattle.com/img/character/thumb/card_{canonical_id}_thumb/card_{canonical_id}_thumb.png"
    mismatch=None
    m=re.search(r"card_(\d+)_thumb",url)
    if m and m.group(1)!=cid:
        image_id=m.group(1); canonical=(cid.endswith("1") and image_id==cid[:-1]+"0")
        if not canonical:mismatch={"id":cid,"imageId":image_id,"url":url}
    try:
        if not re.match(r"^https?://",url):
            local=root/url
            if not local.is_file():return cid,url,empty,False,"fichier local absent",mismatch
            head=local.read_bytes()[:16]
            valid=(head.startswith(b"RIFF") and head[8:12]==b"WEBP") or head.startswith(bytes([137,80,78,71])) or head[:3]==b"\xff\xd8\xff"
            return cid,url,empty,valid,None if valid else "fichier local non-image",mismatch
        req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"})
        with urllib.request.urlopen(req,timeout=8) as r:
            head=r.read(16); ctype=r.headers.get("Content-Type","")
            valid=r.status==200 and ctype.startswith("image/") and (head.startswith(bytes([137,80,78,71])) or head[:3]==b"\xff\xd8\xff" or (head.startswith(b"RIFF") and head[8:12]==b"WEBP"))
        return cid,url,empty,valid,None if valid else "réponse non-image",mismatch
    except Exception as e:return cid,url,empty,False,str(e)[:120],mismatch

resolved=[]; missing=[]; broken=[]; mismatched=[]; checked=0
with ThreadPoolExecutor(max_workers=32) as pool:
    futures=[pool.submit(check,c) for c in data["cards"]]
    for fut in as_completed(futures):
        cid,url,empty,valid,reason,mismatch=fut.result(); checked+=1
        if empty:missing.append(cid)
        if mismatch:mismatched.append(mismatch)
        if valid and empty:
            for card in data["cards"]:
                if str(card["id"])==cid:card["image"]=url;break
            resolved.append(cid)
        if not valid:broken.append({"id":cid,"url":url,"reason":reason})
path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
report={"catalogCards":len(data["cards"]),"imagesChecked":checked,"verifiedAndFilled":sorted(resolved),"emptyBeforeAudit":sorted(missing),"stillMissing":sorted([x["id"] for x in broken if x["id"] in missing]),"brokenImages":sorted(broken,key=lambda x:int(x["id"])),"idImageMismatches":sorted(mismatched,key=lambda x:int(x["id"]))}
(root/"docs"/"IMAGE-AUDIT-v0.7.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps({k:(len(v) if isinstance(v,list) else v) for k,v in report.items()},ensure_ascii=False))
