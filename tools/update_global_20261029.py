#!/usr/bin/env python3
"""Apply the reviewed 29 October GLOBAL FR sources; retain progress identities.
Usage: PYTHONPATH=<beautifulsoup4> python tools/update_global_20261029.py <source-cache>
"""
import sys,json,re,gzip,hashlib,subprocess,concurrent.futures as cf,unicodedata
from pathlib import Path
from datetime import datetime,timezone
from bs4 import BeautifulSoup
import refresh_catalogue_v4 as C
import refresh_events as E
from build_game_items import Items,LABELS
from finalize_global_download import preserve_mission_ids
from import_events import validate
ROOT=Path(__file__).resolve().parents[1];R=Path(sys.argv[1]);STAMP=datetime.now(timezone.utc).isoformat();RELEASE='2026-10-29T06:00:00+01:00'
def read(n):return json.loads(subprocess.check_output(['git','show','517a835f90391d4ceb09aee5f63884a407641110:'+n],cwd=ROOT))
def write(n,d):C.write(ROOT/n,d)
def page(key):return BeautifulSoup((R/(key+'.html')).read_text(),'html.parser')
def union(old,new):
 by={str(x['id']):x for x in new}
 return [{**x,**by.pop(str(x['id']),{})} for x in old]+list(by.values())
def norm(s):return re.sub('[^a-z0-9]','',unicodedata.normalize('NFD',s.lower()).encode('ascii','ignore').decode())
cat=read('catalog.json');meta=read('card-meta.json');events=read('events.json');frontier=read('frontier-data.json');items=read('game-items.json');news=read('data-download.json')
oldcat={c['id']:c for c in cat['cards']};oldE={e['id']:e for e in events['events']};oldcount=sum(len(e['missions']) for e in events['events']);oldstage=sum(len(e.get('stages',[])) for e in events['events'])
rows=C.embedded((R/'cards-index.html').read_text(),'cardsjson');by={str(c['id']):c for c in rows};en={str(c['id']):c for c in C.embedded((R/'cards-index-en.html').read_text(),'cardsjson')}
result={}
for cid,c,err in json.loads((R/'card-results.json').read_text()):
 assert not err and c['dataStatus']['kit']=='verified' and not c.get('zErrors'),(cid,err)
 assert all(str(by[cid][k])==str(en[cid][k]) for k in ['rarity','element','icon_id'])
 result[cid]=c
added=sorted(set(result)-set(oldcat));assert len(added)==6
# Exact API identity verifies the pre-Dokkan UR; the page's awakening_cards supplies its final target.
for base,ur,final in [('1034720','1034721','1034731'),('1034940','1034941','1034861')]:
 raw=json.load(gzip.open(R/'cards'/(base+'.json.gz'),'rt'));api=json.load(gzip.open(R/'cards'/(ur+'-api.json.gz'),'rt'))
 assert str(api['card']['id'])==ur and all(api['card'][k]==raw['card'][k] for k in ['character_id','card_unique_info_id','leader_skill_set_id'])
 assert final in [str(x['id']) for x in raw['awakening_cards']]
 for a,b in [(base,ur),(ur,final)]:result[a]['awakensTo']=b;result[b]['awakensFrom']=a
 result[ur]['awakeningSource']=C.BASE+'/api/cards/'+ur+'/transformation'
 for cid in [base,ur]:result[cid]['awakeningMedals']=[{'id':str(m['awakening_item_id']),'name':m['awakening_medal']['name'],'quantity':m['quantity']} for m in raw['awakening_medals']]
with cf.ThreadPoolExecutor(max_workers=4) as pool:
 images={rid:(path,err,url) for rid,path,err,url in pool.map(C.local_image,sorted({c['resourceId'] for c in result.values()}))}
