// ======= Estado =======
const CLIENT_ID = "149167584419-39h4d0qhjfjqs09687oih6p1fkpqds0k.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/drive.file openid email profile";
let accessToken = null;

let talhoes   = JSON.parse(localStorage.getItem('talhoes')) || [];
let estoque   = JSON.parse(localStorage.getItem('estoque')) || []; // {nome, qtd(kg), preco(saco50)}
let registros = JSON.parse(localStorage.getItem('registros')) || []; // {dataISO, talhao, insumo, desc, qtd, precoUnitKg}

const EL = s => document.querySelector(s);
const todayStr = () => new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

// ======= Inicial =======
document.addEventListener('DOMContentLoaded',()=>{
  EL('#data').textContent = todayStr();
  mostrar('talhoes');
});

// ======= Navegação =======
function mostrar(pagina){
  const c = EL('#conteudo');
  if(pagina==='talhoes') {
    c.innerHTML = `
      <section class="card">
        <h2>🌿 Talhões</h2>
        <div class="row">
          <input id="inpTalhao" placeholder="Nome do talhão">
          <button class="btn-full" onclick="addTalhao()">Adicionar talhão</button>
        </div>
        <ul id="listaTalhoes" class="list"></ul>
      </section>`;
    renderTalhoes();
  }
  if(pagina==='registros') {
    c.innerHTML = `
      <section class="card">
        <h2>📋 Registros de Adubação</h2>
        <div class="row-3">
          <div>
            <label>Talhão</label>
            <select id="selTalhao"></select>
          </div>
          <div>
            <label>Insumo (do estoque)</label>
            <select id="selInsumo"></select>
            <div class="muted" id="hintInsumo"></div>
          </div>
          <div>
            <label>Qtde aplicada (kg)</label>
            <input id="inpKg" type="number" step="0.01" min="0">
          </div>
        </div>
        <div class="row">
          <input id="inpDesc" placeholder="Descrição (opcional)">
          <button class="btn-full" onclick="salvarAplicacao()">Salvar aplicação</button>
        </div>
        <h3>Últimas aplicações</h3>
        <ul id="listaAplic" class="list"></ul>
      </section>`;
    atualizarSelects();
    renderAplicacoes();
  }
  if(pagina==='estoque') {
    c.innerHTML = `
      <section class="card">
        <h2>📦 Estoque</h2>
        <div class="row-3">
          <input id="inpNomeIns" placeholder="Nome do insumo">
          <input id="inpQtdIns" type="number" step="0.01" min="0" placeholder="Quantidade (kg)">
          <input id="inpPrecoIns" type="number" step="0.01" min="0" placeholder="Preço por saco (50kg)">
        </div>
        <div class="btn-row">
          <button onclick="addEstoque()">Adicionar ao estoque</button>
        </div>
        <ul id="listaEstoque" class="list"></ul>
      </section>`;
    renderEstoque();
  }
  if(pagina==='resumo') {
    const now = new Date();
    const m = String(now.getMonth()+1).padStart(2,'0');
    const y = String(now.getFullYear());
    c.innerHTML = `
      <section class="card">
        <h2>📊 Resumo Mensal</h2>
        <div class="filter-row">
          <select id="fMes"></select>
          <select id="fAno"></select>
          <button onclick="renderResumo()">Filtrar</button>
          <div class="btn-row" style="margin-left:auto">
            <button onclick="exportCSV()">Exportar CSV</button>
            <button onclick="exportPrint()">Exportar PDF</button>
          </div>
        </div>
        <table>
          <thead><tr><th>Insumo</th><th>Kg aplicados</th><th>Gasto (R$)</th><th>Mês/Ano</th></tr></thead>
          <tbody id="tbodyResumo"></tbody>
        </table>
      </section>`;
    // popular selects
    const meses = ['01','02','03','04','05','06','07','08','09','10','11','12'];
    EL('#fMes').innerHTML = meses.map(mm=>`<option value="${mm}" ${'${'}mm===m?'selected':''}>${'${'}mm}</option>`).join('');
    const anos = [];
    const baseYear = new Date().getFullYear();
    for(let yy=baseYear-5; yy<=baseYear+1; yy++) anos.push(String(yy));
    EL('#fAno').innerHTML = anos.map(yy=>`<option value="${'${'}yy}" ${'${'}yy===y?'selected':''}>${'${'}yy}</option>`).join('');
    renderResumo();
  }
  if(pagina==='config') {
    c.innerHTML = `
      <section class="card">
        <h2>⚙️ Configurações</h2>
        <div class="btn-row">
          <button onclick="exportarBackup()">Exportar backup (JSON)</button>
          <button onclick="importarBackup()">Importar backup (JSON)</button>
        </div>
        <h3>☁️ Google Drive (opcional)</h3>
        <div class="btn-row">
          <button onclick="initGoogle()">Conectar ao Google</button>
          <button onclick="salvarNoDrive()">Salvar no Drive</button>
          <button onclick="carregarDoDrive()">Carregar do Drive</button>
        </div>
      </section>`;
  }
}

