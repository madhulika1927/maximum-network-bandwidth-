const $ = id => document.getElementById(id);
let edges = [];
let result = null;
let currentStep = -1;
let timer = null;

const palette = ["#42e8ff","#58f0ad","#ffb65c","#9d86ff","#ff6d91"];

function fmt(n){ return Number.isInteger(n) ? n : Number(n.toFixed(2)); }

function loadGraph(g){
  $("source").value=g.source; $("sink").value=g.sink;
  edges=g.edges.map((e,i)=>({...e,id:i}));
  result=null; currentStep=-1;
  $("maxFlow").textContent="—"; $("iterations").textContent="0";
  renderEdgeList(); renderGraph(); renderTimeline(); renderChart(); updateInspector();
}

function renderEdgeList(){
  $("edgeCount").textContent=edges.length;
  $("connectionBadge").textContent=edges.length;
  $("edgeList").innerHTML = edges.length ? edges.map((e,i)=>`
    <div class="edge-row"><span>${e.from}</span><span>→</span><span>${e.to}</span>
    <span class="cap">${fmt(e.capacity)}</span><button class="del" onclick="removeEdge(${i})">×</button></div>`).join("")
    : '<div class="muted" style="padding:14px 0;font-size:9px">No connections yet.</div>';
}
function removeEdge(i){edges.splice(i,1);renderEdgeList();renderGraph();}
$("addEdge").onclick=()=>{
  const from=$("fromNode").value.trim().toUpperCase(), to=$("toNode").value.trim().toUpperCase(), capacity=Number($("capacity").value);
  if(!from||!to||!capacity||capacity<=0){alert("Enter valid From, To and Capacity values.");return}
  edges.push({from,to,capacity}); $("fromNode").value="";$("toNode").value="";$("capacity").value="";
  renderEdgeList();renderGraph();
};
$("loadDemo").onclick=()=>loadGraph(window.DEFAULT_GRAPH);
$("resetBtn").onclick=()=>loadGraph({source:"S",sink:"T",edges:[]});

