// ====== Estado / Storage helpers ======
const SKEYS = {
  TALHOES: 'gd_talhoes',
  ESTOQUE: 'gd_estoque',
  APLICS:  'gd_aplics'
};
const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);
const read = (k, v=[]) => { try { return JSON.parse(localStorage.getItem(k)) ?? v } catch(e){ return v } }
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

// ====== Data / Header ======
const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const hoje = new Date();
$("#dataHoje").textContent = hoje.toLocaleDateString('pt-BR', {
  weekday:'long', day:'2-digit', month:'long', year:'numeric'
});

// ====== Navegação ======
function go(sectionId){
  $$('main > section').forEach(s => s.classList.add('hidden'));
  $('#' + sectionId).classList.remove('hidden');
  $$('.bottom button').forEach(b => b.classList.toggle('active', b.dataset.go===sectionId));
}
$$('.bottom').forEach?null:0;
$$('.bottom button').forEach(btn=>btn.addEventListener('click',()=>go(btn.dataset.go)));

// ====== Renderizadores ======
function renderTalhoes(){
  const talhoes = read(SKEYS.TALHOES);
  // lista
  const ul = $("#listaTalhoes");
  ul.innerHTML = talhoes.map((t,i)=>`
    <li>
      <div><strong>${t}</strong></div>
      <div class="row gap">
        <button class="btn outline" data-edit="${i}">Renomear</button>
        <button class="btn danger" data-del="${i}">Excluir</button>
      </div>
    </li>`).join('');
  ul.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ talhoes.splice(+b.dataset.del,1); write(SKEYS.TALHOES,talhoes); renderAll(); });
  ul.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{
    const idx=+b.dataset.edit; const novo=prompt('Novo nome:', talhoes[idx]||''); if(novo){ talhoes[idx]=novo.trim(); write(SKEYS.TALHOES,talhoes); renderAll(); }
  });
  // select de talhões
  const sel = $("#selTalhao");
  sel.innerHTML = `<option value="" disabled selected>Selecione</option>` + talhoes.map(t=>`<option>${t}</option>`).join('');
}
function renderEstoque(){
  const est = read(SKEYS.ESTOQUE);
  // tabela
  const wrap = $("#listaEstoque");
  if(!est.length){
    wrap.innerHTML = `<div class="muted" style="padding:12px">Sem itens...</div>`;
  } else {
    wrap.innerHTML = `<table class="table">
      <thead><tr><th>Insumo</th><th>Qtd (kg)</th><th>Preço saco (50kg)</th><th></th></tr></thead>
      <tbody>${est.map((e,i)=>`<tr>
        <td>${e.nome}</td><td>${e.qtd}</td><td>R$ ${e.preco.toFixed(2)}</td>
        <td><button class="btn danger" data-del="${i}">Remover</button></td>
      </tr>`).join('')}</tbody></table>`;
    wrap.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ est.splice(+b.dataset.del,1); write(SKEYS.ESTOQUE,est); renderAll(); });
  }
  // select insumos
  const sel = $("#selInsumo");
  sel.innerHTML = `<option value="" disabled selected>Selecione</option>` + est.map(e=>`<option value="${e.nome}">${e.nome} — ${e.qtd.toFixed(1)}kg</option>`).join('');
}
function renderAplics(){
  const a = read(SKEYS.APLICS);
  const wrap = $("#listaAplics");
  if(!a.length){ wrap.innerHTML = `<div class="muted" style="padding:12px">Sem aplicações...</div>`; return; }
  wrap.innerHTML = `<table class="table">
    <thead><tr><th>Data</th><th>Talhão</th><th>Insumo</th><th>Kg</th><th>Custo (R$)</th><th>Descrição</th><th></th></tr></thead>
    <tbody>${a.slice(-20).reverse().map((r,i)=>`<tr>
      <td>${new Date(r.ts).toLocaleDateString('pt-BR')}</td>
      <td>${r.t}</td><td>${r.ins}</td><td>${r.kg.toFixed(1)}</td><td>R$ ${r.custo.toFixed(2)}</td>
      <td>${r.desc||''}</td>
      <td><button class="btn danger" data-del="${r.id}">Excluir</button></td>
    </tr>`).join('')}</tbody></table>`;
  wrap.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{
    const id=b.dataset.del; const all=read(SKEYS.APLICS); const j=all.findIndex(x=>x.id===id); if(j>-1){all.splice(j,1); write(SKEYS.APLICS,all); renderAll();}
  });
}
function renderResumoOptions(){
  // meses
  const selM = $("#selMes");
  selM.innerHTML = meses.map((m,i)=>`<option value="${i+1}">${m}</option>`).join('');
  selM.value = (new Date().getMonth()+1);
  // anos (últimos 7)
  const anoAtual = (new Date()).getFullYear();
  const selA = $("#selAno");
  let opts = ``;
  for(let a=anoAtual; a>=anoAtual-6; a--) opts += `<option>${a}</option>`;
  selA.innerHTML = opts;
  selA.value = anoAtual;
}
function renderResumo(m=(new Date().getMonth()+1), y=(new Date()).getFullYear()){
  const a = read(SKEYS.APLICS);
  const est = read(SKEYS.ESTOQUE);
  // filtrar por mês/ano
  const rows = a.filter(r=>{
    const d = new Date(r.ts);
    return (d.getMonth()+1)===+m && d.getFullYear()===+y;
  });
  // agregar por insumo
  const map = {};
  rows.forEach(r=>{
    map[r.ins] = map[r.ins] || {kg:0, gasto:0};
    map[r.ins].kg += r.kg;
    map[r.ins].gasto += r.custo;
  });
  const wrap = $("#tabelaResumo");
  const linhas = Object.entries(map).map(([ins,v])=>`<tr><td>${ins}</td><td>${v.kg.toFixed(1)}</td><td>R$ ${v.gasto.toFixed(2)}</td><td>${String(m).padStart(2,'0')}/${y}</td></tr>`).join('');
  wrap.innerHTML = `<table id="resumoTable" class="table">
    <thead><tr><th>Insumo</th><th>Kg aplicados</th><th>Gasto (R$)</th><th>Mês/Ano</th></tr></thead>
    <tbody>${linhas || `<tr><td colspan="4" class="muted">Sem dados para o período.</td></tr>`}</tbody>
  </table>`;
}

