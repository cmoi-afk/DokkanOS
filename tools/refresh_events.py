#!/usr/bin/env python3
"""Auditable GLOBAL FR snapshot. No guessed rewards, openings or combat constraints.
Run in CI (public source access); output events.json and audit.json in event-source.
"""
import concurrent.futures,hashlib,json,re,time,urllib.request,os
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
from bs4 import BeautifulSoup
BASE='https://www.dbz-dokkanbattle.com';OUT=Path('event-source');OUT.mkdir(exist_ok=True)
CACHE=Path(os.environ.get('EVENT_CACHE','event-cache'));CACHE.mkdir(exist_ok=True)
TZ=ZoneInfo('Europe/Paris');errors={};pages={};names={}
INDEX={'/event/challenge':'Défi','/event/story':'Histoire','/event/growth':'Préparation','/event/limited':'Limité','/zbattles':'Combat Z suprême','/db-stories':'DB Stories','/quests':'Quête','/origin/series':'Dokkan Frontier','/burst-modes':'Burst Mode','/tenkaichi-budokais':'Tenkaichi Budokai','/event/rmbattles':'Bataille Royale','/sd-characters':'Pettan Battle','/limited-missions-categories':'Missions limitées','/board-missions':'Missions de panneaux','/dokkan-frontier-missions':'Missions Dokkan Frontier','/burst-mode-missions':'Missions Burst Mode','/mission/1':'Missions régulières','/mission/6':'Missions Kaio Shin','/mission/1000':'Missions quotidiennes'}
def txt(n):return re.sub(r'\s+',' ',n.get_text(' ',strip=True)).strip() if n else ''
def fetch(path):
 f=CACHE/((path.strip('/').replace('/','_') or 'home')+'.html')
 if f.exists():return path,f.read_text()
 for attempt in range(3):
  try:
   req=urllib.request.Request(BASE+path,headers={'User-Agent':'Mozilla/5.0 DokkanOS public event catalogue'})
   with urllib.request.urlopen(req,timeout=35) as r:raw=r.read().decode('utf-8')
   f.write_text(raw);return path,raw
  except Exception as e:
   if attempt==2:errors[path]=str(e);return path,''
   time.sleep(attempt+1)
def batch(paths):
 paths=sorted(set(paths)-pages.keys())
 with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
  for path,raw in pool.map(fetch,paths):pages[path]=BeautifulSoup(raw,'html.parser')
 print('Pages',len(pages),'errors',len(errors),flush=True)
def date(value):
 value=value.replace(' à ',' ').replace('→',' ')
 m=re.search(r'(\d{2})[/-](\d{2})[/-](\d{4})(?:\s+(\d{2}):(\d{2}))?',value)
 if not m:return None
 d,mo,y,h,mi=m.groups()
 if int(y)<2015 or int(y)>=2037:return None
 try:return datetime(int(y),int(mo),int(d),int(h or 23),int(mi or 59),tzinfo=TZ).isoformat()
 except ValueError:return None
def reward(node):
 result=[]
 for c in node.select('.item-container'):
  img=c.select_one('img.item-content, img.item-card-content');q=c.select_one('.item-quantity')
  if not img or not q:continue
  amount=re.search(r'[\d ,]+',txt(q))
  if not amount:continue
  amount=int(re.sub(r'\D','',amount.group()));src=img.get('src','');asset=src.split('/')[-1];stone='dragon-stone' in src or asset=='ds.png'
  name=img.get('title') or img.get('alt') or names.get(asset)
  if not name:
   label=next((v for k,v in [('support_memory_enhancement','Médaille de mémoire de soutien'),('/awaken/','Médaille d’éveil'),('/potential/','Orbe de potentiel'),('/training/','Objet d’entraînement'),('/equipment/','Équipement'),('/other/','Trésor / ticket'),('/support/','Objet de soutien'),('/character/','Personnage')] if k in src),'Objet')
   identifier=re.findall(r'\d+',asset);name=label+(' · réf. '+identifier[-1] if identifier else '')
  result.append({'name':'Pierre Dragon' if stone else name,'kind':'stones' if stone else 'item','amount':amount,'image':BASE+'/'+src.lstrip('./'),'identified':stone or bool(img.get('title') or img.get('alt') or names.get(asset))})
 return result
def requirements(text):
 out=[]
 # Only an explicit number and category with unambiguous friend scope is automated.
 for m in re.finditer(r'(?:au moins\s+)?([1-7])\s+(?:persos?|personnages?|combattants?)(?:\s+de)?\s+(?:la\s+)?catégorie\s*["«]([^"»]+)["»]',text,re.I):
  if 'sauf amis' in text or 'sans ami' in text or 'hors ami' in text:out.append({'kind':'category','value':m[2],'count':int(m[1]),'includeFriend':False})
 return out
