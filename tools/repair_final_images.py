#!/usr/bin/env python3
import json
from pathlib import Path

IDS=["1004631","1013760","1015200","1015691","1015701","1015711","1015830","2000780","2000790","2000800","2000810","2000820","2000830","2000840","2000850"]
root=Path(__file__).resolve().parents[1]
assets=root/"assets/cards"

verified=[]
for cid in IDS:
    p=assets/f"{cid}.png"
    if not p.is_file():
        raise RuntimeError(f"asset local absent: {cid}")
    b=p.read_bytes()[:16]
    valid=b.startswith(b"\x89PNG") or b[:3]==b"\xff\xd8\xff" or (b.startswith(b"RIFF") and b[8:12]==b"WEBP")
    if not valid:
        raise RuntimeError(f"asset local invalide: {cid}")
    verified.append(cid)

catalog=root/"catalog.json"
data=json.loads(catalog.read_text(encoding="utf-8"))
seen=set()
for card in data["cards"]:
    cid=str(card["id"])
    if cid in IDS:
        card["image"]=f"assets/cards/{cid}.png"
        seen.add(cid)
missing=set(IDS)-seen
if missing:
    raise RuntimeError(f"IDs absents du catalogue: {sorted(missing)}")
catalog.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

report={"requested":len(IDS),"verifiedLocal":verified,"failed":[],"catalogPathsForced":sorted(seen)}
(root/"docs"/"FINAL-IMAGE-REPAIR.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(report,ensure_ascii=False,indent=2))
