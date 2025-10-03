/* Grão Digital — final (Resumo sem gráficos; Backup/Drive na Config; sem aba Histórico) */
const $=(s,e=document)=>e.querySelector(s);const $$=(s,e=document)=>[...e.querySelectorAll(s)];
const LS={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set:(k,v)=>localStorage.setItem(k,JSON.stringify(v)),clear:()=>localStorage.clear()};
const STATE={talhoes:LS.get('talhoes',[]),estoque:LS.get('estoque',[]),apps:LS.get('apps',[])};
const CLIENT_ID="149167584419-39h4d0qhjfjqs09687oih6p1fkpqds0k.apps.googleusercontent.com";
let oauthToken=null;

const TABS=['talhoes','registros','estoque','resumo','config'];
function go(tab){if(!TABS.includes(tab))tab='talhoes';history.replaceState({},'',`#${tab}`);render(tab);$$('.tabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab))}
window.addEventListener('hashchange',()=>go(location.hash.replace('#','')));
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}
function saveAll(){LS.set('talhoes',STATE.talhoes);LS.set('estoque',STATE.estoque);LS.set('apps',STATE.apps)}

function headerDate(){const hoje=new Date();$('#hoje').textContent=hoje.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}

/* ---------- Telas ---------- */
function viewTalhoes(){const c=document.createElement('section');c.className='card';
c.innerHTML=`<h2><i class="ri-seedling-line"></i> Talhões</h2>
<div class="row cols-2"><input id="nomeTalhao" placeholder="Nome do Talhão"><button id="add">Adicionar Talhão</button></div>
<div id="lista" class="row"></div>`;
$('#add',c).onclick=()=>{const n=$('#nomeTalhao',c).value.trim();if(!n)return toast('Informe um nome.');STATE.talhoes.push({id:crypto.randomUUID(),nome:n});saveAll();render('talhoes');toast('Talhão adicionado.')} ;
const box=$('#lista',c); if(STATE.talhoes.length===0){box.innerHTML='<small>Nenhum talhão cadastrado.</small>'}
else STATE.talhoes.forEach(t=>{const row=document.createElement('div');row.className='row cols-2';row.innerHTML=`<div>${t.nome}</div><div class="btn-line"><button class="secondary" data-a="ren" data-id="${t.id}">Renomear</button><button class="danger" data-a="del" data-id="${t.id}">Excluir</button></div>`;box.append(row)});
box.onclick=e=>{const b=e.target.closest('button');if(!b)return;const id=b.dataset.id; if(b.dataset.a==='del'){STATE.talhoes=STATE.talhoes.filter(x=>x.id!==id);saveAll();render('talhoes');toast('Talhão removido.')}else{const t=STATE.talhoes.find(x=>x.id===id);const novo=prompt('Novo nome:',t?.nome||'');if(novo){t.nome=novo.trim();saveAll();render('talhoes');toast('Talhão renomeado.')}}};
return c}

function viewEstoque(){const c=document.createElement('section');c.className='card';
c.innerHTML=`<h2><i class="ri-archive-2-line"></i> Estoque</h2>
<div class="row cols-3"><input id="nome" placeholder="Ex.: NPK"><input id="qtd" type="number" min="0" step="0.01" placeholder="Ex.: 1000"><input id="preco" type="number" min="0" step="0.01" placeholder="Preço por saco (50kg)"></div>
<div class="row" style="margin-top:10px"><button id="add">Adicionar ao Estoque</button></div>
<table class="table" style="margin-top:12px"><thead><tr><th>Insumo</th><th>Qtd (kg)</th><th>Preço 50kg (R$)</th><th></th></tr></thead><tbody id="tb"></tbody></table>`;
$('#add',c).onclick=()=>{const n=$('#nome',c).value.trim();const q=parseFloat($('#qtd',c).value);const p=parseFloat($('#preco',c).value)||0;if(!n||!q)return toast('Informe nome e quantidade.');
const ja=STATE.estoque.find(e=>e.nome.toLowerCase()===n.toLowerCase()); if(ja){ja.qtd+=q;ja.precoSaco=p||ja.precoSaco}else STATE.estoque.push({nome:n,qtd:q,precoSaco:p}); saveAll();render('estoque');toast('Estoque atualizado.')} ;
const tb=$('#tb',c); STATE.estoque.forEach((e,i)=>{const tr=document.createElement('tr');tr.innerHTML=`<td>${e.nome}</td><td>${e.qtd.toFixed(0)}</td><td>R$ ${(e.precoSaco||0).toFixed(2)}</td><td><button class="danger" data-i="${i}">Excluir</button></td>`;tb.append(tr)});
tb.onclick=ev=>{const b=ev.target.closest('button');if(!b)return;STATE.estoque.splice(+b.dataset.i,1);saveAll();render('estoque')};
return c}

function viewRegistros(){const c=document.createElement('section');c.className='card';
const tal=STATE.talhoes.map(t=>`<option>${t.nome}</option>`).join(''); const est=STATE.estoque.map(e=>`<option value="${e.nome}">${e.nome} — ${e.qtd.toFixed(1)}kg</option>`).join('');
c.innerHTML=`<h2><i class="ri-ball-pen-line"></i> Registros de Adubação</h2>
<div class="row cols-3"><select id="selTalhao"><option value="" hidden>Talhão</option>${tal}</select><select id="selInsumo"><option value="" hidden>Insumo (do estoque)</option>${est}</select><input id="kg" type="number" min="0" step="0.01" placeholder="Qtde aplicada (kg)"></div>
<div class="row cols-2" style="margin-top:10px"><input id="desc" placeholder="Descrição (opcional)"><button id="salvar">Salvar aplicação</button></div>
<div style="margin-top:12px"><small class="muted">O custo é calculado pelo preço por saco (50kg) do estoque.</small></div>
<h3 style="margin-top:16px">Últimas aplicações</h3><div id="ult"></div>`;
$('#salvar',c).onclick=()=>{const talhao=$('#selTalhao',c).value; const nome=$('#selInsumo',c).value; const kg=parseFloat($('#kg',c).value); const desc=$('#desc',c).value.trim();
if(!talhao||!nome||!kg)return toast('Preencha talhão, insumo e quantidade.'); const item=STATE.estoque.find(e=>e.nome===nome); if(!item)return toast('Insumo não encontrado no estoque.'); if(item.qtd<kg)return toast('Quantidade acima do estoque.');
item.qtd-=kg; const now=new Date(); STATE.apps.unshift({id:crypto.randomUUID(),data:now.toISOString(),talhao,insumo:nome,kg,desc,mes:now.getMonth()+1,ano:now.getFullYear(),custoItem:item.precoSaco||0});
saveAll(); render('registros'); toast('Aplicação salva.')} ;
const ul=document.createElement('ul'); ul.style.listStyle='none'; ul.style.padding='0';
if(STATE.apps.length===0) ul.innerHTML='<p>Sem registros ainda.</p>'; else STATE.apps.slice(0,12).forEach(r=>{const li=document.createElement('li');li.style.margin='10px 0';
const dia=new Date(r.data).toLocaleDateString('pt-BR'); const gasto=(r.kg/50)*(r.custoItem||0);
li.innerHTML=`<div class="row cols-3"><div><strong>${r.talhao}</strong> — ${dia}</div><div>${r.insumo}: <strong>${r.kg.toFixed(1)} kg</strong></div><div>R$ ${gasto.toFixed(2)}</div></div>`; ul.append(li)});
$('#ult',c).append(ul); return c}

function viewResumo(){const c=document.createElement('section');c.className='card';
const hoje=new Date(); const mm=hoje.getMonth()+1, yy=hoje.getFullYear();
c.innerHTML=`<h2><i class="ri-bar-chart-2-line"></i> Resumo Mensal</h2>
<div class="row cols-3"><select id="mes"></select><select id="ano"></select><div class="btn-line"><button id="csv" class="secondary">Exportar CSV</button><button id="pdf">Exportar PDF</button></div></div>
<table class="table" id="tbl" style="margin-top:12px"><thead><tr><th>Insumo</th><th>Kg aplicados</th><th>Gasto (R$)</th><th>Mês/Ano</th></tr></thead><tbody></tbody><tfoot><tr><td>Total</td><td id="tkg">0</td><td id="trs">0</td><td></td></tr></tfoot></table>`;
const selM=$('#mes',c), selA=$('#ano',c); for(let m=1;m<=12;m++){const o=document.createElement('option');o.value=m;o.textContent=m.toString().padStart(2,'0'); if(m===mm)o.selected=true; selM.append(o)}
for(let a=yy-6;a<=yy+1;a++){const o=document.createElement('option');o.value=a;o.textContent=a; if(a===yy)o.selected=true; selA.append(o)}
function calc(){const m=+selM.value, a=+selA.value; const map=new Map(); let TK=0, TR=0;
STATE.apps.forEach(r=>{ if(r.mes===m && r.ano===a){ const g=map.get(r.insumo)||{kg:0,rs:0}; g.kg+=r.kg; g.rs+=(r.kg/50)*(r.custoItem||0); map.set(r.insumo,g); TK+=r.kg; TR+=(r.kg/50)*(r.custoItem||0);} });
const tb=$('#tbl tbody',c); tb.innerHTML=''; [...map.entries()].forEach(([ins,g])=>{const tr=document.createElement('tr'); tr.innerHTML=`<td>${ins}</td><td>${g.kg.toFixed(2)}</td><td>R$ ${g.rs.toFixed(2)}</td><td>${String(m).padStart(2,'0')}/${a}</td>`; tb.append(tr)});
$('#tkg',c).textContent=TK.toFixed(2); $('#trs',c).textContent='R$ '+TR.toFixed(2); }
selM.onchange=selA.onchange=calc; calc();
$('#csv',c).onclick=()=>{const m=+selM.value, a=+selA.value; const rows=[['Insumo','Kg aplicados','Gasto (R$)','Mes/Ano']]; $('#tbl tbody tr',c)?.parentElement?.querySelectorAll('tr')?.forEach?.(()=>{});
const map=new Map(); STATE.apps.forEach(r=>{ if(r.mes===m&&r.ano===a){ const g=map.get(r.insumo)||{kg:0,rs:0}; g.kg+=r.kg; g.rs+=(r.kg/50)*(r.custoItem||0); map.set(r.insumo,g);} });
[...map.entries()].forEach(([ins,g])=>rows.push([ins,g.kg.toFixed(2),g.rs.toFixed(2),`${m}/${a}`])); const csv=rows.map(r=>r.join(';')).join('\\n');
const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}); const url=URL.createObjectURL(blob); Object.assign(document.createElement('a'),{href:url,download:`resumo-${a}-${String(m).padStart(2,'0')}.csv`}).click(); URL.revokeObjectURL(url)};
$('#pdf',c).onclick=()=>{const {jsPDF}=window.jspdf; const doc=new jsPDF(); const m=+selM.value, a=+selA.value; doc.setFontSize(14); doc.text(`Resumo Mensal — ${String(m).padStart(2,'0')}/${a}`,14,16); let y=26; doc.setFontSize(11);
doc.text('Insumo',14,y); doc.text('Kg',90,y); doc.text('Gasto (R$)',125,y); y+=6; const map=new Map(); STATE.apps.forEach(r=>{ if(r.mes===m&&r.ano===a){ const g=map.get(r.insumo)||{kg:0,rs:0}; g.kg+=r.kg; g.rs+=(r.kg/50)*(r.custoItem||0); map.set(r.insumo,g);} });
[...map.entries()].forEach(([ins,g])=>{ doc.text(ins,14,y); doc.text(g.kg.toFixed(2),90,y); doc.text(g.rs.toFixed(2),125,y); y+=6; }); doc.save(`resumo-${a}-${String(m).padStart(2,'0')}.pdf`) };
return c}