// ====== Eventos ======
$("#btnAddTalhao").onclick = ()=>{
  const nome = $("#inpTalhao").value.trim();
  if(!nome) return;
  const arr = read(SKEYS.TALHOES);
  if(arr.includes(nome)) return alert("Já existe um talhão com esse nome.");
  arr.push(nome); write(SKEYS.TALHOES,arr); $("#inpTalhao").value=""; renderAll();
};

$("#btnAddEstoque").onclick = ()=>{
  const nome = $("#insNome").value.trim();
  const qtd  = parseFloat($("#insQtd").value);
  const preco= parseFloat($("#insPreco").value);
  if(!nome||!(qtd>0)||!(preco>=0)) return alert("Preencha os campos do estoque.");
  const est = read(SKEYS.ESTOQUE);
  const idx = est.findIndex(e=>e.nome.toLowerCase()===nome.toLowerCase());
  if(idx>-1){ est[idx].qtd += qtd; est[idx].preco = preco; }
  else{ est.push({nome, qtd, preco}); }
  write(SKEYS.ESTOQUE, est);
  $("#insNome").value=$("#insQtd").value=$("#insPreco").value="";
  renderAll();
};

$("#btnSalvarAplic").onclick = ()=>{
  const talhao = $("#selTalhao").value;
  const insumo = $("#selInsumo").value;
  const kg = parseFloat($("#inpQtd").value);
  const desc = $("#inpDesc").value.trim();
  if(!talhao||!insumo||!(kg>0)) return alert("Preencha Talhão, Insumo e Quantidade.");
  const est = read(SKEYS.ESTOQUE);
  const it = est.find(e=>e.nome===insumo);
  if(!it) return alert("Insumo não encontrado no estoque.");
  if(it.qtd < kg) return alert("Estoque insuficiente.");
  const custoKg = (it.preco/50); // preço por kg
  const custoAplic = custoKg * kg;
  it.qtd -= kg;
  write(SKEYS.ESTOQUE, est);
  const a = read(SKEYS.APLICS);
  a.push({ id:crypto.randomUUID(), t:talhao, ins:insumo, kg, custo:custoAplic, desc, ts:Date.now() });
  write(SKEYS.APLICS,a);
  $("#inpQtd").value=""; $("#inpDesc").value="";
  renderAll(); go('sec-registros');
};

$("#btnFiltrarResumo").onclick = ()=>{
  renderResumo($("#selMes").value, $("#selAno").value);
};

// Exportações
function tableToCSV(tableId){
  const rows = Array.from(document.querySelectorAll(`#${tableId} tr`));
  return rows.map(r=>Array.from(r.children).map(c=>`"${c.textContent.replace(/"/g,'""')}"`).join(';')).join('\n');
}
$("#btnCsv").onclick = ()=>{
  const csv = tableToCSV('resumoTable');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'resumo.csv';
  a.click();
};

$("#btnPdf").onclick = ()=>{
  // Abre uma janela de impressão com a tabela – usuário pode salvar como PDF.
  const html = `
    <html><head><meta charset="utf-8">
      <title>Resumo Mensal</title>
      <style>body{font:14px Arial;padding:20px} table{border-collapse:collapse;width:100%} th,td{border:1px solid #999;padding:8px;text-align:left}</style>
    </head><body>
      <h2>Resumo Mensal</h2>
      ${$("#tabelaResumo").innerHTML}
      <script>window.print()</script>
    </body></html>`;
  const w = window.open('', '_blank'); w.document.write(html); w.document.close();
};

