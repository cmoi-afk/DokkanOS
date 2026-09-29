#!/usr/bin/env python3
"""Static hygiene audit for DokkanOS app.js. Diagnostic only; never deletes code."""
import json,re
from pathlib import Path
R=Path(__file__).resolve().parents[1]
s=(R/"app.js").read_text(encoding="utf-8")
funcs=re.findall(r"\bfunction\s+([A-Za-z_$][\w$]*)\s*\(",s)
counts={name:len(re.findall(r"\b"+re.escape(name)+r"\b",s)) for name in funcs}
single=sorted(name for name,n in counts.items() if n==1)
obsolete_patterns={
 "numberedAwakeningLabels":r"Éveil\s*['\"]?\s*\+\s*pos|Éveil final",
 "implicitSiblingAssetAlias":r"slice\(0,-1\).*['\"]0['\"]",
 "oldCacheVersion":r"1\.1-stable['\"]",
}
hits={k:bool(re.search(v,s,re.I)) for k,v in obsolete_patterns.items()}
report={"functions":len(funcs),"singleReferenceCandidates":single,"obsoletePatternHits":hits,"note":"single-reference functions are candidates only; HTML inline handlers can reference them externally"}
(R/"docs/CODE-HYGIENE-AUDIT-v1.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(report,ensure_ascii=False))
