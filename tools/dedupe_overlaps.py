#!/usr/bin/env python3
"""Merge repeated physical positions using aligned capture rows, never character IDs.
Raw data/crops remain intact. Foil animations are ignored using trimmed pixel error;
at least five aligned cards, distinct visual anchors and an unambiguous row shift
are required. Run with Python, Pillow and numpy.
"""
import json
from pathlib import Path
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]

def visual_distance(a,b):
    best=255.0
    for dy in range(-12,13,2):
        for dx in (-2,0,2):
            diff=np.abs(a[15:54,7:53]-b[15+dy:54+dy,7+dx:53+dx]).mean(axis=2).ravel()
            best=min(best,float(np.sort(diff)[:int(diff.size*.65)].mean()))
    return best

def aligned_pairs(a,b,shift):
    index={c['position']:c for c in b};out=[]
    for c in a:
        row,col=map(int,c['position'][1:].split('C'))
        other=index.get(f'L{row-shift}C{col}')
        if other:out.append((c,other))
    return out

def detect(a,b,features):
    candidates=[]
    for shift in range(5):
        pairs=aligned_pairs(a,b,shift)
        if len(pairs)<5:continue
        errors=[visual_distance(features[x['boxId']],features[y['boxId']]) for x,y in pairs]
        candidates.append((float(np.median(errors)),shift,pairs,errors))
    candidates.sort(key=lambda x:x[0])
    if not candidates:return None
    median,shift,pairs,errors=candidates[0]
    # Whole duplicate screenshots may contain a few heavily animated icons.
    limit=28 if shift==0 and len(pairs)>=20 else 22
    if median>16 or max(errors)>limit:return None
    if shift==0 and sum(e<=16 for e in errors)<len(errors)*.8:return None
    if len(candidates)>1 and candidates[1][0]-median<10:return None
    anchors=[]
    for c,_ in pairs:
        if all(visual_distance(features[c['boxId']],features[x['boxId']])>22 for x in anchors):anchors.append(c)
        if len(anchors)>=3:break
    if len(anchors)<3:return None
    return {'shift':shift,'pairs':pairs,'medianError':round(median,3),'maximumError':round(max(errors),3)}

def build(raw,features,previous_ids=()):
    by_capture={}
    for c in raw:by_capture.setdefault(c['capture'],[]).append(c)
    parent={c['boxId']:c['boxId'] for c in raw}
    def root(x):
        while parent[x]!=x:parent[x]=parent[parent[x]];x=parent[x]
        return x
    pairs=[];captures=list(by_capture)
    for before,after in zip(captures,captures[1:]):
        hit=detect(by_capture[before],by_capture[after],features)
        if not hit:continue
        for a,b in hit['pairs']:parent[root(b['boxId'])]=root(a['boxId'])
        pairs.append({'from':before,'to':after,'rowShift':hit['shift'],'overlap':len(hit['pairs']),
                      'medianError':hit['medianError'],'maximumError':hit['maximumError']})
    groups={}
    for c in raw:groups.setdefault(root(c['boxId']),[]).append(c)
    previous=set(previous_ids);cards=[];merges=[];conflicts=[]
    keys=['boxId','capture','position','crop','candidateId','runnerId','runnerImage','image','confidence','inliers','validated']
    for observations in groups.values():
        stable=next((c['boxId'] for c in observations if c['boxId'] in previous),observations[0]['boxId'])
        winner=max(observations,key=lambda c:(bool(c.get('validated')),c.get('inliers') or 0))
        card={**winner,'boxId':stable}
        if len(observations)>1:
            card['observations']=[{k:c.get(k) for k in keys} for c in observations]
            confirmed={str(c['candidateId']) for c in observations if c.get('validated') and c.get('candidateId')}
            if len(confirmed)>1:card['validated']=False;card['confidence']='À vérifier';card['_overlapConflict']=True
            ids=[c['boxId'] for c in observations]
            merges.append({'kept':stable,'observations':ids,'sameCandidate':len({c.get('candidateId') for c in observations})==1})
            if len({c.get('candidateId') for c in observations})>1:
                conflicts.append({'physicalPosition':stable,'observations':ids,'candidates':card['observations'],
                                  'suggestedId':card.get('candidateId') if card.get('validated') else None,
                                  'status':'suggested' if card.get('validated') else 'review'})
        cards.append(card)
    manifest={'version':'0.4','method':'aligned visual capture rows','rawPositions':len(raw),
              'canonicalPositions':len(cards),'overlapPositionsRemoved':len(raw)-len(cards),
              'capturePairsMerged':len(pairs),'pairs':pairs,'merges':merges}
    return cards,manifest,{'version':'0.4','count':len(conflicts),'conflicts':conflicts}

def main():
    raw=json.loads((ROOT/'data.json').read_text())['cards']
    # Stable representatives come from the historical collection, so reruns are deterministic.
    prior=json.loads((ROOT/'overlap-map.json').read_text())
    old_kept={m['kept'] for m in prior.get('merges',[])}
    old_removed={x for m in prior.get('merges',[]) for x in m['observations']} - old_kept
    previous=[c['boxId'] for c in raw if c['boxId'] not in old_removed]
    features={c['boxId']:np.asarray(Image.open(ROOT/c['crop']).convert('RGB').resize((60,72)),dtype=float) for c in raw}
    cards,manifest,conflicts=build(raw,features,previous)
    # Preserve representatives across future rebuilds too.
    for file,data in [('collection.json',{'version':'0.4','source':'data.json + visual overlap-map.json','cards':cards}),
                      ('overlap-map.json',manifest),('overlap-conflicts.json',conflicts)]:
        (ROOT/file).write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    print(f"Physical positions: {len(cards)}/{len(raw)}; removed repeats: {len(raw)-len(cards)}; pending: {sum(not c.get('validated') for c in cards)}")
if __name__=='__main__':main()
