#!/usr/bin/env python3
"""Construit le catalogue global DokkanOS pour l'onglet Cartes non possédées.
On conserve uniquement les raretés SSR/UR/LR et un schéma léger côté mobile.
"""
import json,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SOURCE="https://raw.githubusercontent.com/feijoes/DokkanAPI/main/data/DokkanCharacterData.json"
TYPE_FR={"AGL":"AGI","TEQ":"TEC","INT":"INT","STR":"PUI","PHY":"END"}
def main():
    with urllib.request.urlopen(SOURCE,timeout=60) as r:rows=json.load(r)
    cards=[]
    for x in rows:
        if x.get("rarity") not in {"SSR","UR","LR"}:continue
        # DokkanAPI id omet souvent le 10...0 de l'ID asset; on garde sourceId séparé
        cards.append({"sourceId":str(x.get("id","")),"id":str(x.get("assetId") or x.get("cardId") or ""),"name":x.get("name",""),"title":x.get("title",""),"rarity":x.get("rarity",""),"type":TYPE_FR.get(x.get("type"),x.get("type","")),"class":"Extrême" if x.get("class")=="Extreme" else x.get("class",""),"image":x.get("imageURL","")})
    out={"version":"0.3","provider":"feijoes/DokkanAPI","note":"id may be empty when provider exposes only sourceId; ownership matching then requires identity reconciliation","cards":cards}
    (ROOT/"catalog.json").write_text(json.dumps(out,ensure_ascii=False,separators=(",",":")),encoding="utf-8")
    print("Catalogue SSR/UR/LR:",len(cards))
if __name__=="__main__":main()
