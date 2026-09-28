#!/usr/bin/env python3
import json, re, urllib.request, urllib.parse
from pathlib import Path
IDS=["1004631","1013760","1015200","1015691","1015701","1015711","1015830","2000780","2000790","2000800","2000810","2000820","2000830","2000840","2000850"]
root=Path(__file__).resolve().parents[1]; out=root/"assets/cards"; out.mkdir(parents=True,exist_ok=True)
ok=[]; failed=[]
headers={"User-Agent":"Mozilla/5.0"}
for cid in IDS:
    try:
        page=f"https://www.dbz-dokkanbattle.com/card/{cid}"
        req=urllib.request.Request(page,headers=headers)
        html=urllib.request.urlopen(req,timeout=20).read().decode("utf-8","ignore")
        hits=re.findall(r'''(?:https?://[^"' ]+|/[^"' ]*|[^"' ]*)card_\d+_thumb[^"' ]*?\.png''',html,re.I)
        if not hits: raise RuntimeError("aucun asset miniature dans la fiche")
        src=hits[0]
        if src.startswith("/"): src="https://www.dbz-dokkanbattle.com"+src
        elif not src.startswith("http"): src=urllib.parse.urljoin(page,src)
        data=urllib.request.urlopen(urllib.request.Request(src,headers=headers),timeout=30).read()
        valid=data.startswith(b"\x89PNG") or data[:3]==b"\xff\xd8\xff" or (data.startswith(b"RIFF") and data[8:12]==b"WEBP")
        if not valid: raise RuntimeError("contenu non-image")
        (out/f"{cid}.png").write_bytes(data); ok.append(cid)
    except Exception as e: failed.append({"id":cid,"reason":str(e)[:180]})
p=root/"catalog.json"; d=json.loads(p.read_text(encoding="utf-8"))
for card in d["cards"]:
    cid=str(card["id"])
    if cid in ok: card["image"]=f"assets/cards/{cid}.png"
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
report={"requested":len(IDS),"repaired":ok,"failed":failed}
(root/"docs"/"FINAL-IMAGE-REPAIR.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(report,ensure_ascii=False,indent=2))
