#!/usr/bin/env python3
"""Apply a reviewed, source-backed incremental GLOBAL snapshot; preserve history IDs."""
import gzip, hashlib, json, subprocess, sys
from collections import Counter
from pathlib import Path
from import_events import validate

ROOT = Path(__file__).resolve().parents[1]
def read(name): return json.loads((ROOT / name).read_text())
def write(name, data): (ROOT / name).write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n')
def main():
    patch = json.loads(gzip.decompress(Path(sys.argv[1]).read_bytes()))
    assert patch['region'] == 'GLOBAL'
    for name, digest in patch['baselineHashes'].items():
        assert hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == digest, 'Baseline changed: ' + name
    cat, meta, events = read('catalog.json'), read('card-meta.json'), read('events.json')
    byid = {c['id']: c for c in cat['cards']}
    for card in patch['cards']:
        cid = card['id']; previous = meta['cards'].get(cid, {})
        combined = {**previous, **card}
        combined['fr'] = {k: v for k, v in card.items() if k in ['name','title','leader','passiveName','passive','superAttack','ultraSuperAttack','supers','activeName','active','categories','links','transformations','type','class']}
        combined['fr']['_official'] = True
        meta['cards'][cid] = combined
        byid[cid] = {k: v for k, v in card.items() if k in ['id','name','title','rarity','type','class','resourceId','openAt','awakensTo','awakensFrom','dataStatus','source','image']}
    cat['cards'] = sorted(byid.values(), key=lambda c: int(c['id']))
    cat['reference']['verifiedIds'] = sorted(set(cat['reference']['verifiedIds']) | set(patch['catalogue']['addedIds']))
    cat['reference']['incrementalVerifiedAt'] = patch['verifiedAt']
    cat['audit'].update(count=len(byid), uniqueIds=len(byid), duplicateIds=0, rarityCounts=dict(Counter(c['rarity'] for c in cat['cards'])), checkedAt=patch['verifiedAt'])
    meta['targetedVerifiedAt'] = patch['verifiedAt']
    eventmap = {e['id']: e for e in events['events']}
    eventmap.update({e['id']: e for e in patch['events']})
    events['events'] = list(eventmap.values())
    events['sourceInventory'] = list(dict.fromkeys(events['sourceInventory'] + [e['id'] for e in patch['events']]))
    events['missionAliases'] = {**events.get('missionAliases', {}), **patch['missionAliases']}
    events['lastDownload'] = patch['id']; events['targetedVerifiedAt'] = patch['verifiedAt']
    events['coverage']['events'] = sum(not e.get('hidden') for e in events['events'])
    events['coverage']['missions'] = sum(len(e['missions']) for e in events['events'] if not e.get('hidden'))
    validate(events)
    boss = read('boss-profiles.json'); boss['profiles'].update(patch['bossProfiles'])
    boss.update(collected=len(boss['profiles']), verifiedAt=patch['verifiedAt'])
    frontier = read('frontier-data.json'); nodes = {n['id']: n for n in frontier['nodes']}
    nodes.update({n['id']: n for n in patch['frontierNodes']})
    frontier.update(nodes=list(nodes.values()), verifiedAt=patch['verifiedAt'])
    for e in frontier['chapters']:
        if e['id'] in ['cell', 'namek']: e['updatedAt'] = patch['verifiedAt']
    items = read('game-items.json'); itemmap = {i['key']: i for i in items['items']}; itemmap.update({i['key']: i for i in patch['items']})
    items.update(items=list(itemmap.values()), verifiedAt=patch['verifiedAt'], families=dict(Counter(i['kind'] for i in itemmap.values())))
    recent = read('recent-cards.json'); recentmap = {c['id']: c for c in recent['cards']}
    recentmap.update({c['id']: c for c in patch['cards'] if c['id'] in patch['catalogue']['addedIds']})
    recent.update(cards=list(recentmap.values()), verifiedAt=patch['verifiedAt'])
    summary = read('data-download.json')
    summary.update({k: patch[k] for k in ['id','verifiedAt','description','catalogue','announced','awakenings']})
    summary['events'] = [{k: e[k] for k in ['id','name','kind','start','end','stonesTotal','notes'] if k in e} | {'missionCount':len(e['missions']), 'stageCount':len(e.get('stages', []))} for e in patch['events'] if not e.get('hidden')]
    summary['coverage']['changedEventIds'] = [e['id'] for e in patch['events']]
    summary['coverage']['events'] = events['coverage']
    for item in summary.get('supportItems', []):
        if item['id'] == '1910': item['availability'] = '20 exemplaires offerts le 05/10/2026, puis 10 supplémentaires annoncés le 09/10/2026.'
    audit = read('docs/CATALOG-AUDIT-v4.json'); after = audit['after']
    after.update(cards=len(byid), rarities=dict(Counter(c['rarity'] for c in cat['cards'])), kitsVerified=sum(c.get('dataStatus',{}).get('kit')=='verified' for c in cat['cards']), imagesVerified=sum(c.get('dataStatus',{}).get('image')=='verified' for c in cat['cards']), zKits=dict(Counter(z['kind'] for cid in byid for z in meta['cards'][cid].get('zAwakenings',[]))))
    report = read('catalogue-report.json'); report['after'] = after; report['incrementalVerifiedAt'] = patch['verifiedAt']
    for name, data in [('catalog.json',cat),('card-meta.json',meta),('events.json',events),('boss-profiles.json',boss),('frontier-data.json',frontier),('game-items.json',items),('recent-cards.json',recent),('data-download.json',summary),('catalogue-report.json',report)]: write(name,data)
    for name, content in patch.get('runtimeFiles', {}).items():
        target = (ROOT / name).resolve()
        assert target.is_relative_to(ROOT) and not name.startswith('.'), 'Invalid runtime path'
        target.write_text(content)
    write('docs/data-download-2026-10-17-audit.json', {k:v for k,v in patch.items() if k in ['id','region','verifiedAt','baselineHashes','sourceHashes','catalogue','excludedSourceIds','errors'] } | {'changedEvents':[e['id'] for e in patch['events']], 'frontierNodes':[n['id'] for n in patch['frontierNodes']], 'updatedItems':len(patch['items']), 'bossProfiles':len(patch['bossProfiles'])})
    for script in ['build_event_preview.py','build_progress_data.py']:
        subprocess.run([sys.executable, str(ROOT/'tools'/script)], cwd=ROOT, check=True)
    print('Applied',patch['id'],'cards',len(patch['catalogue']['addedIds']),'events',len(patch['events']),'Frontier nodes',len(patch['frontierNodes']))
if __name__ == '__main__': main()
