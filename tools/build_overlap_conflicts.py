#!/usr/bin/env python3
"""Produit une file de conflits issue des chevauchements.
Un conflit = deux observations de la même position physique avec IDs candidats différents.
On ne corrige jamais automatiquement un conflit ambigu; on classe les alternatives pour validation.
"""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def main():
    data=json.loads((ROOT/"data.json").read_text(encoding="utf-8"))
    overlap=json.loads((ROOT/"overlap-map.json").read_text(encoding="utf-8"))
    idx={c["boxId"]:c for c in data["cards"]}
    conflicts=[]
    for m in overlap.get("merges",[]):
        if m.get("sameCandidate"):continue
        obs=[idx[x] for x in m["observations"] if x in idx]
        if len(obs)!=2:continue
        ranked=sorted(obs,key=lambda x:(bool(x.get("validated")),x.get("inliers") or 0),reverse=True)
        conflicts.append({
          "physicalPosition":m["kept"],"observations":m["observations"],
          "candidates":[{"boxId":x["boxId"],"candidateId":x.get("candidateId"),"runnerId":x.get("runnerId"),"confidence":x.get("confidence"),"inliers":x.get("inliers"),"validated":x.get("validated"),"crop":x.get("crop"),"image":x.get("image"),"runnerImage":x.get("runnerImage")} for x in ranked],
          "suggestedId":ranked[0].get("candidateId") if ranked[0].get("validated") else None,
          "status":"suggested" if ranked[0].get("validated") else "review"
        })
    out={"version":"0.3","count":len(conflicts),"conflicts":conflicts}
    (ROOT/"overlap-conflicts.json").write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding="utf-8")
    print("Conflits de chevauchement:",len(conflicts))
if __name__=="__main__":main()
