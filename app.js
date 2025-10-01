/* app with scroll fix */
const CLIENT_ID = "149167584419-39h4d0qhjfjqs09687oih6p1fkpqds0k.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/drive.file openid email profile";
let tokenClient=null, accessToken=null;
const db={ get(k,d){try{return JSON.parse(localStorage.getItem(k)??JSON.stringify(d));}catch(e){return d;}}, set(k,v){localStorage.setItem(k,JSON.stringify(v));}};
const $=s=>document.querySelector(s);

function fmtR(v){return (v??0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});}
function fmtKg(v){return (v??0).toLocaleString('pt-BR',{maximumFractionDigits:1});}
(function(){const el=$('#dataHoje'); if(el) el.textContent=new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});})();

function show(id){const secs=["talhoes","registros","estoque","resumo","historico","config"];secs.forEach(s=>document.getElementById(`sec-${s}`).style.display=s===id?'block':'none');document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));document.querySelectorAll('.tab')[secs.indexOf(id)].classList.add('active');render();}
function render(){renderTalhoes();renderEstoque();renderRegistros();renderResumoTabela();renderHistorico();renderGraficos();}

// Talhões
function adicionarTalhao(){const nome=$('#nomeTalhao').value.trim();if(!nome)return;const t=db.get('talhoes',[]);t.push({id:crypto.randomUUID(),nome});db.set('talhoes',t);$('#nomeTalhao').value='';renderTalhoes();}
function removerTalhao(id){let t=db.get('talhoes',[]);t=t.filter(x=>x.id!==id);db.set('talhoes',t);render();}
function renderTalhoes(){const t=db.get('talhoes',[]);const wrap=$('#listaTalhoes');wrap.innerHTML=t.map(x=>`<div class="kpi"><div>🌿 <b>${x.nome}</b></div><button class="btn-outline" onclick="removerTalhao('${x.id}')">Excluir</button></div>`).join('');const sel=$('#selTalhao');sel.innerHTML=`<option value="">Selecione...</option>`+t.map(x=>`<option>${x.nome}</option>`).join('');}

// Estoque
function addEstoque(){const nome=$('#nomeInsumo').value.trim(),qtd=parseFloat($('#qtdInsumo').value||0),preco=parseFloat($('#precoSaco').value||0);if(!nome||!qtd||!preco)return;const e=db.get('estoque',[]);const i=e.findIndex(x=>x.nome.toLowerCase()===nome.toLowerCase());if(i>=0){e[i].qtd+=qtd;e[i].preco=preco;}else e.push({id:crypto.randomUUID(),nome,qtd,preco});db.set('estoque',e);$('#nomeInsumo').value=$('#qtdInsumo').value=$('#precoSaco').value='';renderEstoque();}
function removerEstoque(id){let e=db.get('estoque',[]);e=e.filter(x=>x.id!==id);db.set('estoque',e);render();}
function renderEstoque(){const e=db.get('estoque',[]);const tb=$('#tbodyEstoque');tb.innerHTML=e.map(x=>`<tr><td>${x.nome}</td><td>${fmtKg(x.qtd)}</td><td>R$ ${fmtR(x.preco)}</td><td style="text-align:right"><button class="btn-outline" onclick="removerEstoque('${x.id}')">Excluir</button></td></tr>`).join('');const sel=$('#selInsumo');sel.innerHTML=`<option value="">Selecione...</option>`+e.map(x=>`<option value="${x.id}">${x.nome} — ${fmtKg(x.qtd)}kg</option>`).join('');}

// Registros
function salvarAplicacao(){const talhao=$('#selTalhao').value,idInsumo=$('#selInsumo').value,kg=parseFloat($('#qtdAplicada').value||0),desc=$('#descAplicacao').value.trim();if(!talhao||!idInsumo||!kg)return alert("Preencha talhão, insumo e quantidade.");const e=db.get('estoque',[]);const ins=e.find(x=>x.id===idInsumo);if(!ins)return;if(ins.qtd<kg)return alert("Estoque insuficiente.");ins.qtd-=kg;db.set('estoque',e);const custo=(kg/50)*(ins.preco||0);const reg=db.get('aplicacoes',[]);reg.unshift({id:crypto.randomUUID(),data:Date.now(),talhao,insumo:ins.nome,kg,custo,desc});db.set('aplicacoes',reg);$('#qtdAplicada').value='';$('#descAplicacao').value='';render();}
function removerAplicacao(id){let r=db.get('aplicacoes',[]);const item=r.find(x=>x.id===id);if(item){const e=db.get('estoque',[]);const ins=e.find(x=>x.nome===item.insumo);if(ins){ins.qtd+=item.kg;db.set('estoque',e);}}r=r.filter(x=>x.id!==id);db.set('aplicacoes',r);render();}
function renderRegistros(){const r=db.get('aplicacoes',[]),wrap=$('#listaAplicacoes');wrap.innerHTML=r.slice(0,20).map(x=>`<div class="kpi"><div><div><b>${x.talhao}</b> – ${x.insumo} • ${fmtKg(x.kg)} kg</div><small class="muted">${new Date(x.data).toLocaleDateString('pt-BR')} — R$ ${fmtR(x.custo)} ${x.desc?('• '+x.desc):''}</small></div><button class="btn-outline" onclick="removerAplicacao('${x.id}')">Excluir</button></div>`).join('');}