def missions(s,path):
 out=[];seen=set()
 for c in s.select('.quest-mission-card, .news-card--mission'):
  title=txt(c.select_one('.news-card__title'));description=txt(c.select_one('.basic-paragraph.center'))
  if not title:continue
  key=title+'|'+description
  if key in seen:continue
  seen.add(key);m={'id':'m-'+hashlib.sha1((path+'|'+key).encode()).hexdigest()[:16],'title':title,'description':description,'requirements':requirements(description),'manualCheck':True,'rewards':reward(c)}
  n=re.search(r'\bniveau\s+(\d+)\b',description,re.I)
  if n:m['stageNumber']=int(n[1])
  dates=c.select('.primaryMain')
  if dates:
   for k,v in [('start',date(txt(dates[0]))),('end',date(txt(dates[-1])))]:
    if v:m[k]=v
  out.append(m)
 return out
def stages(s,path):
 out=[]
 for level in s.select('.quest-level-card'):
  number=txt(level.select_one('.quest-level-num'));name=txt(level.select_one('.quest-level-name'))
  panels=level.select('.quest-diff-panel') or [level];tabs=level.select('.quest-diff-tab')
  for i,p in enumerate(panels):
   boss=p.select_one('.quest-boss-btn');difficulty=txt(tabs[i]) if len(tabs)>i else ''
   st={'id':boss.get('href').split('/')[-1] if boss else number+'-'+str(i),'name':(number+' · '+name+(' · '+difficulty if difficulty else '')).strip(),'number':int(number) if number.isdigit() else None,'difficulty':difficulty,'requirements':[],'notes':[],'rewards':reward(p.select_one('.quest-drops-grid') or BeautifulSoup('','html.parser')),'manualCheck':True}
   if boss:st['source']=BASE+boss.get('href')
   for v in p.select('.quest-stat'):
    label=txt(v.select_one('.quest-stat-label'));value=txt(v.select_one('.quest-stat-value'))
    if label=='ACT' and value.isdigit():st['act']=int(value)
    if 'Récompenses' in label:
     q=re.search(r'x\s*(\d+)',value)
     if q:st['rewards'].append({'name':'Pierre Dragon','kind':'stones','amount':int(q[1])})
   st['notes']=[x.get('data-tip') for x in p.select('.zb-skill[data-tip]')]
   st['disableDodge']=any(re.search(r'(?:annule|empêche|désactive).*esquive',x,re.I) for x in st['notes'])
   out.append(st)
 return out
batch(INDEX)
# Crawl catalogue pagination and chapter/area/Frontier navigation only, never community teams.
for _ in range(4):
 paths=[]
 for path,s in list(pages.items()):
  for a in s.select('a[href]'):
   h=a.get('href','')
   if re.fullmatch(r'/(?:limited-missions-categories/current/\d+|chapter-quests/\d+|area-quests/\d+|origin/series/\d+)',h):paths.append(h)
 if not set(paths)-pages.keys():break
 batch(paths)
# Learn available reward labels without fabricating missing names.
itempaths=['/items/'+x for x in ['ActItem','TreasureItem','SpecialItem','AwakeningItem','WallpaperItem','EventkagiItem','PotentialItem','SupportItem','TrainingItem','TrainingField']]
batch(itempaths)
for path in itempaths:
 for img in pages[path].select('img'):
  name=img.get('title') or img.get('alt')
  if name and not name.startswith(('/','..')):names[img.get('src','').split('/')[-1]]=name
