// Storage
let talhoes = JSON.parse(localStorage.getItem('talhoes')||'[]');
let estoque = JSON.parse(localStorage.getItem('estoque')||'[]'); // {nome,qtd,preco(saco50)}
let aplics  = JSON.parse(localStorage.getItem('aplics') ||'[]'); // {talhao,insumo,qtd,desc,dataISO}

const $ = s=>document.querySelector(s);
const $$= s=>document.querySelectorAll(s);
const save = ()=>{ localStorage.setItem('talhoes',JSON.stringify(talhoes)); localStorage.setItem('estoque',JSON.stringify(estoque)); localStorage.setItem('aplics',JSON.stringify(aplics)); };

// Navegação
$$('.bottom button').forEach(b=> b.addEventListener('click',()=> go(b.dataset.go)));
function go(id){ $$('main>section').forEach(s=>s.classList.add('hidden')); $('#'+id).classList.remove('hidden'); $$('.bottom button').forEach(b=>b.classList.toggle('active', b.dataset.go===id)); }

// Talhões
$('#btnAddTalhao').onclick = ()=>{ const n = $('#inpTalhao').value.trim(); if(!n) return; if(talhoes.includes(n)) return alert('Já existe esse talhão.'); talhoes.push(n); save(); $('#inpTalhao').value=''; renderTalhoes(); renderSelects(); };
function renderTalhoes(){ const ul = $('#listaTalhoes'); ul.innerHTML = talhoes.map(t=>`<li><div><strong>${t}</strong></div><div class="row"><button class="btn outline" data-edit="${t}">Renomear</button><button class="btn danger" data-del="${t}">Excluir</button></div></li>`).join(''); ul.querySelectorAll('[data-del]').forEach(b=> b.onclick=()=>{ talhoes = talhoes.filter(x=>x!==b.dataset.del); save(); renderTalhoes(); renderSelects(); }); ul.querySelectorAll('[data-edit]').forEach(b=> b.onclick=()=>{ const novo = prompt('Novo nome', b.dataset.edit); if(novo){ talhoes = talhoes.map(x=> x===b.dataset.edit? novo.trim():x); save(); renderTalhoes(); renderSelects(); } }); }

// Estoque
$('#btnAddEstoque').onclick = ()=>{ const nome=$('#insNome').value.trim(); const qtd=Number($('#insQtd').value); const preco=Number($('#insPreco').value); if(!nome||!(qtd>0)||!(preco>=0)) return alert('Preencha os campos.'); const i = estoque.findIndex(e=>e.nome.toLowerCase()===nome.toLowerCase()); if(i>-1){ estoque[i].qtd+=qtd; estoque[i].preco=preco; } else { estoque.push({nome,qtd,preco}); } save(); $('#insNome').value=$('#insQtd').value=$('#insPreco').value=''; renderEstoque(); renderSelects(); };
function renderEstoque(){ const wrap=$('#listaEstoque'); if(!estoque.length){ wrap.innerHTML='<div class="muted" style="padding:12px">Sem itens…</div>'; return; } wrap.innerHTML = `<table><thead><tr><th>Insumo</th><th>Qtd (kg)</th><th>Preço / saco 50kg</th></tr></thead><tbody>${estoque.map(e=>`<tr><td>${e.nome}</td><td>${e.qtd.toFixed(1)}</td><td>R$ ${Number(e.preco).toFixed(2)}</td></tr>`).join('')}</tbody></table>`; }

