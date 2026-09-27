#!/usr/bin/env python3
"""Reconstruit une collection canonique en fusionnant les chevauchements de captures.
Aucune observation brute n'est supprimée. Les fusions sont consignées dans overlap-map.json.
Règle conservatrice: captures successives, suffixe/préfixe de 3..12 cartes, >=75% d'IDs
identiques et au moins 3 concordances. En cas de désaccord, l'observation validée gagne.
"""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def score(a,b):
    best=None
    for k in range(3,min(12,len(a),len(b))+1):
        aa=a[-k:];bb=b[:k];same=sum(bool(x.get("candidateId")) and x.get("candidateId")==y.get("candidateId") for x,y in zip(aa,bb))
        ratio=same/k
        cand=(ratio,same,k)
        if same>=3 and ratio>=.75 and (best is None or cand>best[0]):best=(cand,aa,bb)
    return best
def choose(a,b):
    if a.get("validated")!=b.get("validated"):return a if a.get("validated") else b
    ai=a.get("inliers") or 0;bi=b.get("inliers") or 0
    return a if ai>=bi else b
def main():
    data=json.loads((ROOT/"data.json").read_text(encoding="utf-8"));raw=data["cards"]
    caps=[];groups={}
    for c in raw:
        if c["capture"] not in groups:caps.append(c["capture"]);groups[c["capture"]]=[]
        groups[c["capture"]].append(c)
    canonical=[];merges=[];pairs=[]
    for i,cap in enumerate(caps):
        cur=groups[cap]
        if i==0:canonical.extend(cur);continue
        prev=groups[caps[i-1]];hit=score(prev,cur)
        if not hit:canonical.extend(cur);continue
        (_,same,k),aa,bb=hit;pairs.append({"from":caps[i-1],"to":cap,"overlap":k,"matches":same,"confidence":round(same/k,3)})
        # les k dernières observations déjà présentes sont remplacées par le meilleur exemplaire
        base=canonical[-k:]
        resolved=[]
        for old,new in zip(base,bb):
            winner=choose(old,new);resolved.append(winner)
            merges.append({"kept":winner["boxId"],"observations":[old["boxId"],new["boxId"]],"sameCandidate":old.get("candidateId")==new.get("candidateId")})
        canonical[-k:]=resolved;canonical.extend(cur[k:])
    out={"version":"0.3","rawPositions":len(raw),"canonicalPositions":len(canonical),"overlapPositionsRemoved":len(raw)-len(canonical),"capturePairsMerged":len(pairs),"pairs":pairs,"merges":merges}
    (ROOT/"overlap-map.json").write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding="utf-8")
    (ROOT/"collection.json").write_text(json.dumps({"version":"0.3","source":"data.json + overlap-map.json","cards":canonical},ensure_ascii=False,separators=(",",":")),encoding="utf-8")
    print(f"Collection canonique: {len(canonical)}/{len(raw)} positions; chevauchements fusionnés: {len(raw)-len(canonical)}")
if __name__=="__main__":main()
