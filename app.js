'use strict';
const cases = [
  {id:'case-01',caption:'Compare the ceiling lights, cabinet edges and floor patterns during motion. Our result retains clearer contours and surface detail than the blurred or distorted regions in the 3DGS comparison. Three scenes are shown, with intentional cuts at 3 and 6 seconds.',note:'RealSee collection: three independent 3-second clips at 15 fps. These scenes are in the adapted DiFix training split; this collection is not a held-out evaluation.'},
  {id:'case-02',caption:'At 0.8 s, ArtiFixer blurs the air-conditioner details that remain clearly defined in our result. In the final frame, its view is shifted and the microwave remains occluded by the doorway; our result reveals the microwave while preserving the surrounding room structure.',note:'One scene, 134 frames at 30 fps. Our fixed eight-view reference set includes the start view to preserve the foreground table and the kitchen views to preserve the microwave. Baselines retain their original reference sets. GSFixer uses overlapping windows, so window transitions may remain visible.'},
  {id:'case-03',caption:'Inspect the window grid, sofa outline and floor pattern as the viewpoint changes. Our result keeps these fine structures more clearly defined than the 3DGS comparison. The cut at 3 seconds separates two camera segments.',note:'RealSee collection: two 45-frame clips at 15 fps from one scene in the adapted DiFix training split. These are separate generations, not a single continuous 6-second generation.'},
  {id:'case-04',caption:'Track the bed, door frames and corridor boundaries. Our result preserves clearer object outlines and room structure than the 3DGS comparison. Two separate 3-second clips show the bedroom and passage, with an intentional cut.',note:'Two 45-frame clips at 15 fps. The scene is in the adapted restorers’ validation split, while the Gaussian reconstruction is fitted to this scene. Reference banks stay fixed within each clip and differ between clips.'} ,
  {id:'case-05',caption:'A continuous 13-second route from a bedroom, through a corridor, into another room. Our result offers the best overall balance of visual clarity and cross-room continuity among the displayed methods in this selected example. Inspect the dining chairs for the remaining thin-structure artifacts.',note:'One continuous trajectory through five panorama locations: 389 matched target cameras at 30 fps, 512 × 512 pixels and 90° field of view. The scene is in the Wan restorer validation split; its Gaussian reconstruction is fitted to scene observations. The reconstruction uses broader scene observations, not only these five panoramas. Ours uses eight fixed real perspective references and jointly generates the chair-visible middle section. ArtiFixer receives the same eight references; released DiFix uses the same visible-reference schedule as our DiFix stage, both on an independent RGB-only 3DGS reconstruction. GSFixer uses overlapping 49-frame post-render repair windows without Gaussian refitting; window transitions may remain visible. PanoWorld uses its frozen eight input panoramas. PanoSplatt3R uses two complete endpoint panoramas; NoPoSplat uses two perspective crops from those endpoints. Input coverage and training differ: this is a qualitative matched-camera comparison, not an equal-input benchmark.'}
];

