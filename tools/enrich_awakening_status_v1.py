#!/usr/bin/env python3
"""Conservative canonical Dokkan form-status enrichment.
Never invents EZA/SEZA. It derives TUR/LR from rarity and only upgrades when
explicit structured evidence already exists in catalogue/meta. Unknown EZA
status is reported for later source verification.
"""
import json
from pathlib import Path
R=Path(__file__).resolve().parents[1]
P=R/"catalog-v1.draft.json"
M=R/"card-meta.json"
data=json.loads(P.read_text(encoding="utf-8"))
meta=json.loads(M.read_text(encoding="utf-8")).get("cards",{}) if M.exists() else {}
allowed={"SR","SSR","TUR","ZTUR","Super ZTUR","LR","ZLR","Super ZLR"}
# External-source confirmations can be added here only after exact card-ID verification.
# Never infer EZA/SEZA from name alone because Dokkan has many same-name cards.
V={
    # Confirmations exact-ID provenant de fiches externes vérifiées.
    # Ajouter uniquement lorsque la fiche documente explicitement un EZA/SEZA.
}
counts={}; unresolved=[]
def status(c,m):
    cid=str(c.get("id") or "")
    if cid in V:return V[cid],"external-exact-id"
    explicit=str(c.get("awakeningStatus") or m.get("awakeningStatus") or m.get("awakening_status") or "").strip()
    prior=str(c.get("awakeningStatusProof") or "")
    if explicit in allowed and prior in {"structured","external-exact-id"}:return explicit,prior
    if explicit in {"SR","SSR"}:return explicit,prior or "rarity"
    rarity=str(c.get("rarity") or m.get("rarity") or "").upper()
    raw=str(c.get("ezaType") or m.get("ezaType") or m.get("eza_type") or "").upper()
    super_eza=bool(c.get("superEza") or m.get("superEza") or m.get("super_eza"))
    eza=bool(c.get("eza") or m.get("eza"))
    if super_eza:
        return ("Super ZLR" if rarity=="LR" else "Super ZTUR"),"structured"
    if eza or raw in {"EZA","ZTUR","ZLR"}:
        return ("ZLR" if rarity=="LR" else "ZTUR"),"structured"
    if rarity=="LR": return "LR","rarity"
    if rarity=="UR": return "TUR","rarity"
    if rarity=="SSR": return "SSR","rarity"
    return rarity or "","rarity"
for c in data.get("cards",[]):
    cid=str(c.get("id") or ""); m=meta.get(cid,{})
    s,proof=status(c,m); c["awakeningStatus"]=s; c["awakeningStatusProof"]=proof
    counts[s]=counts.get(s,0)+1
    if s in {"TUR","LR"} and proof=="rarity":
        unresolved.append({"id":cid,"name":c.get("name",""),"status":s,"reason":"EZA/Super EZA non prouve"})
P.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
report={"cards":len(data.get("cards",[])),"counts":counts,"explicitOrStructured":sum(1 for c in data.get("cards",[]) if c.get("awakeningStatusProof") in {"explicit","structured","external-exact-id"}),"needsEzaVerification":len(unresolved),"items":unresolved}
(R/"docs/AWAKENING-STATUS-AUDIT-v1.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps({k:v for k,v in report.items() if k!="items"},ensure_ascii=False))