// ======= Talhões =======
function addTalhao(){
  const nome = EL('#inpTalhao').value.trim();
  if(!nome) return;
  if(talhoes.includes(nome)) return alert('Já existe esse talhão.');
  talhoes.push(nome);
  localStorage.setItem('talhoes', JSON.stringify(talhoes));
  EL('#inpTalhao').value='';
  renderTalhoes();
}
function renderTalhoes(){
  const ul = EL('#listaTalhoes'); if(!ul) return;
  ul.innerHTML = talhoes.map(t=>`<li class="item"><div><strong>${'${'}t}</strong></div></li>`).join('');
}

// ======= Estoque =======
function addEstoque(){
  const nome = EL('#inpNomeIns').value.trim();
  const kg   = Number(EL('#inpQtdIns').value);
  const preco= Number(EL('#inpPrecoIns').value);
  if(!nome || kg<=0 || preco<0) return;
  const ex = estoque.find(e=>e.nome.toLowerCase()===nome.toLowerCase());
  if(ex){ ex.qtd += kg; ex.preco = preco; } else { estoque.push({nome, qtd:kg, preco}); }
  localStorage.setItem('estoque', JSON.stringify(estoque));
  EL('#inpNomeIns').value = EL('#inpQtdIns').value = EL('#inpPrecoIns').value = '';
  renderEstoque(); atualizarSelects();
}
function renderEstoque(){
  const ul = EL('#listaEstoque'); if(!ul) return;
  ul.innerHTML = estoque.map(e=>`<li class="item">
    <div><strong>${'${'}e.nome}</strong> <span class="badge">${'${'}e.qtd.toFixed(2)} kg</span> <span class="badge">R$${'${'}Number(e.preco).toFixed(2)}/50kg</span></div>
  </li>`).join('');
}

// ======= Registros =======
function atualizarSelects(){
  const selT = EL('#selTalhao'); const selI = EL('#selInsumo');
  if(selT) selT.innerHTML = talhoes.map(t=>`<option>${'${'}t}</option>`).join('');
  if(selI) selI.innerHTML = estoque.map(e=>`<option value="${'${'}e.nome}" data-preco="${'${'}e.preco}">${'${'}e.nome} — ${'${'}e.qtd.toFixed(1)}kg</option>`).join('');
  if(EL('#hintInsumo')) EL('#hintInsumo').textContent = estoque.length? 'O custo usa o preço do estoque (saco 50kg).': 'Cadastre insumos no Estoque.';
}
function salvarAplicacao(){
  if(!talhoes.length) return alert('Cadastre um talhão primeiro.');
  if(!estoque.length) return alert('Cadastre um insumo no estoque primeiro.');
  const talhao = EL('#selTalhao').value;
  const insumo = EL('#selInsumo').value;
  const kg = Number(EL('#inpKg').value);
  const desc = EL('#inpDesc').value.trim();
  if(kg<=0) return;
  const ref = estoque.find(e=>e.nome===insumo);
  const precoUnit = (ref?.preco||0)/50; // R$/kg
  if(ref){
    if(ref.qtd < kg && !confirm(`Estoque insuficiente (${ '${' }ref.qtd.toFixed(2)} kg). Aplicar mesmo assim?`)) return;
    ref.qtd -= kg;
  }
  registros.push({
    dataISO: new Date().toISOString(),
    talhao, insumo, desc, qtd:kg, precoUnitKg: precoUnit
  });
  localStorage.setItem('registros', JSON.stringify(registros));
  localStorage.setItem('estoque', JSON.stringify(estoque));
  EL('#inpKg').value=''; EL('#inpDesc').value='';
  renderAplicacoes(); 
}
function renderAplicacoes(){
  const ul = EL('#listaAplic'); if(!ul) return;
  const ult = [...registros].reverse().slice(0,10);
  ul.innerHTML = ult.map(a=>`<li class="item">
    <div><strong>${'${'}a.talhao}</strong> • <span class="badge">${'${'}a.insumo}</span> • ${'${'}a.qtd.toFixed(2)} kg • R$${'${'}(a.qtd*a.precoUnitKg).toFixed(2)}
    <br><small>${'${'}new Date(a.dataISO).toLocaleDateString('pt-BR')} — ${'${'}a.desc||'-'}</small></div>
  </li>`).join('');
}

