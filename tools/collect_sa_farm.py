#!/usr/bin/env python3
"""Collect named F2P SP methods, keeping source rates separate from other forms."""
import concurrent.futures,gzip,hashlib,html,json,re,time,urllib.request,os
from pathlib import Path
from datetime import datetime,timezone
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1];BASE='https://www.dbz-dokkanbattle.com';CACHE=Path(os.environ.get('SA_FARM_CACHE','/tmp/dokkan-sa-source'));CACHE.mkdir(parents=True,exist_ok=True)
META=json.loads((ROOT/'card-meta.json').read_text())['cards'];CAT=json.loads((ROOT/'catalog.json').read_text())['cards'];NOW=datetime.now(timezone.utc).isoformat()
def norm(s):return re.sub(r'\s+',' ',html.unescape(str(s))).strip()
def fetch(path):
 f=CACHE/(hashlib.sha256(path.encode()).hexdigest()+'.gz')
 if f.exists():return gzip.decompress(f.read_bytes()).decode()
 for attempt in range(3):
  try:
   req=urllib.request.Request(BASE+path,headers={'User-Agent':'Mozilla/5.0 DokkanOS public F2P SP index','Accept-Encoding':'gzip'})
   with urllib.request.urlopen(req,timeout=22) as r:
    raw=r.read()
    if r.headers.get('Content-Encoding')=='gzip':raw=gzip.decompress(raw)
   text=raw.decode();f.write_bytes(gzip.compress(raw));return text
  except Exception:
   if attempt==2:raise
   time.sleep(1+attempt)
def parse_grid(raw,expected):
 # The source can redirect an old form to another named character. Never reuse it.
 m=re.search(r'<div\b[^>]*class="item-container[^>]*data-character="([^"]+)"[^>]*>',raw)
 if not m:raise ValueError('Identité source absente')
 actual=norm(m[1])
 if actual!=({'Hercule':'M. Satan'}.get(norm(expected),norm(expected))):raise ValueError('Nom source différent : '+actual)
 card=BeautifulSoup(m[0]+'</div>','html.parser').div
 m=re.search(r'<div\b[^>]*\bid="card_farmable_sa"[^>]*>',raw)
 if not m:return {'status':'none-listed','methods':[],'sourceCardId':card.get('data-id'),'sourceRarity':card.get('data-rarity'),'sourceName':actual}
 end=raw.find('<h3',m.end());fragment=raw[m.start():end if end>=0 else len(raw)]
 s=BeautifulSoup(fragment,'html.parser');methods=[]
 for wrap in s.select('.f2p-card-wrap'):
  a=wrap.select_one('.f2p-card-link');unit=wrap.select_one('.item-container');badge=wrap.select_one('.f2p-sa-badge')
  if not a or not unit or not re.fullmatch(r'/card/\d+',a.get('href','')):continue
  cid=a['href'].split('/')[-1];rate=re.search(r'(\d+)\s*%',badge.get_text() if badge else '')
  methods.append({'donor':cid,'name':norm(a.get('data-name') or a.get('title') or unit.get('data-character','')),'rarity':{'0':'N','1':'R','2':'SR','3':'SSR','4':'UR','5':'LR'}.get(unit.get('data-rarity'),'Inconnue'),'type':{'0':'AGI','1':'TEC','2':'INT','3':'PUI','4':'END'}.get(str(int(unit.get('data-element') or 0)%10)),'evolve':bool(wrap.select_one('.f2p-evolved-badge')),'sourceRate':int(rate[1]) if rate else None,'donorSource':BASE+a['href']})
 return {'status':'available' if methods else 'none-listed','methods':methods,'sourceCardId':card.get('data-id'),'sourceRarity':card.get('data-rarity'),'sourceName':actual}
def free_page(page):
 path='/card-drops/data?type=all&page='+str(page);d=json.loads(fetch(path));out=[]
 for wrap in BeautifulSoup(d['html'],'html.parser').select('.f2p-card-wrap'):
  a=wrap.select_one('.f2p-card-link');unit=wrap.select_one('.item-container')
  if not a or not unit:continue
  cid=a['href'].split('/')[-1];row={'id':cid,'name':norm(a.get('data-name') or a.get('title','')),'acquisition':wrap.get('data-acquisition'),'source':BASE+'/card-drops','locations':[]}
  for q in wrap.select('.f2p-card-source a[href]'):
   path=q['href'];row['locations'].append({'name':q.get('title') or norm(q.get_text()),'source':BASE+path,'event':path.strip('/').replace('/','-') if re.fullmatch(r'/(quest|zbattle)/\d+',path) else None,'sourceStatus':wrap.get('data-event-status','unknown')})
  for ex in wrap.select('.f2p-exchange-row'):
   n=ex.select_one('.f2p-exchange-label');price=ex.select_one('.f2p-exchange-price');row['locations'].append({'name':norm(n.get('title') or n.get_text()) if n else 'Trésor','price':norm(price.get_text()) if price else None,'source':BASE+'/baba-shop','acquisition':'exchange'})
  out.append(row)
 return d,out
