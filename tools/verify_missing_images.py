#!/usr/bin/env python3
"""Audit complet des miniatures du catalogue DokkanOS."""
import json,re,urllib.request
from pathlib import Path
root=Path(__file__).resolve().parents[1]
path=root/"catalog.json"; data=json.loads(path.read_text(encoding="utf-8"))
resolved=[]; missing=[]; broken=[]; mismatched=[]; checked=0
for card in data["cards"]:
    cid=str(card["id"]); url=card.get("image") or ""
    if not url:
        url=f"https://www.dbz-dokkanbattle.com/img/character/thumb/card_{cid}_thumb/card_{cid}_thumb.png"
        missing.append(cid)
    m=re.search(r"card_(\d+)_thumb",url)
    if m and m.group(1)!=cid:
        image_id=m.group(1)
        # French reference pages commonly expose awakened page IDs ending in 1
        # while the official asset uses the base ID ending in 0.
        canonical_asset=(cid.endswith("1") and image_id==cid[:-1]+"0")
        if not canonical_asset:
            mismatched.append({"id":cid,"imageId":image_id,"url":url})
    try:
        req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"})
        with urllib.request.urlopen(req,timeout=20) as r:
            head=r.read(16); ctype=r.headers.get("Content-Type","")
            valid=r.status==200 and ctype.startswith("image/") and (head.startswith(bytes([137,80,78,71])) or head[:3]==b"\xff\xd8\xff")
        checked+=1
        if valid:
            if not card.get("image"): card["image"]=url; resolved.append(cid)
        else: broken.append({"id":cid,"url":url,"reason":"réponse non-image"})
    except Exception as e: broken.append({"id":cid,"url":url,"reason":str(e)[:120]})
path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
report={"catalogCards":len(data["cards"]),"urlsChecked":checked,"verifiedAndFilled":resolved,"emptyBeforeAudit":missing,"stillMissing":[x["id"] for x in broken if x["id"] in missing],"brokenImages":broken,"idImageMismatches":mismatched}
(root/"docs"/"IMAGE-AUDIT-v0.7.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps({k:(len(v) if isinstance(v,list) else v) for k,v in report.items()},ensure_ascii=False))