// ======= Resumo =======
function getResumo(mes, ano){
  const out = {}; // insumo -> {kg, gasto}
  registros.forEach(r=>{
    const dt = new Date(r.dataISO);
    const mm = String(dt.getMonth()+1).padStart(2,'0');
    const yy = String(dt.getFullYear());
    if(mm===mes && yy===ano){
      if(!out[r.insumo]) out[r.insumo] = {kg:0, gasto:0};
      out[r.insumo].kg += r.qtd;
      out[r.insumo].gasto += r.qtd * r.precoUnitKg;
    }
  });
  return out;
}
function renderResumo(){
  const mes = EL('#fMes').value; const ano = EL('#fAno').value;
  const mapa = getResumo(mes, ano);
  const tbody = EL('#tbodyResumo'); tbody.innerHTML='';
  Object.entries(mapa).forEach(([ins,info])=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${'${'}ins}</td><td>${'${'}info.kg.toFixed(2)}</td><td>R$${'${'}info.gasto.toFixed(2)}</td><td>${'${'}mes}/${'${'}ano}</td>`;
    tbody.appendChild(tr);
  });
}
function exportCSV(){
  const mes = EL('#fMes').value; const ano = EL('#fAno').value;
  const mapa = getResumo(mes, ano);
  let csv = 'Insumo,Kg aplicados,Gasto (R$),Mes/Ano\n';
  Object.entries(mapa).forEach(([ins,info])=>{
    csv += `${'${'}ins},${'${'}info.kg.toFixed(2)},${'${'}info.gasto.toFixed(2)},${'${'}mes}/${'${'}ano}\n`;
  });
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `resumo-${'${'}ano}-${'${'}mes}.csv`; a.click();
}
function exportPrint(){
  const mes = EL('#fMes').value; const ano = EL('#fAno').value;
  const mapa = getResumo(mes, ano);
  let html = `<html><head><title>Resumo ${'${'}mes}/${'${'}ano}</title>
  <style>body{{font-family:Arial}} table{{width:100%;border-collapse:collapse}} th,td{{border:1px solid #999;padding:8px;text-align:center}} th{{background:#2ecc71;color:#fff}}</style>
  </head><body><h2>Resumo Mensal ${'${'}mes}/${'${'}ano}</h2><table><tr><th>Insumo</th><th>Kg aplicados</th><th>Gasto (R$)</th></tr>`;
  Object.entries(mapa).forEach(([ins,info])=>{ html += `<tr><td>${'${'}ins}</td><td>${'${'}info.kg.toFixed(2)}</td><td>R$${'${'}info.gasto.toFixed(2)}</td></tr>`; });
  html += `</table></body></html>`;
  const w = window.open('','_blank'); w.document.write(html); w.document.close(); w.focus(); w.print();
}

// ======= Backup local =======
function exportarBackup(){
  const obj = {talhoes, estoque, registros};
  const blob = new Blob([JSON.stringify(obj,null,2)],{type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `grao-digital-backup-${'${'}Date.now()}.json`; a.click();
}
function importarBackup(){
  const input = document.createElement('input'); input.type='file'; input.accept='.json';
  input.onchange = e=>{
    const f = e.target.files[0]; if(!f) return;
    const rd = new FileReader();
    rd.onload = ()=>{
      try{
        const obj = JSON.parse(rd.result);
        talhoes   = obj.talhoes   || talhoes;
        estoque   = obj.estoque   || estoque;
        registros = obj.registros || registros;
        localStorage.setItem('talhoes', JSON.stringify(talhoes));
        localStorage.setItem('estoque', JSON.stringify(estoque));
        localStorage.setItem('registros', JSON.stringify(registros));
        alert('Backup importado');
      }catch(_e){ alert('Arquivo inválido'); }
    };
    rd.readAsText(f);
  };
  input.click();
}

// ======= Google Drive =======
function initGoogle(){
  const s = document.createElement('script');
  s.src = 'https://accounts.google.com/gsi/client';
  s.onload = ()=>{
    google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (tok)=>{ accessToken = tok.access_token; alert('Conectado ao Google'); }
    }).requestAccessToken();
  };
  document.body.appendChild(s);
}
async function salvarNoDrive(){
  if(!accessToken) return alert('Conecte ao Google primeiro');
  const obj = {talhoes, estoque, registros};
  const metadata = { name: `grao-digital-backup-${'${'}Date.now()}.json`, mimeType:'application/json' };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)],{type:'application/json'}));
  form.append('file', new Blob([JSON.stringify(obj)],{type:'application/json'}));
  const r = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',{ method:'POST', headers:{Authorization:`Bearer ${'${'}accessToken}`}, body:form });
  if(r.ok) alert('Backup salvo no Drive!'); else alert('Falha ao salvar.');
}
async function carregarDoDrive(){
  if(!accessToken) return alert('Conecte ao Google primeiro');
  const q = encodeURIComponent("name contains 'grao-digital-backup-' and mimeType = 'application/json'");
  const r = await fetch(`https://www.googleapis.com/drive/v3/files?q=${'${'}q}&orderBy=modifiedTime desc&pageSize=1&fields=files(id,name)`,{headers:{Authorization:`Bearer ${'${'}accessToken}`}});
  const js = await r.json();
  if(!js.files?.length) return alert('Nenhum backup encontrado');
  const fileId = js.files[0].id;
  const r2 = await fetch(`https://www.googleapis.com/drive/v3/files/${'${'}fileId}?alt=media`,{headers:{Authorization:`Bearer ${'${'}accessToken}`}});
  const data = await r2.json();
  talhoes   = data.talhoes   || talhoes;
  estoque   = data.estoque   || estoque;
  registros = data.registros || registros;
  localStorage.setItem('talhoes', JSON.stringify(talhoes));
  localStorage.setItem('estoque', JSON.stringify(estoque));
  localStorage.setItem('registros', JSON.stringify(registros));
  alert('Backup carregado do Drive');
}
