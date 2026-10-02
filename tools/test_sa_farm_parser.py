import unittest
from pathlib import Path
from collect_sa_farm import parse_grid
class Parser(unittest.TestCase):
 def test_source_methods(self):
  raw=Path('docs/fixtures/sa-farm-boo.html').read_text();row=parse_grid(raw,'Boo (super)')
  self.assertEqual(row['status'],'available');self.assertEqual(len(row['methods']),4);self.assertEqual(row['methods'][-1]['rarity'],'SR');self.assertEqual(row['methods'][0]['sourceRate'],100);self.assertTrue(row['methods'][0]['evolve'])
  with self.assertRaises(ValueError):parse_grid(raw,'Boo (petit)')
 def test_unlisted_and_missing_identity(self):
  raw='<div class="item-container" data-character="Test" data-id="123" data-rarity="4"></div>'
  self.assertEqual(parse_grid(raw,'Test')['status'],'none-listed')
  with self.assertRaises(ValueError):parse_grid('<h1>Cloudflare</h1>','Test')
unittest.main()