for cid,c in result.items():
 path,err,url=images[c['resourceId']];assert path and not err,(cid,err)
 c['image']=path;c['dataStatus']['image']='verified'
 m={**meta['cards'].get(cid,{}),**c};m['upcomingAwakenings']=[]
 m['fr']={k:v for k,v in c.items() if k in ['name','title','leader','passiveName','passive','superAttack','ultraSuperAttack','supers','activeName','active','categories','links','transformations','type','class']};m['fr']['_official']=True;meta['cards'][cid]=m
 oldcat[cid]={**oldcat.get(cid,{}),**{k:v for k,v in m.items() if k in ['id','name','title','rarity','type','class','resourceId','openAt','awakensTo','awakensFrom','dataStatus','source','image']}}
cat['cards']=sorted(oldcat.values(),key=lambda c:int(c['id']));cat['reference']['verifiedIds']=sorted(set(cat['reference']['verifiedIds'])|set(added));cat['reference']['releasedPlayableSourceIds']=len(cat['reference']['verifiedIds']);cat['audit'].update(count=len(cat['cards']),uniqueIds=len(cat['cards']),checkedAt=STAMP);cat['audit']['rarityCounts']={r:sum(c['rarity']==r for c in cat['cards']) for r in ['SSR','UR','LR']};meta['targetedVerifiedAt']=STAMP
# Refresh exact item descriptions; retain historical IDs no longer listed.
itemmap={x['key']:x for x in items['items']};newitems=[]
for kind in LABELS:
 parser=Items(kind);parser.feed((R/('items_'+kind+'.html')).read_text());assert parser.rows
 for k,v in parser.rows.items():
  if k not in itemmap:newitems.append(k)
  itemmap[k]=v;E.names[v['image'].split('/')[-1]]=v['name']
items['items']=list(itemmap.values());items['verifiedAt']=STAMP;items['families']={k:sum(x['kind']==k for x in items['items']) for k in LABELS}
# Build inventory attributes from the fresh list cards and mission blocks.
attrs={}
for key in ['event_challenge','event_story','event_growth','event_limited','board-missions','limited-missions-categories']:
 s=page(key)
 for a in s.select('a[href]'):
  h=a['href']
  if not re.fullmatch(r'/(quest|mission|board-missions)/\d+',h):continue
  ident=h.strip('/').replace('/','-');b=a.find_parent(class_='missions-block') or a
  title=E.txt(a.select_one('.event-card-name,.missions-block__title')) or a.get('data-event-name')
  row=attrs.setdefault(ident,{})
  if title:row['name']=title
  if h.startswith('/quest/'):
   row['kind']={'event_challenge':{'10':'Dokkan Event','11':'Combat éminent','12':'Zone Z suprême','20':'Défi'}.get(a.get('data-event-category'),'Défi'),'event_story':'Histoire','event_growth':'Préparation','event_limited':'Limité'}.get(key,'Défi')
  if a.select_one('.is-permanent'):row.update(permanent=True,status='permanent')
  if a.get('data-event-status'):row['status']='closed' if a['data-event-status']=='inactive' else a['data-event-status']
  ds=E.txt(a.select_one('.event-card-ds'))
  if ds.isdigit():row['stonesTotal']=int(ds)
  end=E.date(E.txt(a.select_one('.event-card-end')))
  if end:row.update(end=end,datePrecision='day')
  dates=re.findall(r'\d{2}[/-]\d{2}[/-]\d{4}(?:\s+(?:à\s+)?\d{2}:\d{2})?',E.txt(b.select_one('.board-missions-dates')) or E.txt(b))
  if len(dates)>=2:
   for k,v in [('start',E.date(dates[0])),('end',E.date(dates[1]))]:
    if v:row[k]=v
   if '2038' in dates[1]:row['permanent']=True
