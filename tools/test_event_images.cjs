const assert=require('node:assert/strict'),M=require('../event-images');
const banner={src:'assets/events/0123456789abcdef0123.webp',width:600,height:120};
const data={images:{'quest-1707':banner,'mission-1707':{eventId:'quest-1707'},a:{eventId:'b'},b:{eventId:'a'},bad:{src:'https://outside.example/fake.png',width:600,height:120}}};
assert.strictEqual(M.resolve(data,'quest-1707'),banner);assert.strictEqual(M.resolve(data,'mission-1707'),banner);assert.equal(M.resolve(data,'missing'),null);assert.equal(M.resolve(data,'a'),null);assert.equal(M.resolve(data,'bad'),null);assert.equal(M.render({id:'missing',name:'Missing'}),'');
console.log('Event art: exact IDs, explicit linked missions, safe local paths, missing/cycle fallbacks: OK');
