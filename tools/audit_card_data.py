#!/usr/bin/env python3
"""Audit qualité de l'étape 1 DokkanOS. Ne modifie aucune fiche."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
CORE=["name","rarity","type","class","leader","passive","superAttack","categories","links"]
OPTIONAL=["ultraSuperAttack","active","transformations","eza"]
def present(v): return v not in (None,"",[],{})
def main():
 d=json.loads((ROOT/"card-meta.json").read_text(encoding="utf-8"));cards=d.get("cards",{})
 coverage={k:sum(present(c.get(k)) for c in cards.values()) for k in CORE+OPTIONAL}
 issues=[]
 for cid,c in cards.items():
  missing=[k for k in CORE if not present(c.get(k))]
  invalid=[]
  if present(c.get("rarity")) and c["rarity"] not in {"SR","SSR","UR","LR"}:invalid.append("rarity")
  if present(c.get("type")) and c["type"] not in {"AGL","TEQ","INT","STR","PHY"}:invalid.append("type")
  if present(c.get("class")) and c["class"] not in {"Super","Extreme"}:invalid.append("class")
  if missing or invalid or c.get("enrichmentErrors"):
   issues.append({"id":cid,"name":c.get("name"),"missingCore":missing,"invalid":invalid,"errors":c.get("enrichmentErrors",[])})
 n=len(cards)
 report={"version":"0.3","stage":"step-1-card-data","cards":n,
 "coverage":{k:{"count":v,"pct":round(v*100/n,1) if n else 0} for k,v in coverage.items()},
 "completeCore":sum(all(present(c.get(k)) for k in CORE) for c in cards.values()),
 "issuesCount":len(issues),"issues":issues}
 (ROOT/"data-quality.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
 print(json.dumps({k:v for k,v in report.items() if k!="issues"},ensure_ascii=False,indent=2))
if __name__=="__main__":main()
