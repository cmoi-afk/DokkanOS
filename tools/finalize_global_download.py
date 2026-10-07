#!/usr/bin/env python3
"""Merge a fresh public GLOBAL snapshot while retaining stable progress identities."""
import hashlib,json,subprocess,sys
from datetime import datetime,timezone
from pathlib import Path
from import_events import validate
ROOT=Path(__file__).resolve().parents[1]
BASE='d91f87238693ad929137824c15c58deba3d66619'
def read(name):return json.loads((ROOT/name).read_text())
def original(name):return json.loads(subprocess.check_output(['git','show',BASE+':'+name],cwd=ROOT))
def write(name,data):(ROOT/name).write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')
def semantic(data):
 if isinstance(data,dict):return {k:semantic(v) for k,v in data.items() if k not in ['verifiedAt','verified','checkedAt','source','dataStatus']}
 if isinstance(data,list):return [semantic(v) for v in data]
 return data
def preserve_mission_ids(previous,incoming):
 lookup={};oldids={m['id'] for m in previous}
 for m in previous:lookup.setdefault((m.get('title'),m.get('description','')),[]).append(m['id'])
 used={m['id'] for m in incoming if m['id'] in oldids}
 for m in incoming:
  matches=lookup.get((m.get('title'),m.get('description','')),[])
  if m['id'] not in oldids and len(matches)==1 and matches[0] not in used:
   m['id']=matches[0];used.add(m['id'])
