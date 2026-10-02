#!/usr/bin/env python3
"""Validate a collected snapshot, retain legacy progress IDs and write the app data."""
import json,sys
from pathlib import Path
from import_events import validate
incoming=json.loads(Path(sys.argv[1]).read_text());validate(incoming)
target=Path('events.json');current=json.loads(target.read_text());ids={e['id'] for e in incoming['events']}
for e in current['events']:
 if (e.get('hidden') or current.get('schema')=='dokkanos-events-v1') and e['id'] not in ids:
  incoming['events'].append({**e,'hidden':True});incoming['sourceInventory'].append(e['id'])
validate(incoming)
target.write_text(json.dumps(incoming,ensure_ascii=False,separators=(',',':'))+'\n')
Path('docs/events-audit.json').write_text(Path(sys.argv[1]).with_name('audit.json').read_text())
print('Snapshot validated:',incoming['coverage'])

# Keep lightweight startup and exact medal indexes consistent with the full snapshot.
import subprocess
subprocess.run([sys.executable,'tools/build_event_preview.py'],check=True)
subprocess.run([sys.executable,'tools/build_progress_data.py'],check=True)