// Registros
function renderSelects(){ const sT=$('#selTalhao'), sI=$('#selInsumo'); if(sT) sT.innerHTML = '<option value="" disabled selected>Selecione</option>'+ talhoes.map(t=>`<option>${t}</option>`).join(''); if(sI) sI.innerHTML = '<option value="" disabled selected>Selecione</option>'+ estoque.map(e=>`<option value="${e.nome}">${e.nome} — ${e.qtd.toFixed(1)}kg</option>`).join(''); }
$('#btnSalvarAplic').onclick = ()=>{ const talhao=$('#selTalhao').value; const ins=$('#selInsumo').value; const kg=Number($('#inpQtd').value); const desc=$('#inpDesc').value.trim(); if(!talhao||!ins||!(kg>0)) return alert('Preencha Talhão, Insumo e Quantidade.'); const ref = estoque.find(e=>e.nome===ins); if(!ref) return alert('Insumo não encontrado no estoque.'); if(ref.qtd < kg) return alert('Estoque insuficiente.'); const custoKg = (Number(ref.preco)||0)/50; ref.qtd -= kg; aplics.push({ talhao, insumo:ins, qtd:kg, desc, dataISO:new Date().toISOString(), custo: kg*custoKg }); save(); $('#inpQtd').value=''; $('#inpDesc').value=''; renderEstoque(); renderAplics(); renderResumo(); renderHistorico(); };
function renderAplics(){ const wrap=$('#listaAplics'); if(!aplics.length){ wrap.innerHTML='<div class="muted" style="padding:12px">Sem aplicações…</div>'; return; } const ult = [...aplics].reverse().slice(0,20); wrap.innerHTML = `<table><thead><tr><th>Data</th><th>Talhão</th><th>Insumo</th><th>Kg</th><th>Custo (R$)</th><th>Desc.</th></tr></thead><tbody>${ult.map(r=>`<tr><td>${new Date(r.dataISO).toLocaleDateString('pt-BR')}</td><td>${r.talhao}</td><td>${r.insumo}</td><td>${r.qtd.toFixed(1)}</td><td>R$ ${r.custo.toFixed(2)}</td><td>${r.desc||'-'}</td></tr>`).join('')}</tbody></table>`; }

// Resumo (mês/ano)
let chartKg, chartGasto, tipoKg='bar', tipoGasto='bar';
function monthYearFromSelect(){ const m=$('#selMes').value, a=$('#selAno').value; return {m:+m, a:+a}; }
function fillMonthYear(){ const M=$('#selMes'), A=$('#selAno'); const nomes=['01','02','03','04','05','06','07','08','09','10','11','12']; const now = new Date(); M.innerHTML = nomes.map((mm,i)=>`<option value="${i+1}" ${i===now.getMonth()?'selected':''}>${mm}</option>`).join(''); const base=now.getFullYear(); let anos=''; for(let y=base;y>=base-6;y--) anos+=`<option ${y===base?'selected':''}>${y}</option>`; A.innerHTML = anos; }
function dataResumo(m,a){ const out={}; aplics.forEach(r=>{ const d=new Date(r.dataISO); if((d.getMonth()+1)===m && d.getFullYear()===a){ if(!out[r.insumo]) out[r.insumo]={kg:0,gasto:0}; out[r.insumo].kg+=r.qtd; out[r.insumo].gasto+=r.custo; } }); return out; }
function renderResumo(){ const {m,a}=monthYearFromSelect(); const mapa = dataResumo(m,a); const labels=Object.keys(mapa); const kgs=labels.map(k=> mapa[k].kg); const gastos=labels.map(k=> mapa[k].gasto); // tabela
  $('#tabelaResumo').innerHTML = `<table><thead><tr><th>Insumo</th><th>Kg</th><th>Gasto (R$)</th><th>Mês/Ano</th></tr></thead><tbody>${labels.map(k=>`<tr><td>${k}</td><td>${mapa[k].kg.toFixed(1)}</td><td>R$ ${mapa[k].gasto.toFixed(2)}</td><td>${String(m).padStart(2,'0')}/${a}</td></tr>`).join('') || '<tr><td colspan="4" class="muted">Sem dados.</td></tr>'}</tbody></table>`;
  // charts
  if(chartKg) chartKg.destroy(); if(chartGasto) chartGasto.destroy();
  chartKg = new Chart($('#graficoKg'),{ type: tipoKg, data:{ labels, datasets:[{ label:'Kg aplicados', data:kgs }]}, options:{ responsive:true, maintainAspectRatio:false } });
  chartGasto = new Chart($('#graficoGasto'),{ type: tipoGasto, data:{ labels, datasets:[{ label:'Gasto (R$)', data:gastos }]}, options:{ responsive:true, maintainAspectRatio:false } });
}
$('#btnTipoKg').onclick = ()=>{ tipoKg = (tipoKg==='bar'?'pie':'bar'); renderResumo(); };
$('#btnTipoGasto').onclick = ()=>{ tipoGasto = (tipoGasto==='bar'?'pie':'bar'); renderResumo(); };
$('#btnFiltrarResumo').onclick = renderResumo;
$('#btnCsv').onclick = ()=>{ const {m,a}=monthYearFromSelect(); const mapa=dataResumo(m,a); const labels=Object.keys(mapa); let csv='Insumo;Kg;Gasto (R$);Mes/Ano\n'; labels.forEach(k=>{ csv+=`${k};${mapa[k].kg.toFixed(1)};${mapa[k].gasto.toFixed(2)};${String(m).padStart(2,'0')}/${a}\n`; }); const blob=new Blob([csv],{type:'text/csv'}); const aEl=document.createElement('a'); aEl.href=URL.createObjectURL(blob); aEl.download=`resumo-${a}-${String(m).padStart(2,'0')}.csv`; aEl.click(); };
$('#btnPdf').onclick = ()=>{ const { jsPDF } = window.jspdf; const doc = new jsPDF('p','pt','a4'); html2canvas(document.querySelector('#sec-resumo')).then(canvas=>{ const img=canvas.toDataURL('image/png'); const pageWidth = doc.internal.pageSize.getWidth(); const pageHeight= doc.internal.pageSize.getHeight(); const ratio = Math.min(pageWidth/canvas.width, pageHeight/canvas.height); const w = canvas.width*ratio, h = canvas.height*ratio; doc.addImage(img,'PNG', (pageWidth-w)/20, 20, w*0.95, h*0.95); doc.save(`resumo-${Date.now()}.pdf`); }); };