inventory={}
DETAIL=re.compile(r'/(?:quest/\d+|zbattle/\d+|mission/\d+|board-missions/\d+|tenkaichi-budokai/\d+|event/rmbattle/\d+|sd-character/\d+|origin/series/\d+)$')
for path,s in list(pages.items()):
 if path in itempaths:continue
 family=INDEX.get(path)
 if not family:
  family='Quête' if 'quests' in path else 'Dokkan Frontier' if path.startswith('/origin') else 'Missions limitées'
 for a in s.select('a[href]'):
  h=a.get('href','')
  if not DETAIL.fullmatch(h):continue
  # Navigation links to these pages belong to their own inventory, not every family.
  if h in ['/mission/1','/mission/6','/mission/1000']:continue
  title=txt(a.select_one('.event-card-name,.tb-budokai-card__edition,.missions-block__title')) or a.get('data-event-name') or a.get('data-zbattle-name') or txt(a)
  if not title and h in inventory:continue
  if h not in inventory:inventory[h]={'id':h.strip('/').replace('/','-'),'name':title or family+' '+h.split('/')[-1],'kind':family,'source':BASE+h,'status':'unknown','missions':[],'stages':[]}
  e=inventory[h]
  cat=a.get('data-event-category')
  if cat and path=='/event/challenge':e['kind']={'10':'Dokkan Event','11':'Combat éminent','12':'Zone Z suprême','20':'Défi'}.get(cat,'Défi')
  if a.select_one('.is-permanent'):e['permanent']=True
  status=a.get('data-event-status')
  if status:e['status']='closed' if status=='inactive' else status
  end=date(txt(a.select_one('.event-card-end')))
  if end:e['end']=end;e['datePrecision']='day'
  ds=txt(a.select_one('.event-card-ds'))
  if ds.isdigit():e['stonesTotal']=int(ds)
  dates=re.findall(r'\d{2}[/-]\d{2}[/-]\d{4}(?:\s+(?:à\s+)?\d{2}:\d{2})?',txt(a))
  if len(dates)>=2:
   for k,v in [('start',date(dates[0])),('end',date(dates[1]))]:
    if v:e[k]=v
for p,k in INDEX.items():
 if p.startswith('/mission/') or p in ['/dokkan-frontier-missions','/burst-mode-missions']:
  inventory[p]={'id':p.strip('/').replace('/','-'),'name':k,'kind':k,'source':BASE+p,'permanent':True,'missions':[],'stages':[]}
batch(inventory)
for path,e in inventory.items():
 s=pages[path];e['missions']=missions(s,path);e['stages']=stages(s,path)
 heads=[txt(h) for h in s.select('h1') if txt(h)]
 if heads and path.startswith(('/quest/','/zbattle/','/mission/','/board-missions/')):e['name']=heads[-1]
 e['detailsLoaded']=path not in errors;e['notes']=[]
 if not e['missions']:e['notes'].append('Aucune mission extraite de cette fiche ; vérifie les missions liées ou la source en jeu.')
 if e['kind'] in ['Pettan Battle','Dokkan Frontier','Bataille Royale','Burst Mode']:
  e['teamMode']='special';e['notes'].append('Ce mode possède ses propres règles. Le constructeur standard aide à choisir des cartes ; vérifie les effectifs et restrictions propres au mode dans la source.')
# Enemy abilities: only explicitly parsed source skills on open challenge stage pages.
bosspaths=[]
for e in inventory.values():
 if e['kind'] in ['Défi','Zone Z suprême'] and (e.get('permanent') or e.get('status')=='active'):
  bosspaths.extend(st['source'].replace(BASE,'') for st in e['stages'] if st.get('source'))
batch(bosspaths)
for e in inventory.values():
 for st in e['stages']:
  p=st.get('source','').replace(BASE,'')
  if p in pages:
   skills=[x.get('data-tip') for x in pages[p].select('[data-tip]') if x.get('data-tip')]
   skills=list(dict.fromkeys(skills));st['notes']=list(dict.fromkeys(st['notes']+skills));st['disableDodge']=any(re.search(r'(?:annule|empêche|désactive).*esquive',x,re.I) for x in skills)
   st['rulesVerified']=p not in errors
 e['rulesCoverage']='Les quotas explicites de catégorie sont vérifiés automatiquement ; les autres conditions et restrictions restent à vérifier dans la fiche source.'
data={'schema':'dokkanos-events-v2','region':'GLOBAL','locale':'fr','verifiedAt':datetime.now(TZ).strftime('%d/%m/%Y à %H:%M'),'coverage':{'complete':False,'inventoryComplete':not any(p in errors for p in INDEX),'reason':'Catalogue public GLOBAL FR ; certaines règles de modes spéciaux et récompenses sans nom restent à vérifier en jeu.','events':len(inventory),'missions':sum(len(e['missions']) for e in inventory.values()),'failedPages':len(errors)},'sourceInventory':[e['id'] for e in inventory.values()],'events':list(inventory.values())}
(OUT/'events.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')
(OUT/'audit.json').write_text(json.dumps({'pages':len(pages),'errors':errors,'families':{k:sum(e['kind']==k for e in inventory.values()) for k in sorted(set(e['kind'] for e in inventory.values()))},'coverage':data['coverage']},ensure_ascii=False,indent=2))
# Representative raw pages keep parser changes reviewable without a massive HTML artifact.
for p in ['/quest/1769','/quest/1776','/quest/711','/quest/1354','/zbattle/728','/items/TreasureItem']:
 if p in pages:(OUT/(p.strip('/').replace('/','_')+'.html')).write_text(str(pages[p]))
print(json.dumps(data['coverage'],ensure_ascii=False))