const methods={ours:'Ours','3dgs':'3DGS',difix:'DiFix',artifixer:'ArtiFixer','gsfixer-repair':'GSFixer (post-render)',panoworld:'PanoWorld',noposplat:'NoPoSplat (2 crops)',panosplatt3r:'PanoSplatt3R (2 panoramas)'};
const titles=['Large interiors: preserving fine structures','Bedroom → microwave: detail across a room transition','Living space: windows, furniture and floor detail','Bedroom & passage: preserving room structure','Five-pano walkthrough: continuity and remaining limitations'];
const contexts=['Opening clip · first of three scenes','Apartment walkthrough','Opening clip · living space','Opening clip · bedroom','Five panorama locations along the route'];
const $=s=>document.querySelector(s), videos=[$('#ours'),$('#baseline')];
let selected=Math.max(0,cases.findIndex(c=>c.id===location.hash.slice(1))), generation=0, action=0, ready=false, playing=false, duration=134/30, controller;
if(!cases.some(c=>c.id===location.hash.slice(1)))selected=1;
const path=m=>`videos/${cases[selected].id}/${m}.mp4`;
const mediaCache=new Map(),mediaRequests=new Map();
// Static first-party bundles work with the anonymous host's opaque-origin policy.
window.registerVideo=(src,encoded)=>{const binary=atob(encoded),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);mediaCache.set(src,URL.createObjectURL(new Blob([bytes],{type:'video/mp4'})));};
async function mediaURL(src,signal){
 if(mediaCache.has(src))return mediaCache.get(src);
 if(!mediaRequests.has(src)){const request=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=src.replace(/\.mp4$/,'.data.js');script.async=true;script.onload=()=>{script.remove();mediaCache.has(src)?resolve(mediaCache.get(src)):reject(new Error('load'));};script.onerror=()=>{script.remove();reject(new Error('load'));};document.head.append(script);});mediaRequests.set(src,request);request.finally(()=>mediaRequests.delete(src)).catch(()=>{});}
 const url=await mediaRequests.get(src);if(signal.aborted)throw new DOMException('Cancelled','AbortError');return url;
}
window.addEventListener('pagehide',e=>{if(e.persisted)return;for(const url of mediaCache.values())URL.revokeObjectURL(url);mediaCache.clear();});
const available=()=>Object.entries(methods).filter(([k])=>selected===4||!['noposplat','panosplatt3r'].includes(k));
function updateMethods(){const before=$('#method').value;$('#method').replaceChildren(...available().filter(([k])=>k!=='ours').map(([key,name])=>{const o=document.createElement('option');o.value=key;o.textContent=name;return o;}));$('#method').value=available().some(([k])=>k===before)?before:'artifixer';}
function updateReferences(){
 const c=cases[selected],context=contexts[selected],count=selected===4?5:2;$('#reference-context').textContent=context;
 $('.reference-pair').classList.toggle('long-route',selected===4);
 $('.reference-pair').replaceChildren(...Array.from({length:count},(_,j)=>{
  const i=j+1,src=`panoramas/${c.id}/reference-${i}.jpg`,figure=document.createElement('figure'),a=document.createElement('a'),img=document.createElement('img'),caption=document.createElement('figcaption');
  a.id=`reference-link-${i}`;a.href=src;a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label',`Open reference panorama ${i} at full resolution`);
  img.id=`reference-image-${i}`;img.src=src;img.width=1600;img.height=800;img.alt=`Reference panorama ${i} · ${context}`;
  caption.textContent=`${selected===4?'Waypoint':'Reference'} ${i} · Open full image ↗`;a.append(img);figure.append(a,caption);return figure;
 }));
 $('#reference-note').textContent=selected===4?'Original panoramas at the five route waypoints. These are not the complete reconstruction input set.':'Representative input panoramas. Click an image to inspect the source observation.';
 $('#fixed-reference-link').hidden=selected!==4;
 $('#remaining-limitations').hidden=selected!==4;
}
function updateTime(){const t=videos[0].currentTime||0;$('#seek').value=String(t/duration*1000);$('#clock').textContent=`${t.toFixed(1)} / ${duration.toFixed(1)} s`;$('#seek').setAttribute('aria-valuetext',`${t.toFixed(1)} of ${duration.toFixed(1)} seconds`);}
function pause(){action++;playing=false;videos.forEach(v=>v.pause());$('#play').textContent='Play both';if(ready)$('#play').disabled=false;updateTime();}
function waitPlayable(v,id){return new Promise((resolve,reject)=>{let timer,timeout;const events=['canplay','seeked','progress','error'];const clean=()=>{events.forEach(e=>v.removeEventListener(e,check));clearInterval(timer);clearTimeout(timeout);};const check=()=>{if(id!==action){clean();reject(new DOMException('Cancelled','AbortError'));}else if(v.error){clean();reject(new Error('load'));}else if(v.readyState>=3&&!v.seeking){clean();resolve();}};events.forEach(e=>v.addEventListener(e,check));timer=setInterval(check,100);timeout=setTimeout(()=>{clean();reject(new Error('buffering'));},30000);check();});}
async function play(){
 if(!ready)return;const id=++action;playing=false;videos.forEach(v=>v.pause());$('#play').disabled=true;$('#status').textContent='Preparing synchronized playback…';
 const t=videos[0].currentTime>=duration-.05?0:videos[0].currentTime;videos.forEach(v=>{if(Math.abs(v.currentTime-t)>.005)v.currentTime=t;});
 try{await Promise.all(videos.map(v=>waitPlayable(v,id)));if(id!==action)return;await Promise.all(videos.map(v=>v.play()));if(id!==action)return;playing=true;$('#play').textContent='Pause both';$('#status').textContent='';}
 catch(e){if(id===action){videos.forEach(v=>v.pause());playing=false;$('#play').textContent='Play both';if(e.name!=='AbortError')$('#status').textContent='Videos are still buffering. Try Play both again or use a direct video link.';}}
 finally{if(id===action)$('#play').disabled=false;}
}
function waitReady(v,signal){return new Promise((resolve,reject)=>{const clean=()=>{v.removeEventListener('loadeddata',ok);v.removeEventListener('error',bad);signal.removeEventListener('abort',cancel);};const ok=()=>{clean();resolve();};const bad=()=>{clean();reject(new Error('load'));};const cancel=()=>{clean();reject(new DOMException('Cancelled','AbortError'));};v.addEventListener('loadeddata',ok);v.addEventListener('error',bad);signal.addEventListener('abort',cancel,{once:true});if(signal.aborted)cancel();else if(v.readyState>=2)ok();});}
function updateFocus(){const items=selected===1?[[.8,'Inspect AC detail · 0.8 s'],['end','Inspect final view']]:selected===4?[[7.93,'Inspect chair · 7.9 s'],[8.1,'After transition · 8.1 s'],[9.2,'Thin chair legs · 9.2 s']]:[];$('#focus-points').hidden=!items.length;$('#focus-points').replaceChildren(...items.map(([t,label])=>{const b=document.createElement('button');b.textContent=label;b.dataset.focus=t;b.disabled=true;b.onclick=()=>{if(!ready)return;pause();const time=t==='end'?Math.max(0,duration-1/30):t;videos.forEach(v=>v.currentTime=time);updateTime();};return b;}));}
async function load(keepTime=false){
 const ticket=++generation,wasPlaying=playing,t=keepTime?videos[0].currentTime:0;pause();controller?.abort();controller=new AbortController();const signal=controller.signal;
 ready=false;$('#play').disabled=$('#restart').disabled=$('#seek').disabled=true;$('#status').textContent='Loading videos…';
 const method=$('#method').value;$('#baseline-name').textContent=methods[method];$('#baseline').setAttribute('aria-label',methods[method]+' result');$('#caption').textContent=cases[selected].caption;updateFocus();$('#scene-title').textContent=titles[selected];$('#note').textContent=cases[selected].note;
 $('#download-ours').href=path('ours');$('#download-baseline').href=path(method);$('#downloads').replaceChildren(...available().map(([key,name])=>{const a=document.createElement('a');a.href=path(key);a.textContent=name+' MP4';a.download=`${cases[selected].id}-${key}.mp4`;return a;}));
 videos.forEach((v,i)=>{v.removeAttribute('src');v.poster=`posters/${cases[selected].id}/${i?method:'ours'}.jpg`;v.load();});
 try{const sources=await Promise.all(['ours',method].map(m=>mediaURL(path(m),signal)));if(ticket!==generation)return;await Promise.all(videos.map((v,i)=>{const m=i?method:'ours';v.poster=`posters/${cases[selected].id}/${m}.jpg`;v.src=sources[i];v.preload='auto';v.load();v.playbackRate=Number($('#speed').value);return waitReady(v,signal);}));if(ticket!==generation)return;duration=Math.min(...videos.map(v=>v.duration));videos.forEach(v=>v.currentTime=Math.min(t,Math.max(0,duration-.05)));ready=true;document.querySelectorAll('[data-focus]').forEach(b=>b.disabled=false);$('#play').disabled=$('#restart').disabled=$('#seek').disabled=false;$('#status').textContent='';updateTime();if(wasPlaying)play();}catch(e){if(ticket===generation&&e.name!=='AbortError')$('#status').textContent='Video could not load. Please try a direct video link below.';}
}
$('#play').onclick=()=>playing?pause():play();$('#restart').onclick=()=>{pause();videos.forEach(v=>v.currentTime=0);updateTime();};
$('#seek').addEventListener('input',e=>{const t=Number(e.target.value)/1000*duration;pause();videos.forEach(v=>v.currentTime=Math.min(t,duration));updateTime();});
$('#speed').onchange=e=>videos.forEach(v=>v.playbackRate=Number(e.target.value));$('#method').onchange=()=>load(true);
function showCase(n){selected=n;document.querySelectorAll('[data-case]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.case)===n)));updateMethods();updateReferences();load();}
document.querySelectorAll('[data-case]').forEach(b=>b.onclick=()=>{const n=Number(b.dataset.case);if(n===selected)return;history.replaceState(null,'',`#${cases[n].id}`);showCase(n);});
window.addEventListener('hashchange',()=>{const n=cases.findIndex(c=>c.id===location.hash.slice(1));if(n>=0&&n!==selected)showCase(n);});
videos[0].addEventListener('ended',pause);videos[0].addEventListener('timeupdate',()=>{if(playing&&!videos.some(v=>v.seeking)&&Math.abs(videos[1].currentTime-videos[0].currentTime)>.09)videos[1].currentTime=videos[0].currentTime;updateTime();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});showCase(selected);
