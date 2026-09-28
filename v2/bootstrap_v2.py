#!/usr/bin/env python3
"""Bootstrap V2 sans héritage: schéma canonique et pipeline d'import isolé."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
schema={
 "$schema":"https://json-schema.org/draft/2020-12/schema",
 "title":"DokkanOS V2 Card",
 "type":"object",
 "required":["id","nameFr","rarity","playable","sources"],
 "properties":{
  "id":{"type":"string","pattern":"^[0-9]+$"},
  "resourceId":{"type":["string","null"]},
  "nameFr":{"type":"string"},
  "titleFr":{"type":"string"},
  "rarity":{"enum":["N","R","SR","SSR","UR","LR"]},
  "type":{"enum":["AGI","TEC","INT","PUI","END",None]},
  "playable":{"type":"boolean"},
  "awakensFrom":{"type":["string","null"]},
  "awakensTo":{"type":["string","null"]},
  "image":{"type":["string","null"]},
  "sources":{"type":"array","items":{"type":"string"}}
 }}
(ROOT/"v2/schema.card.json").write_text(json.dumps(schema,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
catalog={"version":"2.0.0","status":"bootstrap","cards":[],"stats":{"cards":0},"notes":["Catalogue construit sans import automatique de V0/V1.","IDs obligatoirement vérifiés avant insertion."]}
(ROOT/"v2/catalog.json").write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("V2 bootstrap ready")
