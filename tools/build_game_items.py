#!/usr/bin/env python3
"""Publish exact item identities and descriptions from collected GLOBAL FR indexes."""
import json,sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin
BASE='https://www.dbz-dokkanbattle.com'
LABELS={'ActItem':'ACT','TreasureItem':'Trésors','SpecialItem':'Tickets','AwakeningItem':'Médailles d’éveil','WallpaperItem':'Arrière-plans','EventkagiItem':'Clés','PotentialItem':'Orbes de potentiel','SupportItem':'Objets de soutien','TrainingItem':'Objets d’entraînement','TrainingField':'Lieux d’entraînement'}
class Items(HTMLParser):
 def __init__(self,kind):super().__init__();self.kind=kind;self.rows={}
 def handle_starttag(self,tag,attrs):
  a=dict(attrs);id=a.get('data-item-id')
  if not id or not id.isdigit() or not a.get('data-name-full'):return
  key=self.kind+':'+id
  row={'key':key,'id':id,'kind':self.kind,'label':LABELS[self.kind],'name':a['data-name-full'],'description':a.get('data-desc',''),'source':BASE+'/items/'+self.kind,'farmingSource':urljoin(BASE,a.get('data-href','')),'image':urljoin(BASE,a.get('data-img',''))}
  if key in self.rows and self.rows[key]!=row:raise ValueError('Conflicting item identity: '+key)
  self.rows[key]=row
def main():
 cache=Path(sys.argv[1]);rows=[];counts={}
 for kind in LABELS:
  p=Items(kind);p.feed((cache/('items_'+kind+'.html')).read_text());assert p.rows,'Empty source: '+kind
  rows.extend(p.rows.values());counts[kind]=len(p.rows)
 data={'version':1,'region':'GLOBAL','verifiedAt':json.loads(Path('data-download.json').read_text())['verifiedAt'],'families':counts,'items':rows}
 Path('game-items.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')
 print('GLOBAL sourced item descriptions:',len(rows),counts)
if __name__=='__main__':main()
