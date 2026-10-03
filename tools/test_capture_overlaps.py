import importlib.util,json,unittest
from pathlib import Path
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('dedupe',ROOT/'tools/dedupe_overlaps.py');M=importlib.util.module_from_spec(spec);spec.loader.exec_module(M)
class CaptureTests(unittest.TestCase):
 def test_complete_partition_and_real_copies(self):
  raw=json.loads((ROOT/'data.json').read_text())['cards'];cards=json.loads((ROOT/'collection.json').read_text())['cards']
  ids=[o['boxId'] for c in cards for o in c.get('observations',[c])]
  self.assertEqual(len(ids),len(set(ids)));self.assertEqual(set(ids),{c['boxId'] for c in raw})
  self.assertEqual(len(raw)-len(cards),210)
  for c in cards:
   observations=c.get('observations',[c]);self.assertEqual(len(observations),len({o['capture'] for o in observations}))
  self.assertTrue(any(sum(c.get('candidateId')==x['candidateId'] for c in cards)>1 for x in cards if x.get('validated')))
 def pair(self,a,b):
  raw=json.loads((ROOT/'data.json').read_text())['cards'];aa=[c for c in raw if c['capture']==a];bb=[c for c in raw if c['capture']==b]
  features={c['boxId']:np.asarray(Image.open(ROOT/c['crop']).convert('RGB').resize((60,72)),dtype=float) for c in aa+bb}
  return M.detect(aa,bb,features)
 def test_animated_foil_and_wrong_recognition(self):
  self.assertEqual(self.pair('IMG_0076.jpeg','IMG_0077.jpeg')['shift'],4)
  self.assertEqual(self.pair('IMG_0103.jpeg','IMG_0104.jpeg')['shift'],4)
 def test_whole_repeated_screen(self):
  hit=self.pair('IMG_0079.jpeg','IMG_0080.jpeg');self.assertEqual(hit['shift'],0);self.assertEqual(len(hit['pairs']),25)
 def test_actual_unrelated_rows_stay_separate(self):
  self.assertIsNone(self.pair('IMG_0092.jpeg','IMG_0093.jpeg'))
 def test_ids_cannot_create_a_merge(self):
  rng=np.random.default_rng(12);a=[];b=[];features={}
  for i in range(5):
   for dest,cap,row in [(a,'a',5),(b,'b',1)]:
    c={'boxId':cap+str(i),'capture':cap,'position':f'L{row}C{i+1}','candidateId':'same-id'};dest.append(c);features[c['boxId']]=rng.integers(0,256,(72,60,3)).astype(float)
  self.assertIsNone(M.detect(a,b,features))
if __name__=='__main__':unittest.main()
