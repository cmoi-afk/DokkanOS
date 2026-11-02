/* One parsed copy per resource, requested only when its feature needs it. */
(function(){'use strict';const pending=new Map();window.DokkanResources={json(path,options){if(!pending.has(path))pending.set(path,fetch(path,options).then(r=>{if(!r.ok)throw Error('Ressource indisponible : '+path);return r.json();}).catch(e=>{pending.delete(path);throw e;}));return pending.get(path);}};})();