function nodeSet(){
  const s=new Set([$("source").value.trim().toUpperCase(),$("sink").value.trim().toUpperCase()]);
  edges.forEach(e=>{s.add(e.from);s.add(e.to)}); return [...s].filter(Boolean);
}
function layoutNodes(nodes){
  const w=$("graph").clientWidth,h=$("graph").clientHeight;
  const cx=w/2,cy=h/2,rx=Math.max(90,w*.34),ry=Math.max(70,h*.31);
  const out={};
  nodes.forEach((n,i)=>{
    if(n===$("source").value.trim().toUpperCase())out[n]={x:55,y:cy};
    else if(n===$("sink").value.trim().toUpperCase())out[n]={x:w-55,y:cy};
    else { const a=(i-1)*2*Math.PI/Math.max(nodes.length-2,1)-Math.PI/2; out[n]={x:cx+rx*Math.cos(a),y:cy+ry*Math.sin(a)}; }
  }); return out;
}
function renderGraph(activePath=[]){
  const graph=$("graph"), nodesEl=$("nodes"), svg=$("svg");
  const nodes=nodeSet(), pos=layoutNodes(nodes);
  nodesEl.innerHTML=nodes.map(n=>{
    const cls=(n===$("source").value.trim().toUpperCase()?" source":"")+(n===$("sink").value.trim().toUpperCase()?" sink":"")+(activePath.includes(n)?" active":"");
    return `<div class="node${cls}" style="left:${pos[n].x}px;top:${pos[n].y}px">${n}</div>`;
  }).join("");
  svg.innerHTML="";
  const NS="http://www.w3.org/2000/svg";
  const activePairs=new Set(activePath.slice(0,-1).map((n,i)=>n+"→"+activePath[i+1]));
  edges.forEach((e,i)=>{
    if(!pos[e.from]||!pos[e.to])return;
    const dx=pos[e.to].x-pos[e.from].x,dy=pos[e.to].y-pos[e.from].y,len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len;
    const x1=pos[e.from].x+ux*28,y1=pos[e.from].y+uy*28,x2=pos[e.to].x-ux*31,y2=pos[e.to].y-uy*31;
    const line=document.createElementNS(NS,"line");line.setAttribute("x1",x1);line.setAttribute("y1",y1);line.setAttribute("x2",x2);line.setAttribute("y2",y2);
    const active=activePairs.has(e.from+"→"+e.to);line.setAttribute("class","edge-line"+(active?" active":""));
    svg.appendChild(line);
    const lx=(x1+x2)/2,ly=(y1+y2)/2-7;
    const text=document.createElementNS(NS,"text");text.setAttribute("x",lx);text.setAttribute("y",ly);text.setAttribute("text-anchor","middle");text.setAttribute("class","edge-label"+(active?" active":""));text.textContent=flowLabel(e);
    svg.appendChild(text);
  });
}
function flowLabel(e){
  if(!result)return `${e.capacity}`;
  const f=result.finalEdges.find(x=>x.from===e.from&&x.to===e.to&&x.capacity===Number(e.capacity));
  return f ? `${fmt(f.flow)}/${fmt(f.capacity)}` : `${e.capacity}`;
}
function animatePackets(path){
  if(!path||path.length<2)return;
  const graph=$("graph"), pos=layoutNodes(nodeSet());
  path.slice(0,-1).forEach((u,i)=>{
    const v=path[i+1],a=pos[u],b=pos[v]; if(!a||!b)return;
    const p=document.createElement("div");p.className="packet";$("packetLayer").appendChild(p);
    const start=performance.now(),duration=620;
    function tick(now){const t=Math.min((now-start)/duration,1),x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;p.style.left=x+"px";p.style.top=y+"px";if(t<1)requestAnimationFrame(tick);else p.remove()}
    requestAnimationFrame(tick);
  });
}
function renderTimeline(){
  const t=$("timeline");
  if(!result||!result.steps.length){t.innerHTML='<div class="muted" style="font-size:10px">Run the algorithm to generate augmentation steps.</div>';return}
  t.innerHTML=result.steps.map((s,i)=>`<div class="step-card ${i===currentStep?"selected":""}" onclick="showStep(${i})"><span class="num">ITERATION ${String(s.iteration).padStart(2,"0")}</span><strong>${s.path.join(" → ")}</strong><small>+${fmt(s.bottleneck)} Mbps</small></div>`).join("");
}
function showStep(i,animate=true){
  if(!result||!result.steps[i])return;currentStep=i;const s=result.steps[i];
  $("stepCounter").textContent=`STEP ${i+1} / ${result.steps.length}`;
  $("engineState").textContent=`ITERATION ${s.iteration}`;
  $("pathDisplay").innerHTML=s.path.map((n,j)=>`${j?'<b>→</b>':''}<span>${n}</span>`).join("");
  $("bottleneck").innerHTML=`${fmt(s.bottleneck)} <small>Mbps</small>`;
  $("bottleneckBar").style.width=Math.min(100,s.bottleneck/Math.max(...result.steps.map(x=>x.bottleneck))*100)+"%";
  $("bfsLog").innerHTML=s.path.map((n,i)=>`<div class="visit">✓ BFS visited <b>${n}</b>${i===s.path.length-1?" — destination found":""}</div>`).join("");
  renderTimeline();renderGraph(s.path);if(animate)animatePackets(s.path);
}
$("prevBtn").onclick=()=>{if(currentStep>0)showStep(currentStep-1)};
$("nextBtn").onclick=()=>{if(result&&currentStep<result.steps.length-1)showStep(currentStep+1)};
$("playBtn").onclick=()=>{
  if(!result)return;
  if(timer){clearInterval(timer);timer=null;$("playBtn").textContent="▶ PLAY STEPS";return}
  let i=currentStep+1;if(i>=result.steps.length)i=0;showStep(i);
  timer=setInterval(()=>{i++;if(i>=result.steps.length){clearInterval(timer);timer=null;$("playBtn").textContent="▶ PLAY STEPS";return}showStep(i)},Number($("speed").value));
  $("playBtn").textContent="⏸ PAUSE";
};
async function run(){
  const btn=$("runBtn");btn.disabled=true;btn.innerHTML="◌ COMPUTING…";
  const payload={source:$("source").value.trim().toUpperCase(),sink:$("sink").value.trim().toUpperCase(),edges:edges.map(e=>({from:e.from,to:e.to,capacity:Number(e.capacity)}))};
  try{
    const r=await fetch("/api/max-flow",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const data=await r.json();if(!data.ok)throw new Error(data.error);
    result=data;currentStep=-1;$("maxFlow").textContent=`${fmt(data.maxFlow)} Mbps`;$("iterations").textContent=data.iterations;
    $("engineState").textContent="COMPLETE";renderTimeline();renderChart();showStep(0);setTimeout(()=>{$("engineState").textContent="READY"},1000);
  }catch(e){alert(e.message)}
  finally{btn.disabled=false;btn.innerHTML="<span>▶</span> RUN MAX-FLOW";}
}
$("runBtn").onclick=run;

function renderChart(){
  const c=$("chart"); if(!result||!result.finalEdges.length){c.innerHTML='<div class="muted" style="margin:auto;font-size:9px">Flow utilization appears after execution.</div>';return}
  c.innerHTML=result.finalEdges.map(e=>{const p=e.capacity?e.flow/e.capacity*100:0;return `<div class="bar-col"><b>${fmt(p)}%</b><div class="bar-fill" style="height:${Math.max(3,p)}%"></div><span>${e.from}→${e.to}</span></div>`}).join("");
}
loadGraph(window.DEFAULT_GRAPH);
window.addEventListener("resize",()=>renderGraph(result&&currentStep>=0?result.steps[currentStep].path:[]));