def main():
 incoming=json.loads(Path(sys.argv[1]).read_text());validate(incoming)
 audit=json.loads(Path(sys.argv[1]).with_name('audit.json').read_text())
 assert incoming['region']=='GLOBAL' and incoming['coverage']['inventoryComplete'],'Incomplete event inventory'
 current=read('events.json');old={e['id']:e for e in current['events']};seen=set();changes=[]
 for e in incoming['events']:
  seen.add(e['id']);previous=old.get(e['id'])
  if previous:
   if not e.get('detailsLoaded',True):e.clear();e.update(previous);continue
   for key in ['start','end','permanent','datePrecision']:
    if key not in e and key in previous:e[key]=previous[key]
   if e.get('datePrecision')=='day' and not previous.get('datePrecision') and e.get('end','')[:10]==previous.get('end','')[:10] and previous.get('end'):
    e['end']=previous['end'];e.pop('datePrecision',None)
   # Exact matching descriptions retain progress keys even if collector internals change.
   preserve_mission_ids(previous['missions'],e['missions'])
  if not previous or semantic(e)!=semantic(previous):changes.append(e['id'])
 # Source lists mission mirrors separately. Hide exact mirrors to avoid counting
 # the same rewards twice, while keeping the combat's historical progress keys.
 mirrors=[]
 byid={e['id']:e for e in incoming['events']}
 for e in incoming['events']:
  if not e['id'].startswith('mission-') or not e['missions']:continue
  combat=byid.get('quest-'+e['id'].split('-',1)[1])
  signature=lambda x:sorted((m['title'],m.get('description',''),json.dumps(m.get('rewards',[]),sort_keys=True,ensure_ascii=False)) for m in x['missions'])
  if combat and e['id'] not in old and signature(e)==signature(combat):
   e['hidden']=True;e['aliasOf']=combat['id'];mirrors.append(e['id'])
  if e['id']=='mission-1782' and combat:
   combat['permanent']=True;combat['start']=e['start']
 # The public legacy Battlefield index has placeholder dates and cannot identify
 # the announced Ver.3 edition. Give that dated announcement its own identity.
 virtual={'id':'virtual-dokkan-boo-20261005','name':'VIRTUAL DOKKAN · Saga de Boo · Ver. 3.0','kind':'Bataille Royale','source':'https://www.dbz-dokkanbattle.com/announcement/107300','status':'active','start':'2026-10-05T07:00:00+02:00','end':'2026-10-20T09:59:00+02:00','teamMode':'special','missions':[],'stages':[],'detailsLoaded':False,'notes':['Difficulté SUPER 3 ; tous les personnages peuvent participer.','Déblocage : terminer la page 1 des missions Intermédiaire.','Boss, effectifs et récompenses détaillées à consulter en jeu : la fiche publique de cette édition n’est pas exploitable.']}
 incoming['events'].append(virtual);incoming['sourceInventory'].append(virtual['id']);seen.add(virtual['id']);changes.append(virtual['id'])
 upcoming=byid.get('quest-1767')
 if upcoming:
  upcoming['status']='upcoming';upcoming['notes'].append('Missions publiées pour le 09/10/2026 à 07:00 jusqu’au 29/10/2026 à 08:59 (France). Le combat n’est pas encore ouvert au 7 octobre.')
 for e in current['events']:
  if e['id'] not in seen:
   incoming['events'].append({**e,'hidden':True});incoming['sourceInventory'].append(e['id'])
 incoming['lastDownload']='global-2026-10-07';incoming['targetedVerifiedAt']=datetime.now(timezone.utc).isoformat()
 incoming['coverage']['events']=sum(not e.get('hidden') for e in incoming['events'])
 incoming['coverage']['missions']=sum(len(e['missions']) for e in incoming['events'] if not e.get('hidden'))
 validate(incoming);write('events.json',incoming);write('docs/events-audit.json',audit)
 cat=read('catalog.json');meta=read('card-meta.json');oldcat=original('catalog.json');oldmeta=original('card-meta.json')['cards']
 source_report=read('docs/CATALOG-AUDIT-v4.json');retained=[]
 for failure in source_report.get('zErrors',[]):
  cid=failure['id'];c=meta['cards'].get(cid);previous=oldmeta.get(cid,{})
  if not c:continue
  for z in previous.get('zAwakenings',[]):
   if z['kind']==failure['kind'] and not any(x['kind']==z['kind'] for x in c.get('zAwakenings',[])):
    c.setdefault('zAwakenings',[]).append(z);retained.append({'cardId':cid,'kind':z['kind'],'reason':failure['reason']})
    c['eza']=any(x['kind'] in ['ztur','zlr'] for x in c['zAwakenings']);c['seza']=any(x['kind'] in ['superZtur','superZlr'] for x in c['zAwakenings'])
 added=sorted(set(c['id'] for c in cat['cards'])-set(c['id'] for c in oldcat['cards']))
 modified=[c['id'] for c in cat['cards'] if c['id'] in oldmeta and semantic(meta['cards'][c['id']])!=semantic(oldmeta[c['id']])]
 newz=[{'cardId':c['id'],'kind':z['kind']} for c in cat['cards'] for z in meta['cards'][c['id']].get('zAwakenings',[]) if z['kind'] not in {x['kind'] for x in oldmeta.get(c['id'],{}).get('zAwakenings',[])}]
 for c in meta['cards'].values():
  released={z['kind'] for z in c.get('zAwakenings',[]) if z.get('verified') and z.get('available')}
  if 'upcomingAwakenings' in c:c['upcomingAwakenings']=[a for a in c['upcomingAwakenings'] if a['kind'] not in released]
 boo=meta['cards']['1026431'];z=next(z for z in boo['zAwakenings'] if z['kind']=='zlr' and z['verified'] and z['available'])
 write('card-meta.json',meta)
 summary=original('data-download.json');summary.update({'id':'global-2026-10-07','verifiedAt':incoming['targetedVerifiedAt'],'description':'Catalogue, éveils Z disponibles, événements, missions et récompenses actualisés au 7 octobre.','catalogue':{'cards':len(cat['cards']),'addedIds':added,'changedIds':modified,'newAwakenings':newz}})
 summary['awakening']={**summary['awakening'],'available':True,'label':'Éveil Z LR disponible','kit':z['kit'],'source':z['source'],'notes':['Disponibilité confirmée dans les données GLOBAL FR et l’annonce du 5 octobre.']}
 for item in summary['supportItems']:
  if item['id']=='1910':
   item.update({'availability':'20 exemplaires offerts à la première connexion à partir du 05/10/2026 à 07:00 (France).','farming':'Distribution de connexion et missions de campagne ; aucun niveau de farm confirmé.','conversionAt':'2026-10-21T04:00:00+02:00','convertedEffect':'ATT +20 % et chances de coup critique +10 % pour tous les alliés pendant 1 tour.','availabilitySource':'https://www.dbz-dokkanbattle.com/announcement/107299'})
 summary['announced']=[{'name':'Événement Défi du sondage et nouvelles cases Dokkan Frontier EXTRA','description':'Annoncés le 6 octobre. Date et règles détaillées non publiées ; ne sont pas présentés comme jouables.','source':'https://www.dbz-dokkanbattle.com/announcement/107308'}]
 # News is a concise selection; the full event snapshot carries every collected record.
 focus={e['id'] for e in original('data-download.json')['events']}
 focus.update(e['id'] for e in incoming['events'] if (e.get('start') or '').startswith('2026-10') and not e.get('hidden'))
 focus.update(e['id'] for e in incoming['events'] if e['id'] not in old)
 summary['events']=[{k:v for k,v in e.items() if k in ['id','name','kind','start','end','stonesTotal','notes']}|{'missionCount':len(e['missions']),'stageCount':len(e.get('stages',[]))} for e in incoming['events'] if e['id'] in focus and not e.get('hidden')]
 summary['coverage']={'catalogue':read('catalogue-report.json')['status'],'events':incoming['coverage'],'changedEventIds':changes}
 write('data-download.json',summary)
 write('docs/data-download-2026-10-07-audit.json',{'region':'GLOBAL','verifiedAt':summary['verifiedAt'],'baseline':BASE,'addedCards':added,'changedCards':modified,'newAwakenings':newz,'changedEvents':changes,'retainedVerifiedZKits':retained,'eventSourceAudit':audit,'catalogueAudit':read('catalogue-report.json'),'sourceHashes':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in Path('event-cache').glob('*.html')}})
 for script in ['build_event_preview.py','build_progress_data.py']:subprocess.run([sys.executable,str(ROOT/'tools'/script)],cwd=ROOT,check=True)
 print(json.dumps({'addedCards':len(added),'changedCards':len(modified),'newZ':len(newz),'changedEvents':len(changes),'coverage':summary['coverage']},ensure_ascii=False))
if __name__=='__main__':main()
