#!/usr/bin/env python3
"""Build one-shot exact-ID render manifest for all DokkanOS cards.
Network acquisition is deliberately separated from composition: every card
gets deterministic source candidates and metadata; failures remain explicit.
"""
import json
from pathlib import Path
R=Path(__file__).resolve().parents[1]
cat=json.loads((R/"catalog-v1.draft.json").read_text(encoding="utf-8"))
items=[]
for c in cat.get("cards",[]):
    cid=str(c.get("id","")); rid=str(c.get("resourceId") or c.get("resource_id") or cid)
    items.append({
      "id":cid,"resourceId":rid,"name":c.get("name",""),"rarity":c.get("rarity",""),
      "type":c.get("type",""),"class":c.get("class",""),
      "sourcePage":"https://www.dbz-dokkanbattle.com/card/"+cid,
      "assets":{
        "background":"card_"+rid+"_bg.png","character":"card_"+rid+"_character.png",
        "effect":"card_"+rid+"_effect.png","piece":"card_"+rid+"_piece.png",
        "circle":"card_"+rid+"_circle.png"
      },
      "ui":{
        "rarity":"cha_rare_sm_"+str(c.get("rarity","")).lower()+".png",
        "type":"derived-from-catalog-type","frame":"derived-from-catalog-type-and-class"
      },
      "output":"assets/cards/rendered/"+cid+".png","state":"pending"
    })
out={"cards":len(items),"policy":"exact ID/resourceId; deterministic full-card render; no name inference","items":items}
(R/"docs/FULL-CARD-RENDER-MANIFEST-v1.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("render manifest",len(items))
