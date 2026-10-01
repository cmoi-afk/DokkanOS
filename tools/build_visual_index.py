"""Reproducible visual descriptors for local, explicitly confirmed screenshot suggestions."""
import json
from pathlib import Path
from PIL import Image

def descriptor(im):
    # Same nearest-neighbour sample centres are used in the browser.
    w,h=im.size; data=[]
    for y in range(8):
        for x in range(8):
            px=im.getpixel((min(w-1,int((x+.5)*w/8)),min(h-1,int((y+.5)*h/8))))
            data.extend(round(v/17) for v in px[:3])
    return ''.join(format(v,'x') for v in data)

root=Path(__file__).resolve().parent.parent
cards=json.loads((root/'catalog.json').read_text())['cards']; result=[]
for c in cards:
    if c['rarity'] not in ('SSR','UR','LR'):continue
    p=root/c['image']
    if not p.exists():raise RuntimeError(f'Missing {p}')
    with Image.open(p) as raw:
        im=raw.convert('RGB');w,h=im.size
        views=[im,im.crop((round(w*.1),round(h*.08),round(w*.9),round(h*.72))),im.crop((round(w*.05),round(h*.05),round(w*.95),round(h*.95)))]
        result.append([str(c['id']),[descriptor(v) for v in views]])
out={'version':1,'sample':8,'algorithm':'rgb-grid-nearest-v1','cards':result,'note':'Similarité visuelle, confirmation manuelle obligatoire.'}
(root/'visual-index.json').write_text(json.dumps(out,separators=(',',':'),ensure_ascii=False))
print('Visual descriptors:',len(result),'cards;', (root/'visual-index.json').stat().st_size,'bytes')
