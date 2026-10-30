"""Apply the exact reviewed release only when every baseline/output hash matches."""
import base64,zlib,json,hashlib,subprocess
from pathlib import Path
raw=zlib.decompress(base64.b64decode(Path('docs/global-20261029.delta.zlib.b64').read_bytes()))
assert hashlib.sha256(raw).hexdigest()=='abc144fd000b329f5fbe792023e4e1ca107985b5d2b4f419f5ff3958ca1d3685'
data=json.loads(raw)
outputs=[]
for file in data['files']:
 p=Path(file['path']);assert not p.is_absolute() and '..' not in p.parts
 old=p.read_bytes() if p.exists() else None
 assert (hashlib.sha256(old).hexdigest() if old is not None else None)==file['before'],str(p)
 if file['kind']=='file':out=base64.b64decode(file['base64'])
 else:
  d=json.loads(old)
  for op,path,*args in file['ops']:
   if op=='tail':
    x=d
    for k in path:x=x[k]
    x[args[0]:]=args[1];continue
   x=d
   for k in path[:-1]:x=x[k]
   if op=='order':
    target=x[path[-1]] if path else d;ordered={k:target[k] for k in args[0]}
    if path:x[path[-1]]=ordered
    else:d=ordered
   elif op=='set':
    if path:x[path[-1]]=args[0]
    else:d=args[0]
   elif op=='del':del x[path[-1]]
   else:raise ValueError(op)
  out=(json.dumps(d,ensure_ascii=False,separators=(',',':'))+ ('\n' if file['newline'] else '')).encode()
 assert hashlib.sha256(out).hexdigest()==file['after'],str(p)
 outputs.append((p,out))
for p,out in outputs:p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(out)
subprocess.run(['git','add','--',*[str(p) for p,_ in outputs]],check=True)
print('Verified and staged',len(outputs),'reviewed files')
