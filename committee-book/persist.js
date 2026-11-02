(function(){
 window.CBPersist={
  load:function(key){try{var raw=localStorage.getItem(key);if(!raw)return null;var o=JSON.parse(raw);return o&&typeof o==='object'&&!Array.isArray(o)?o:null}catch(_){return null}},
  save:function(key,state,skip){try{var c={};Object.keys(state).forEach(function(k){if(skip.indexOf(k)===-1&&typeof state[k]!=='function')c[k]=state[k]});localStorage.setItem(key,JSON.stringify(c))}catch(_){}},
  clear:function(key){try{localStorage.removeItem(key)}catch(_){}}
 };
})();