// Histórico (linhas) + export
let chartLinhaKg, chartLinhaGasto;
function historicoSeries(){ const mapa={}; aplics.forEach(r=>{ const d=new Date(r.dataISO); const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; if(!mapa[key]) mapa[key]={kg:0,gasto:0}; mapa[key].kg += r.qtd; mapa[key].gasto += r.custo; }); const labels=Object.keys(mapa).sort(); return { labels, kgs: labels.map(k=>mapa[k].kg), gastos: labels.map(k=>mapa[k].gasto) }; }
function renderHistorico(){ const s = historicoSeries(); // tabela
  $('#tabelaHistorico').innerHTML = `<table><thead><tr><th>Mês</th><th>Kg</th><th>Gasto (R$)</th></tr></thead><tbody>${s.labels.map((mm,i)=>`<tr><td>${mm}</td><td>${s.kgs[i].toFixed(1)}</td><td>R$ ${s.gastos[i].toFixed(2)}</td></tr>`).join('') || '<tr><td colspan="3" class="muted">Sem dados.</td></tr>'}</tbody></table>`;
  if(chartLinhaKg) chartLinhaKg.destroy(); if(chartLinhaGasto) chartLinhaGasto.destroy();
  chartLinhaKg    = new Chart($('#graficoLinhaKg'),   { type:'line', data:{ labels:s.labels, datasets:[{ label:'Kg/mês', data:s.kgs, tension:.25 }]}, options:{ responsive:true, maintainAspectRatio:false } });
  chartLinhaGasto = new Chart($('#graficoLinhaGasto'),{ type:'line', data:{ labels:s.labels, datasets:[{ label:'R$/mês', data:s.gastos, tension:.25 }]}, options:{ responsive:true, maintainAspectRatio:false } });
}
$('#btnCsvHistorico').onclick = ()=>{ const s = historicoSeries(); let csv='Mes;Kg;Gasto(R$)\n'; s.labels.forEach((l,i)=> csv+=`${l};${s.kgs[i].toFixed(1)};${s.gastos[i].toFixed(2)}\n`); const blob=new Blob([csv],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='historico.csv'; a.click(); };
$('#btnPdfHistorico').onclick = ()=>{ const { jsPDF } = window.jspdf; const cont = document.querySelector('#historicoContainer'); html2canvas(cont, {scale:2}).then(canvas=>{ const doc = new jsPDF('p','pt','a4'); const img = canvas.toDataURL('image/png'); const pageWidth = doc.internal.pageSize.getWidth(); const pageHeight= doc.internal.pageSize.getHeight(); const ratio = Math.min(pageWidth/canvas.width, pageHeight/canvas.height); const w = canvas.width*ratio, h = canvas.height*ratio; doc.addImage(img,'PNG', (pageWidth-w)/2, 20, w, h); doc.save('historico.pdf'); }); };

// Inicialização
function renderAll(){ renderTalhoes(); renderEstoque(); renderAplics(); fillMonthYear(); renderResumo(); renderHistorico(); }
renderAll();
go('sec-talhoes');

// SW
if('serviceWorker' in navigator){ navigator.serviceWorker.register('./service-worker.js'); }
