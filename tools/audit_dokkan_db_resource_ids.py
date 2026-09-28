#!/usr/bin/env python3
"""Analyse une DB client Dokkan publique et extrait resource_id pour le reliquat V1."""
import json,sqlite3,os
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; DB=Path(os.environ["DOKKAN_DB"]); CAT=ROOT/"catalog-v1.draft.json"
d=json.loads(CAT.read_text(encoding="utf-8")); pending=[c for c in d["cards"] if not (c.get("image") or "").startswith("assets/cards/")]
con=sqlite3.connect(DB); con.row_factory=sqlite3.Row
cols=[r[1] for r in con.execute("pragma table_info(cards)")]
wanted=[x for x in ("id","resource_id","awaked_card_id","is_selling_only","awakening_number") if x in cols]
rows={}
for c in pending:
 cid=str(c["id"])
 r=con.execute("select "+",".join(wanted)+" from cards where cast(id as text)=?",(cid,)).fetchone()
 if r: rows[cid]=dict(r)
out={"dbColumns":cols,"pending":len(pending),"matched":len(rows),"unmatched":len(pending)-len(rows),"items":[{"id":str(c["id"]),"name":c.get("name"),"db":rows.get(str(c["id"]))} for c in pending]}
(ROOT/"docs/DOKKAN-DB-RESOURCE-ID-AUDIT.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("pending",len(pending),"matched",len(rows),"columns",wanted)