// Resumo
function preencherMesAno(){const mm=$('#mm'),yy=$('#yy');if(!mm||!yy)return;const now=new Date(),meses=["01","02","03","04","05","06","07","08","09","10","11","12"];mm.innerHTML=meses.map((m,i)=>`<option value="${i+1}" ${i===now.getMonth()?'selected':''}>${m}</option>`).join('');let ys="";for(let y=now.getFullYear()-6;y<=now.getFullYear()+1;y++)ys+=`<option ${y===now.getFullYear()?'selected':''}>${y}</option>`;yy.innerHTML=ys;}
function resumoPorInsumo(m,y){const r=db.get('aplicacoes',[]);const list=r.filter(x=>{const d=new Date(x.data);return (d.getMonth()+1)===m&&d.getFullYear()===y;});const map=new Map();list.forEach(x=>{const cur=map.get(x.insumo)||{kg:0,rs:0};cur.kg+=x.kg;cur.rs+=x.custo;map.set(x.insumo,cur);});return Array.from(map.entries()).map(([insumo,v])=>({insumo,kg:v.kg,rs:v.rs}));}
function renderResumoTabela(){preencherMesAno();const mm=$('#mm');if(!mm)return;const yy=$('#yy');const m=parseInt(mm.value),y=parseInt(yy.value);const arr=resumoPorInsumo(m,y);const tb=$('#tbodyResumo');tb.innerHTML=arr.map(x=>`<tr><td>${x.insumo}</td><td>${fmtKg(x.kg)}</td><td>R$ ${fmtR(x.rs)}</td><td>${String(m).padStart(2,'0')}/${y}</td></tr>`).join('');$('#totKg').textContent=fmtKg(arr.reduce((a,b)=>a+b.kg,0));$('#totR$').textContent=fmtR(arr.reduce((a,b)=>a+b.rs,0));$('#totMes').textContent=`${String(m).padStart(2,'0')}/${y}`;renderGraficos();}
let chartKg=null,chartRs=null;
function renderGraficos(){const mm=$('#mm');if(!mm)return;const yy=$('#yy');const m=parseInt(mm.value),y=parseInt(yy.value);const arr=resumoPorInsumo(m,y);const labels=arr.map(x=>x.insumo),dataKg=arr.map(x=>x.kg),dataRs=arr.map(x=>x.rs);const ctx1=$('#chartKg'),ctx2=$('#chartR$');if(!ctx1||!ctx2)return;const cfg=(label,data)=>({type:'bar',data:{labels,datasets:[{label,data,borderWidth:1}]},options:{responsive:true,maintainAspectRatio:false,scales:{y:{beginAtZero:true}},plugins:{legend:{display:false}}}});if(chartKg)chartKg.destroy();if(chartRs)chartRs.destroy();chartKg=new Chart(ctx1,cfg("Kg aplicados",dataKg));chartRs=new Chart(ctx2,cfg("Gasto (R$)",dataRs));}

// Histórico
function renderHistorico(){const r=db.get('aplicacoes',[]);const tb=$('#tbodyHistorico');if(!tb)return;tb.innerHTML=r.map(x=>`<tr><td>${new Date(x.data).toLocaleDateString('pt-BR')}</td><td>${x.talhao}</td><td>${x.insumo}</td><td>${fmtKg(x.kg)}</td><td>R$ ${fmtR(x.custo)}</td><td>${x.desc??''}</td></tr>`).join('');}