// JSON backup
$("#btnExportJson").onclick = ()=>{
  const data = {
    talhoes: read(SKEYS.TALHOES), estoque: read(SKEYS.ESTOQUE), aplics: read(SKEYS.APLICS)
  };
  const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'grao-digital-backup.json'; a.click();
};
$("#btnImportJson").onclick = ()=>{
  const f = $("#fileImport").files?.[0];
  if(!f) return alert("Selecione o arquivo JSON.");
  const r = new FileReader();
  r.onload = ()=>{
    try{
      const js = JSON.parse(r.result);
      write(SKEYS.TALHOES, js.talhoes||[]);
      write(SKEYS.ESTOQUE, js.estoque||[]);
      write(SKEYS.APLICS,  js.aplics ||[]);
      renderAll(); alert("Importado com sucesso!");
    }catch(e){ alert("Arquivo inválido."); }
  };
  r.readAsText(f);
};

// Limpeza
$("#btnLimpar").onclick = ()=>{
  if(confirm("Tem certeza?")){ localStorage.clear(); renderAll(); }
};

// ====== Google Drive (GIS + REST) ======
const CLIENT_ID = "149167584419-39h4d0qhjfjqs09687oih6p1fkpqds0k.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/drive.file openid email profile";
let accessToken = null;

function initGoogle(){
  if(!CLIENT_ID.includes(".apps.googleusercontent.com")){
    alert("Edite CLIENT_ID em app.js com seu OAuth Client ID antes de conectar."); return;
  }
  const s = document.createElement('script');
  s.src = "https://accounts.google.com/gsi/client";
  s.onload = ()=>{
    google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID, scope: SCOPES,
      callback: (token)=>{ accessToken = token.access_token; alert("Conectado ao Google."); }
    }).requestAccessToken();
  };
  document.body.appendChild(s);
}
$("#btnLogin").onclick = initGoogle;

async function driveUpload(jsonObj){
  if(!accessToken) return alert("Conecte ao Google primeiro.");
  const fileName = "grao-digital-backup.json";
  const metadata = { name:fileName, mimeType:"application/json" };
  const boundary = "GDBoundary" + Math.random().toString(36).slice(2);
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`+
    JSON.stringify(metadata)+
    `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n`+
    JSON.stringify(jsonObj)+
    `\r\n--${boundary}--`;
  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method:"POST",
    headers:{ "Authorization":"Bearer "+accessToken, "Content-Type":"multipart/related; boundary="+boundary },
    body
  });
  if(!res.ok) return alert("Falha ao enviar para o Drive.");
  alert("Backup enviado ao Drive.");
}
$("#btnSalvarDrive").onclick = ()=>{
  const data = { talhoes: read(SKEYS.TALHOES), estoque: read(SKEYS.ESTOQUE), aplics: read(SKEYS.APLICS) };
  driveUpload(data);
};

async function driveDownload(){
  if(!accessToken) return alert("Conecte ao Google primeiro.");
  // procura pelo arquivo pelo nome (o mais recente)
  const q = encodeURIComponent("name = 'grao-digital-backup.json'");
  const list = await fetch("https://www.googleapis.com/drive/v3/files?q="+q+"&orderBy=modifiedTime desc&pageSize=1", {
    headers:{ Authorization:"Bearer "+accessToken }
  }).then(r=>r.json());
  if(!list.files?.length) return alert("Arquivo não encontrado no Drive.");
  const fileId = list.files[0].id;
  const txt = await fetch("https://www.googleapis.com/drive/v3/files/"+fileId+"?alt=media", {
    headers:{ Authorization:"Bearer "+accessToken }
  }).then(r=>r.text());
  try{
    const js = JSON.parse(txt);
    write(SKEYS.TALHOES, js.talhoes||[]);
    write(SKEYS.ESTOQUE, js.estoque||[]);
    write(SKEYS.APLICS,  js.aplics ||[]);
    renderAll(); alert("Backup carregado do Drive!");
  }catch(e){ alert("Conteúdo inválido no arquivo."); }
}
$("#btnCarregarDrive").onclick = driveDownload;

// ====== Inicialização ======
function renderAll(){
  renderTalhoes();
  renderEstoque();
  renderAplics();
  renderResumoOptions();
  renderResumo($("#selMes").value, $("#selAno").value);
}
renderAll();
go('sec-talhoes');

// PWA SW
if('serviceWorker' in navigator){ navigator.serviceWorker.register('./service-worker.js'); }
