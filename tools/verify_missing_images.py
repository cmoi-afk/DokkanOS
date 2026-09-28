#!/usr/bin/env python3
"""Audit parallèle de toutes les miniatures du catalogue DokkanOS."""
import json,re,urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
root=Path(__file__).resolve().parents[1]
IMAGE_ALIASES={"1004631":"1003640","1015691":"1015680","1015701":"1015680","1015711":"1015680"}

path=root/"catalog.json"; data=json.loads(path.read_text(encoding="utf-8"))

def check(card):
    cid=str(card["id"]); original=card.get("image") or ""; url=original
    empty=not bool(url)
    if empty: url=f"https://www.dbz-dokkanbattle.com/img/character/thumb/card_{cid}_thumb/card_{cid}_thumb.png"
    if cid in IMAGE_ALIASES:
        aid=IMAGE_ALIASES[cid]
        url=f"https://www.dbz-dokkanbattle.com/img/character/thumb/card_{aid}_thumb/card_{aid}_thumb.png"
    elif re.match(r"^https?://(?:www\\.)?dbz-dokkanbattle\\.com/",url) and cid.endswith("1"):
        aid=cid[:-1]+"0"
        url=f"https://www.dbz-dokkanbattle.com/img/character/thumb/card_{aid}_thumb/card_{aid}_thumb.png"
    mismatch=None
    m=re.search(r"card_(\\d+)_thumb",url)
    if m and m.group(1)!=cid:
        image_id=m.group(1)
        canonical=(cid in IMAGE_ALIASES and image_id==IMAGE_ALIASES[cid]) or (cid.endswith("1") and image_id==cid[:-1]+"0")
        if not canonical:mismatch={"id":cid,"imageId":image_id,"url":url}
    try:
        if not re.match(r"^https?://",url):
            local=root/url
            if not local.is_file():return cid,url,original,empty,False,"fichier local absent",mismatch
            head=local.read_bytes()[:16]
            valid=(head.startswith(b"RIFF") and head[8:12]==b"WEBP") or head.startswith(bytes([137,80,78,71])) or head[:3]==b"\\xff\\xd8\\xff"
            return cid,url,original,empty,valid,None if valid else "fichier local non-image",mismatch
        req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"})
        with urllib.request.urlopen(req,timeout=12) as r:
            head=r.read(16); ctype=r.headers.get("Content-Type","")
            valid=r.status==200 and ctype.startswith("image/") and (head.startswith(bytes([137,80,78,71])) or head[:3]==b"\\xff\\xd8\\xff" or (head.startswith(b"RIFF") and head[8:12]==b"WEBP"))
        return cid,url,original,empty,valid,None if valid else "réponse non-image",mismatch
    except Exception as e:return cid,url,original,empty,False,str(e)[:120],mismatch

