#!/usr/bin/env python3
"""Audit sémantique complémentaire: détecte les fiches suspectes même non vides."""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def main():
 p=ROOT/"card-meta.json";d=json.loads(p.read_text(encoding="utf-8"));issues=[]
 for cid,c in d.get("cards",{}).items():
  x=[]
  if c.get("rarity") not in {"SR","SSR","UR","LR"}:x.append("rareté invalide/absente")
  if c.get("type") not in {"AGL","TEQ","INT","STR","PHY"}:x.append("type invalide/absent")
  if c.get("class") not in {"",None,"Super","Extreme"}:x.append("classe invalide")
  if c.get("leader") and len(str(c["leader"]))<8:x.append("leader anormalement court")
  if c.get("passive") and len(str(c["passive"]))<8:x.append("passif anormalement court")
  if c.get("categories") is not None and not isinstance(c["categories"],list):x.append("catégories non-listes")
  if c.get("links") is not None and not isinstance(c["links"],list):x.append("liens non-listes")
  if c.get("fr"):
   fr=c["fr"]
   if fr.get("categories") and len(fr["categories"])!=len(c.get("categories",[])):x.append("catégories FR désalignées")
   if fr.get("links") and len(fr["links"])!=len(c.get("links",[])):x.append("liens FR désalignés")
  if x:issues.append({"id":cid,"name":c.get("name"),"issues":x})
 out={"version":"0.3","cards":len(d.get("cards",{})),"suspectCards":len(issues),"issues":issues}
 (ROOT/"semantic-quality.json").write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding="utf-8")
 print("Fiches suspectes:",len(issues))
if __name__=="__main__":main()