paths=['/quest/'+str(n) for n in [1228,1524,737,1751,319,320,1211,1208,716,782,381,374,725,351]]+['/mission/'+str(n) for n in [1228,10428,10426,737]]+['/board-missions/3042','/board-missions/3044','/dokkan-frontier-missions']
changed=[];updated={};newmissions=0
for path in paths:
 ident=path.strip('/').replace('/','-');key=path.strip('/').replace('/','_');s=page(key)
 old=oldE.get(ident,{});row={**old,**attrs.get(ident,{}),'id':ident,'source':E.BASE+path,'missions':[],'stages':[],'detailsLoaded':True}
 row.setdefault('kind','Missions de panneaux' if path.startswith('/board-') else 'Missions Dokkan Frontier' if 'frontier' in path else 'Missions limitées')
 heads=[E.txt(h) for h in s.select('h1') if E.txt(h)]
 if heads and heads[-1]!='Missions':row['name']=heads[-1]
 row.setdefault('name',row['kind']+' · '+path.split('/')[-1])
 incoming=E.missions(s,path);preserve_mission_ids(old.get('missions',[]),incoming)
 row['missions']=union(old.get('missions',[]),incoming);row['stages']=union(old.get('stages',[]),E.stages(s,path));row.setdefault('notes',[])
 for m in row['missions']:
  if not m.get('start') and row.get('start'):m['start']=row['start']
  if not m.get('end') and row.get('end'):m['end']=row['end']
 if ident in ['quest-1228','quest-1524']:row['start']=RELEASE
 if ident in ['quest-1524','quest-319','quest-320','quest-737','quest-1751']:
  row['permanent']=True;row.pop('end',None);row['status']='permanent'
 if ident in ['quest-319','quest-320']:row['notes']=['Difficulté SUPER ajoutée le 29/10/2026 à 06:00 (France).']
 if ident=='quest-737':row['notes']=['Niveau 2 : Super éveil-Z de Great Saiyaman 1 & 2, disponible depuis le 29/10/2026 à 06:00 (France).']
 if ident=='quest-1751':row['notes']=['Niveau 13 ajouté le 29/10/2026 à 06:00 (France). Missions EX liées disponibles dans cette fiche.']
 updated[ident]=row;changed.append(ident)
# Explicit names for dated campaign boards, as published in their announcement.
updated['board-missions-3042']['name']="Plein d'audace ! Missions spéciales Dokkan d'Automne"
updated['board-missions-3044']['name']='Great Saiyaman 1 & 2 · Soutien au renforcement'
updated['mission-10428']['name']='Missions spéciales · La justice dans toute sa splendeur'
updated['mission-10426']['name']='Missions EX · Bataille à pleine puissance 2'
updated['quest-1228']['end']=updated['mission-1228']['end']
updated['quest-1228'].pop('datePrecision',None)
merged={**oldE,**updated};byname={}
for e in merged.values():
 if e['id'].startswith(('quest-','zbattle-')):byname.setdefault(norm(e['name']),[]).append(e['id'])
for e in updated.values():
 for m in e['missions']:
  description=m.get('description','')
  if 'sauf amis' in description:
   typed=re.search(r'([1-7]) persos de type (AGI|TEC|INT|PUI|END)',description)
   if typed:m['requirements']=[{'kind':'type','value':typed[2],'count':int(typed[1]),'includeFriend':False}]
   if 'des types AGI, TEC, INT, PUI et END' in description:m['requirements']=[{'kind':'type','value':t,'count':1,'includeFriend':False} for t in ['AGI','TEC','INT','PUI','END']]
  for target in re.findall(r'événement[^\"]{0,80}\"([^\"]+)\"',m.get('description',''),re.I):
   candidates=byname.get(norm(target),[])
   if len(candidates)==1:m['combatEventId']=candidates[0];break
  if 'Bataille à pleine puissance 2' in m.get('description',''):m['combatEventId']='quest-1751'
 for key in ['start','end']:
  vals=[m[key] for m in e['missions'] if m.get(key)]
  if vals and key not in e and e['kind'].startswith('Missions'):e[key]=(min if key=='start' else max)(vals)
