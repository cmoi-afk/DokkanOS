#!/usr/bin/env python3
"""Rattrapage ciblé de l'étape 1.
Retente uniquement les IDs dont le cœur de fiche est incomplet après la première passe.
Ne remplace jamais une valeur déjà correcte par une valeur vide.
"""
import json,time
from pathlib import Path
import enrich_dokkaninfo as di
ROOT=Path(__file__).resolve().parents[1]
CORE=("rarity","type","leader","passive","superAttack","categories","links")
def present(v):return v not in (None,"",[],{})
def main():
 p=ROOT/"card-meta.json";d=json.loads(p.read_text(encoding="utf-8"));todo=[]
 for cid,c in d.get("cards",{}).items():
  if any(not present(c.get(k)) for k in CORE):todo.append(cid)
 ok=fail=0
 for n,cid in enumerate(todo,1):
  c=d["cards"][cid]
  try:
   # force une nouvelle lecture réseau si le cache précédent était défectueux
   cp=di.CACHE/f"{cid}.json"
   if cp.exists():cp.unlink()
   kit=di.parse(cid,di.payload(cid))
   for k,v in kit.items():
    if present(v) and not present(c.get(k)):c[k]=v
   c.pop("enrichmentErrors",None);ok+=1
  except Exception as e:
   c["retryError"]=str(e)[:180];fail+=1
  if n%20==0:p.write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding="utf-8");time.sleep(.5)
 d.setdefault("generated",{})["targetedRetry"]={"requested":len(todo),"success":ok,"failed":fail}
 p.write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding="utf-8")
 print("Rattrapage ciblé",len(todo),ok,fail)
if __name__=="__main__":main()
