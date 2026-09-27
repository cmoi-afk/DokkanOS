#!/usr/bin/env python3
"""Enrichit automatiquement card-meta.json à partir d'une source ID->nom/titre.
Le script ne modifie que les IDs présents dans data.json et conserve les champs
plus riches déjà renseignés manuellement ou par de futures sources.
"""
import json, urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SOURCE="https://raw.githubusercontent.com/kvmcd123/DokkanBattleLibrary/main/allData.json"

def load(path):
    with open(path,encoding="utf-8") as f:return json.load(f)
def main():
    box=load(ROOT/"data.json")
    meta=load(ROOT/"card-meta.json")
    ids={str(c.get("candidateId")) for c in box["cards"] if c.get("candidateId")}
    ids|={str(c.get("runnerId")) for c in box["cards"] if c.get("runnerId")}
    with urllib.request.urlopen(SOURCE,timeout=30) as r:
        source=json.load(r)
    index={str(x["number"]):x for x in source}
    found=0
    for cid in sorted(ids):
        x=index.get(cid)
        if not x:continue
        card=meta.setdefault("cards",{}).setdefault(cid,{})
        card.setdefault("name",x.get("subtitle",""))
        card.setdefault("title",x.get("title",""))
        card.setdefault("source",{"provider":"DokkanBattleLibrary/allData.json","url":SOURCE,"level":"identity"})
        found+=1
    meta["version"]="0.3"
    meta["generated"]={"identityMatches":found,"requestedIds":len(ids),"provider":"DokkanBattleLibrary"}
    with open(ROOT/"card-meta.json","w",encoding="utf-8") as f:json.dump(meta,f,ensure_ascii=False,indent=2)
    print(f"Enrichissement identité: {found}/{len(ids)} IDs")
if __name__=="__main__":main()