// Export
function exportarCSV(todos=false){const mm=parseInt($('#mm').value),yy=parseInt($('#yy').value);const r=db.get('aplicacoes',[]);const list=todos?r:r.filter(x=>{const d=new Date(x.data);return (d.getMonth()+1)===mm&&d.getFullYear()===yy;});const rows=[["Data","Talhão","Insumo","Kg","Custo(R$)","Descrição"]].concat(list.map(x=>[new Date(x.data).toLocaleDateString('pt-BR'),x.talhao,x.insumo,x.kg,x.custo,x.desc??""]));const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(";")).join("\\n");const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=todos?"historico.csv":`resumo_${String(mm).padStart(2,'0')}_${yy}.csv`;a.click();}
async function exportarPDF(todos=false){const {jsPDF}=window.jspdf;const doc=new jsPDF({orientation:"landscape"});const mm=parseInt($('#mm').value),yy=parseInt($('#yy').value);doc.setFontSize(16);doc.text("Grão Digital - Relatório",14,16);doc.setFontSize(11);doc.text(todos?"Histórico completo":"Resumo mensal",14,24);const r=db.get('aplicacoes',[]);const list=todos?r:r.filter(x=>{const d=new Date(x.data);return (d.getMonth()+1)===mm&&d.getFullYear()===yy;});let y=36;doc.setFont("helvetica","bold");doc.text("Data",14,y);doc.text("Talhão",48,y);doc.text("Insumo",100,y);doc.text("Kg",150,y);doc.text("Custo(R$)",170,y);doc.text("Descrição",210,y);y+=6;doc.setFont("helvetica","normal");list.forEach(x=>{if(y>195){doc.addPage();y=20;}doc.text(new Date(x.data).toLocaleDateString('pt-BR'),14,y);doc.text(String(x.talhao),48,y);doc.text(String(x.insumo),100,y);doc.text(fmtKg(x.kg),150,y);doc.text(fmtR(x.custo),170,y);doc.text(String(x.desc??""),210,y);y+=6;});doc.save(todos?"historico.pdf":`resumo_${String(mm).padStart(2,'0')}_${yy}.pdf`);}

// Backup JSON
function exportarBackup(){const data={talhoes:db.get('talhoes',[]),estoque:db.get('estoque',[]),aplicacoes:db.get('aplicacoes',[])};const blob=new Blob([JSON.stringify(data)],{type:"application/json"});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download="grao-digital-backup.json";a.click();}
document.getElementById('inputRestore')?.addEventListener('change',(ev)=>{const f=ev.target.files[0];if(!f)return;const fr=new FileReader();fr.onload=()=>{try{const o=JSON.parse(fr.result);if(o.talhoes)db.set('talhoes',o.talhoes);if(o.estoque)db.set('estoque',o.estoque);if(o.aplicacoes)db.set('aplicacoes',o.aplicacoes);render();alert("Backup importado!");}catch(e){alert("Arquivo inválido.");}};fr.readAsText(f);});

// Google Drive
function ensureGapiLoaded(){return new Promise((resolve)=>{gapi.load('client',async()=>{await gapi.client.init({});await gapi.client.load('drive','v3');resolve();});});}
async function conectarGoogle(){await ensureGapiLoaded();if(!tokenClient){tokenClient=google.accounts.oauth2.initTokenClient({client_id:CLIENT_ID,scope:SCOPES,callback:(tok)=>{accessToken=tok.access_token;alert("Conectado ao Google!");}});}tokenClient.requestAccessToken({prompt:'consent'});}
async function salvarNoDrive(){await ensureGapiLoaded();if(!accessToken)return alert("Conecte ao Google primeiro.");const data={talhoes:db.get('talhoes',[]),estoque:db.get('estoque',[]),aplicacoes:db.get('aplicacoes',[]),salvoEm:new Date().toISOString()};const file=new File([new Blob([JSON.stringify(data)],{type:"application/json"})],"grao-digital-backup.json",{type:"application/json"});const metadata={name:file.name,mimeType:file.type};const boundary="-------314159265358979323846";const delimiter="\\r\\n--"+boundary+"\\r\\n";const close="\\r\\n--"+boundary+"--";const reader=await file.text();const body=delimiter+'Content-Type: application/json\\r\\n\\r\\n'+JSON.stringify(metadata)+delimiter+'Content-Type: '+file.type+'\\r\\n\\r\\n'+reader+close;await gapi.client.request({path:'/upload/drive/v3/files',method:'POST',params:{uploadType:'multipart'},headers:{'Content-Type':'multipart/related; boundary=\"'+boundary+'\"'},body});alert("Backup salvo no Drive!");}
async function carregarDoDrive(){await ensureGapiLoaded();if(!accessToken)return alert("Conecte ao Google primeiro.");const res=await gapi.client.drive.files.list({q:"name = 'grao-digital-backup.json' and trashed = false",pageSize:1,fields:"files(id,name)"});if(!res.result.files||!res.result.files.length)return alert("Arquivo não encontrado no Drive.");const fileId=res.result.files[0].id;const content=await gapi.client.drive.files.get({fileId,alt:'media'});try{const o=JSON.parse(content.body);if(o.talhoes)db.set('talhoes',o.talhoes);if(o.estoque)db.set('estoque',o.estoque);if(o.aplicacoes)db.set('aplicacoes',o.aplicacoes);render();alert("Backup carregado!");}catch(e){alert("Conteúdo inválido.");}}

// limpeza
function apagarTudo(){if(confirm("Tem certeza? Isso removerá todos os dados locais.")){localStorage.removeItem('talhoes');localStorage.removeItem('estoque');localStorage.removeItem('aplicacoes');render();}}

// eventos
document.getElementById('mm')?.addEventListener('change',renderResumoTabela);
document.getElementById('yy')?.addEventListener('change',renderResumoTabela);

// PWA
if('serviceWorker' in navigator){navigator.serviceWorker.register('service-worker.js');}
render();