def main():
 first,rows=free_page(1);free={r['id']:r for r in rows};errors={}
 with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
  for d,rs in pool.map(free_page,range(2,first['pages']+1)):
   for r in rs:
    if r['id'] in free:free[r['id']]['locations']+=r['locations']
    else:free[r['id']]=r
 print('F2P acquisition index:',len(free),'cards;',first['pages'],'pages',flush=True)
 groups={}
 for c in CAT:
  m=META.get(str(c['id']),c);groups.setdefault(norm(m.get('name') or m.get('fr',{}).get('name') or c.get('fr',{}).get('name') or c['name']),[]).append(str(c['id']))
 def collect(item):
  name,ids=item;last=''
  # Most recent exact name first; a second reference handles source redirects.
  for cid in sorted(ids,key=lambda k:(META.get(k,{}).get('openAt') or 0,int(k)),reverse=True)[:3]:
   try:
    row=parse_grid(fetch('/card/'+cid),name);row.update(name=name,referenceId=cid,source=BASE+'/card/'+cid,verifiedAt=NOW);return name,row
   except Exception as ex:last=str(ex)
  return name,{'name':name,'status':'unknown','methods':[],'error':last}
 bank={}
 with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
  for i,(name,row) in enumerate(pool.map(collect,groups.items()),1):
   bank[name]=row
   if row['status']=='unknown':errors[name]=row['error']
   if i%40==0:print('Named SP methods:',i,'/',len(groups),'unknown',len(errors),flush=True)
 # Donor pages expose SR starting forms missing from the SSR/UR/LR metadata.
 missing={method['donor'] for row in bank.values() for method in row['methods']
          if not any(k in free for k in [method['donor']]+[str(x.get('id')) for x in META.get(method['donor'],{}).get('awakeningOrigins',[])])}
 paths={};path_errors={}
 def donor_path(cid):
  try:
   raw=fetch('/card/'+cid);m=re.search(r'<div[^>]*class="awakening-flow"[^>]*>',raw)
   if not m:return cid,[]
   end=raw.find('<h3',m.end());s=BeautifulSoup(raw[m.start():end if end>=0 else len(raw)],'html.parser')
   ids=list(dict.fromkeys(x.get('data-id') for x in s.select('.awakening-step-result .item-container[data-id]')))
   return cid,ids
  except Exception as ex:path_errors[cid]=str(ex);return cid,[]
 with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
  for i,(cid,ids) in enumerate(pool.map(donor_path,missing),1):
   paths[cid]=ids
   if i%80==0:print('Donor awakening paths:',i,'/',len(missing),flush=True)
 # Explicit awakening origins connect an evolved donor to its farmable starting card.
 for name,row in bank.items():
  for method in row['methods']:
   cid=method['donor'];m=META.get(cid,{})
   ids=[cid]+paths.get(cid,[])+[str(x.get('id')) for x in m.get('awakeningOrigins',[])]+([str(m['awakensFrom'])] if m.get('awakensFrom') else [])
   origins=[free[k] for k in dict.fromkeys(ids) if k in free]
   method['origins']=origins
   if paths.get(cid):method['awakeningSource']=BASE+'/card/'+cid
   method['acquisition']='event' if any(o['acquisition']=='event' for o in origins) else 'exchange' if origins else 'f2p-source'
 D={'version':1,'region':'GLOBAL','verifiedAt':NOW,'source':BASE+'/card-drops','cards':{str(c['id']):norm(META.get(str(c['id']),{}).get('name') or c.get('fr',{}).get('name') or c['name']) for c in CAT},'characters':bank,'coverage':{'cards':len(CAT),'characters':len(groups),'reviewed':len(groups)-len(errors),'unknown':len(errors),'f2pAcquisitionCards':len(free)}}
 (ROOT/'sa-farm.json').write_text(json.dumps(D,ensure_ascii=False,separators=(',',':'))+'\n')
 (ROOT/'docs/sa-farm-audit.json').write_text(json.dumps({'verifiedAt':NOW,'coverage':D['coverage'],'errors':errors,'donorPathErrors':path_errors,'unresolvedDonorOrigins':len({m['donor'] for r in bank.values() for m in r['methods'] if not m['origins']}),'availableCharacters':sum(r['status']=='available' for r in bank.values()),'noneListedCharacters':sum(r['status']=='none-listed' for r in bank.values())},ensure_ascii=False,indent=2)+'\n')
 assert len(D['cards'])==len(CAT);print('SP farming coverage',D['coverage'],flush=True)

if __name__=='__main__':main()
