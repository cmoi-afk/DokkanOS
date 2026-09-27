#!/usr/bin/env python3
"""Fusionne les kits détaillés de DokkanAPI avec les 975 identités DokkanOS.
Le fournisseur utilise un autre espace d'IDs : le rapprochement est donc fait
sur (nom,titre) normalisés, puis nom seul uniquement s'il est non ambigu.
"""
import json,re,unicodedata,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SOURCE="https://raw.githubusercontent.com/feijoes/DokkanAPI/main/data/DokkanCharacterData.json"
def norm(s):
    s=unicodedata.normalize("NFKD",s or "").encode("ascii","ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+"," ",s).strip()
def main():
    p=ROOT/"card-meta.json"; meta=json.loads(p.read_text(encoding="utf-8"))
    with urllib.request.urlopen(SOURCE,timeout=60) as r: rows=json.load(r)
    exact={}; byname={}
    for x in rows:
        exact[(norm(x.get("name")),norm(x.get("title")))]=x
        byname.setdefault(norm(x.get("name")),[]).append(x)
    found=0
    for cid,c in meta.get("cards",{}).items():
        x=exact.get((norm(c.get("name")),norm(c.get("title"))))
        if not x:
            opts=byname.get(norm(c.get("name")),[])
            if len(opts)==1:x=opts[0]
        if not x:continue
        mapping={
          "rarity":"rarity","class":"class","type":"type","leader":"leaderSkill",
          "passive":"passive","superAttack":"superAttack","ultraSuperAttack":"ultraSuperAttack",
          "active":"activeSkill","activeCondition":"activeSkillCondition",
          "categories":"categories","links":"links","transformations":"transformations",
          "maxLevel":"maxLevel","maxSALevel":"maxSALevel","cost":"cost","kiMeter":"kiMeter",
          "baseHP":"baseHP","maxHP":"maxLevelHP","rainbowHP":"rainbowHP",
          "baseATK":"baseAttack","maxATK":"maxLevelAttack","rainbowATK":"rainbowAttack",
          "baseDEF":"baseDefence","maxDEF":"maxDefence","rainbowDEF":"rainbowDefence",
          "kiMultiplier":"kiMultiplier"
        }
        for dst,src in mapping.items():
            v=x.get(src)
            if v not in (None,"",[]):c[dst]=v
        eza={k:x.get(k) for k in ["ezaLeaderSkill","ezaSuperAttack","ezaUltraSuperAttack","ezaPassive","ezaActiveSkill","ezaActiveSkillCondition"] if x.get(k)}
        if eza:c["eza"]=eza
        c.setdefault("sources",[]).append({"provider":"feijoes/DokkanAPI","url":SOURCE,"level":"kit"})
        found+=1
    meta.setdefault("generated",{})["kitMatches"]=found
    meta["generated"]["kitProvider"]="feijoes/DokkanAPI"
    p.write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding="utf-8")
    print(f"Kits détaillés: {found}/{len(meta.get('cards',{}))}")
if __name__=="__main__":main()
