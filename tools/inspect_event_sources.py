#!/usr/bin/env python3
"""Collect representative public pages for importer audits and targeted repairs."""
from pathlib import Path
from refresh_events import *
paths=list(INDEX)+['/limited-missions-categories/current/'+str(i) for i in range(1,41)]+['/mission/101208','/board-missions/3038','/origin/series/2','/origin/series/99','/tenkaichi-budokai/63','/event/rmbattle/106','/sd-character/25','/quest/1769/17690045','/quest/1354/13540015','/items/TreasureItem','/items/AwakeningItem','/event/rmbattle/107','/event/rmbattle/108']
batch(paths)
for p,s in pages.items():(OUT/(p.strip('/').replace('/','_')+'.html')).write_text(str(s))
(OUT/'audit.json').write_text(json.dumps(errors,ensure_ascii=False,indent=2))