# Exact new mission mirrors share the existing combat UI/progress, avoiding double rewards.
sig=lambda e:sorted((m['title'],m.get('description',''),json.dumps(m.get('rewards',[]),sort_keys=True)) for m in e['missions'])
for ident in ['mission-1228','mission-737']:
 combat=merged.get(ident.replace('mission-','quest-'))
 if combat and sig(updated[ident])==sig(combat):updated[ident].update(hidden=True,aliasOf=combat['id'])
events['events']=list(merged.values());events['sourceInventory']=list(dict.fromkeys(events['sourceInventory']+changed));events['lastDownload']='global-2026-10-29';events['targetedVerifiedAt']=STAMP;events['verifiedAt']=STAMP
events['coverage'].update(events=sum(not e.get('hidden') for e in events['events']),missions=sum(len(e['missions']) for e in events['events'] if not e.get('hidden')))
validate(events)
# Frontier exact NPC identity, phases, heat, missions and timestamps from fresh sources.
newnodes=[]
for number,battle in [(12,20020401),(13,20020402),(14,20020403)]:
 s=page('frontier-'+str(battle));url='https://dokkanstats.com/fr/frontier/battle/'+str(battle);nid='cell-'+str(number);phases=[]
 for phase in s.select('.phase-container'):
  enemies=[];effects=[]
  for enemy in phase.select('.enemy-card'):
   cid=enemy.select_one('.enemy-profile-wrapper')['href'].strip('/').split('/')[-1];element=int(re.search(r'icon_(\d+)',enemy.select_one('.card-element')['src'])[1]);assert cid in by
   enemies.append({'name':by[cid]['name'],'type':C.TYPES[element%10],'sourceId':cid});effects.extend(E.txt(x) for x in enemy.select('.enemy-skill-desc'))
  effects=list(dict.fromkeys(effects));p={'enemies':enemies,'effects':effects,'stunImmune':None,'sealImmune':None,'atkImmune':None,'defImmune':None}
  for k,text in [('stunImmune',"Empêche l'étourdissement"),('sealImmune','Annule le blocage des attaques spéciales')]:
   if text in effects:p[k]=True
  if 'Annule la réduction de l’ATT et de la DÉF' in effects or "Annule la réduction de l'ATT et de la DÉF" in effects:p.update(atkImmune=True,defImmune=True)
  if enemies:phases.append(p)
 heat=[{'level':int(re.search(r'\d+',E.txt(x.select_one('.intensity-level-badge')))[0]),'effect':E.txt(x.select_one('.intensity-effects'))} for x in s.select('.intensity-level')]
 missions=[{'id':nid+'-win','key':nid+'-win','kind':'win','label':'Gagner cette case'}]
 for m in s.select('.mission-card-square[data-mission-id]'):
  mid=m['data-mission-id']
  if mid=='34950':continue # Chapter-wide goal already in the separate Frontier mission catalogue.
  desc=E.txt(m.select_one('.mission-desc-short'));label=E.txt(m.select_one('.mission-name'));row={'id':mid,'key':mid,'kind':'manual','label':label,'description':desc,'manual':True,'source':url,'start':m.select_one('time')['datetime']}
  if 'sph.' in desc:row['kind']='orbs'
  elif 'dégâts' in desc:row['kind']='damage'
  elif 'tours ou moins' in desc:row.update(kind='turns',count=int(re.search(r'(\d+) tours ou moins',desc)[1]))
  elif 'apt.' in label or 'aptitude active' in desc:row['kind']='active'
  elif 'personnage' in label:row['kind']='character'
  category=re.search(r'(\d+) persos(?: ou plus)? de la catégorie "([^"]+)"',desc)
  if category:row.update(kind='category',count=int(category[1]),category=category[2],manual=False)
  missions.append(row)
 assert phases and len(missions)=={12:3,13:5,14:2}[number]
 newnodes.append({'id':nid,'label':str(number),'name':'Case '+str(number)+' · '+phases[-1]['enemies'][-1]['name'],'chapterId':'cell','chapter':'Cyborg - Saga de Cell','category':'Cyborg - Saga de Cell','source':url,'availableFrom':RELEASE,'phases':phases,'heat':heat,'missions':missions,'mission':missions[0],'special':False,'notes':['PV, ATT et DÉF ennemis non publiés dans la fiche source ; aucune valeur inventée.','Les résistances limitées à un nombre d’activations sont décrites dans les effets, sans être traitées comme des immunités permanentes.']})
