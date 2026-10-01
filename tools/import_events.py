#!/usr/bin/env python3
"""Validate and merge a sourced GLOBAL FR event export without touching card data.
Usage: python tools/import_events.py /path/to/export.json
The exporter must preserve event IDs, mission IDs, source URLs and requirements.
Completeness is only reported when the export supplies its full source inventory.
"""
import argparse,json
from pathlib import Path
from urllib.parse import urlparse
ROOT=Path(__file__).resolve().parents[1]
KINDS={'category','type','class','card','types','excludeRarity'}
def validate(data):
 if data.get('region')!='GLOBAL' or data.get('locale')!='fr':raise ValueError('Export GLOBAL français requis')
 events=data.get('events')
 if not isinstance(events,list) or not events:raise ValueError('Liste d’événements vide')
 seen=set();missions=set()
 for event in events:
  for key in ['id','name','source','missions']:
   if key not in event or (key!='missions' and not event.get(key)):raise ValueError(f'Champ événement absent : {key}')
  if event['id'] in seen:raise ValueError('ID événement dupliqué')
  seen.add(event['id'])
  if urlparse(event['source']).scheme!='https':raise ValueError('Source HTTPS requise')
  for mission in event['missions']:
   if not mission.get('id') or not mission.get('title') or mission['id'] in missions:raise ValueError('Mission sans identité unique')
   missions.add(mission['id'])
   if not isinstance(mission.get('requirements'),list):raise ValueError('Contraintes structurées requises')
   for r in mission['requirements']:
    if r.get('kind') not in KINDS:raise ValueError('Contrainte non prise en charge : '+str(r.get('kind')))
    if r['kind'] not in ['types'] and not r.get('value'):raise ValueError('Valeur de contrainte absente')
    if r['kind']!='excludeRarity' and not (isinstance(r.get('count'),int) and 1<=r['count']<=7):raise ValueError('Quota invalide')
    if not isinstance(r.get('includeFriend'),bool):raise ValueError('Règle ami inclus/exclu obligatoire')
 coverage=data.get('coverage',{})
 if coverage.get('complete') and (not data.get('sourceInventory') or set(data['sourceInventory'])!=seen):raise ValueError('Inventaire source complet obligatoire pour annoncer la couverture complète')
 return len(events),len(missions)
def main():
 parser=argparse.ArgumentParser();parser.add_argument('export',type=Path);args=parser.parse_args();incoming=json.loads(args.export.read_text());validate(incoming)
 target=ROOT/'events.json';current=json.loads(target.read_text());merged={e['id']:e for e in current['events']};merged.update({e['id']:e for e in incoming['events']});current['events']=list(merged.values());current['verifiedAt']=incoming.get('verifiedAt',current['verifiedAt']);current['coverage']={**incoming.get('coverage',{}),'complete':False,'reason':'Import fusionné ; couverture globale à auditer','events':len(merged),'missions':sum(len(e['missions']) for e in merged.values())};validate(current);target.write_text(json.dumps(current,ensure_ascii=False,indent=2)+'\n');print('Événements et missions validés :',current['coverage'])
if __name__=='__main__':main()