function viewConfig(){const c=document.createElement('section'); c.className='card';
c.innerHTML=`<h2><i class="ri-settings-3-line"></i> Configurações</h2>
<div class="row cols-2"><button id="wipe" class="danger">Apagar TODOS os dados</button><div></div></div>
<h3 style="margin-top:18px">📁 Backup (dispositivo)</h3>
<div class="row cols-2"><button id="exp" class="secondary">Exportar backup (JSON)</button><div class="btn-line"><input id="file" type="file" accept="application/json"><button id="imp">Importar backup (JSON)</button></div></div>
<h3 style="margin-top:18px">☁️ Google Drive</h3>
<div class="row cols-3"><button id="g-login" class="secondary">Conectar ao Google</button><button id="g-save" class="secondary">Salvar no Drive</button><button id="g-load" class="secondary">Carregar do Drive</button></div>
<pre id="log" style="background:#0b1511;border:1px solid #274232;padding:10px;border-radius:10px;max-height:160px;overflow:auto"></pre>`;
$('#wipe',c).onclick=()=>{if(confirm('Tem certeza?')){LS.clear();location.reload()}};
$('#exp',c).onclick=()=>{const data=JSON.stringify(STATE); const blob=new Blob([data],{type:'application/json'}); const url=URL.createObjectURL(blob); Object.assign(document.createElement('a'),{href:url,download:`grao-digital-backup-${Date.now()}.json`}).click(); URL.revokeObjectURL(url)};
$('#imp',c).onclick=()=>{const f=$('#file',c).files?.[0]; if(!f) return toast('Escolha um arquivo'); const rd=new FileReader(); rd.onload=()=>{ try{ const d=JSON.parse(rd.result); if(d.talhoes&&d.estoque&&d.apps){ STATE.talhoes=d.talhoes; STATE.estoque=d.estoque; STATE.apps=d.apps; saveAll(); toast('Backup importado.'); render('talhoes'); } else toast('Arquivo inválido.'); }catch{ toast('Erro ao importar.'); } }; rd.readAsText(f) };
// Google OAuth
$('#g-login',c).onclick=()=>{ const s=document.createElement('script'); s.src='https://accounts.google.com/gsi/client'; s.onload=()=>{ const tc=google.accounts.oauth2.initTokenClient({client_id:CLIENT_ID, scope:'https://www.googleapis.com/auth/drive.file', callback:(tok)=>{ oauthToken=tok.access_token; log('Conectado ao Google. Token OK.'); }}); tc.requestAccessToken(); }; document.body.appendChild(s) };
$('#g-save',c).onclick=async()=>{ if(!oauthToken) return toast('Conecte ao Google primeiro.'); const meta={name:'grao-digital-backup.json', mimeType:'application/json'}; const form=new FormData(); form.append('metadata', new Blob([JSON.stringify(meta)],{type:'application/json'})); form.append('file', new Blob([JSON.stringify(STATE)],{type:'application/json'})); const r=await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',{method:'POST', headers:{Authorization:`Bearer ${oauthToken}`}, body: form}); log(r.ok?'Backup salvo no Drive.':'Falha ao salvar no Drive.') };
$('#g-load',c).onclick=async()=>{ if(!oauthToken) return toast('Conecte ao Google primeiro.'); const q=encodeURIComponent(\"name='grao-digital-backup.json' and trashed=false\"); const lr=await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&orderBy=modifiedTime desc`,{headers:{Authorization:`Bearer ${oauthToken}`}}); const j=await lr.json(); if(!j.files?.length) return log('Nenhum backup encontrado.'); const id=j.files[0].id; const fr=await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`,{headers:{Authorization:`Bearer ${oauthToken}`}}); const data=await fr.json(); STATE.talhoes=data.talhoes||[]; STATE.estoque=data.estoque||[]; STATE.apps=data.apps||[]; saveAll(); render('talhoes'); log('Backup carregado do Drive.') };
function log(m){ const p=$('#log',c); p.textContent += (p.textContent?'\\n':'') + m }
return c}

function render(tab){const m=$('#conteudo'); m.innerHTML=''; if(tab==='talhoes') m.append(viewTalhoes()); if(tab==='registros') m.append(viewRegistros()); if(tab==='estoque') m.append(viewEstoque()); if(tab==='resumo') m.append(viewResumo()); if(tab==='config') m.append(viewConfig())}

document.addEventListener('DOMContentLoaded',()=>{headerDate(); $('.tabs').addEventListener('click',e=>{const b=e.target.closest('button'); if(!b) return; go(b.dataset.tab)}); go(location.hash.replace('#','')||'talhoes'); if('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js')});