frontier['nodes']=union(frontier['nodes'],newnodes);frontier['verifiedAt']=STAMP
merged['origin-episode-2002']['notes']=['Cases 12 à 14 disponibles depuis le 29/10/2026 à 06:00 (France). Les phases, effets, intensités et missions sont disponibles dans le constructeur Frontier.']
# Public update summary; preserve earlier releases, never label yesterday's additions as forthcoming.
z=next(z for z in result['1013391']['zAwakenings'] if z['kind']=='superZlr')
news.update(id='global-2026-10-29',verifiedAt=STAMP,description='Great Saiyaman 2, M. Satan, Super Z-LR Great Saiyaman 1 & 2, nouveaux événements, missions EX et de campagne, niveaux SUPER et cases Frontier 12 à 14.')
news['catalogue']={'cards':len(cat['cards']),'addedIds':added,'changedIds':['1013391'],'newAwakenings':[{'cardId':'1013391','kind':'superZlr'}]}
news['awakenings'].append({'cardId':'1013391','name':result['1013391']['name'],'type':result['1013391']['type'],'kind':'superZlr','available':True,'releaseAt':RELEASE,'source':z['source'],'kit':z['kit']})
news['announced']=[a for a in news['announced'] if not a['name'].startswith(('Prévu le 29','Contenu à venir'))]+[{'name':'À venir : VIRTUAL DOKKAN · 110e édition','description':'Ouverture annoncée le 2 novembre à 09:00 (France), jusqu’au 27 novembre à 08:59.','source':'https://www.dbz-dokkanbattle.com/announcement/107366'}]
focus=list(updated.values())+[merged['origin-episode-2002']]
news['events']=[{k:v for k,v in e.items() if k in ['id','name','kind','start','end','stonesTotal','notes']}|{'missionCount':len(e['missions']),'stageCount':len(e.get('stages',[]))} for e in focus if not e.get('hidden')]
news['coverage']['events']=events['coverage'];news['coverage']['changedEventIds']=changed+['origin-episode-2002']
for name,data in [('catalog.json',cat),('card-meta.json',meta),('events.json',events),('frontier-data.json',frontier),('game-items.json',items),('data-download.json',news)]:write(name,data)
report={'region':'GLOBAL','releaseAt':RELEASE,'verifiedAt':STAMP,'baseline':'517a835f90391d4ceb09aee5f63884a407641110','addedCards':added,'newAwakenings':[{'cardId':'1013391','kind':'superZlr'}],'updatedEvents':changed,'addedMissionRecords':sum(len(e['missions']) for e in events['events'])-oldcount,'addedStageRecords':sum(len(e.get('stages',[])) for e in events['events'])-oldstage,'addedFrontierNodes':[n['id'] for n in newnodes],'newItemIds':newitems,'sourceHashes':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in R.glob('*.html')},'limitations':['Frontier : statistiques ennemies non publiées ; résistances limitées conservées en texte.','État personnel inchangé ; aucune carte marquée possédée et aucune mission validée automatiquement.']}
write('docs/data-download-2026-10-29-audit.json',report)
for script in ['build_event_preview.py','build_progress_data.py']:subprocess.run([sys.executable,str(ROOT/'tools'/script)],cwd=ROOT,check=True)
print(json.dumps({k:v for k,v in report.items() if k not in ['sourceHashes','limitations','newItemIds']},ensure_ascii=False));print('New items',len(newitems))
