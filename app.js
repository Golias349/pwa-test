/* Grão Digital - PWA
 * Armazena dados em localStorage.
 * Telas: Talhões, Registros, Estoque, Resumo (com Talhão), Configurações
 * Exporta CSV e PDF (via impressão do navegador). Gráficos com Chart.js.
 * Backup JSON local e integração opcional com Google Drive (requer credenciais).
*/
const DB_KEY = "graoDigitalDB_v1";
const GOOGLE_CLIENT_ID = ""; // opcional: coloque aqui seu OAuth Client ID (Web)
const GOOGLE_API_KEY = "";   // opcional: sua API Key
const GOOGLE_SCOPES = "https://www.googleapis.com/auth/drive.file";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const state = {
  charts: { kg: null, custo: null }
};

function todayStr() {
  const d = new Date();
  const dias = ["domingo","segunda-feira","terça-feira","quarta-feira","quinta-feira","sexta-feira","sábado"];
  const meses = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  return `${dias[d.getDay()]}, ${String(d.getDate()).padStart(2,"0")} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}

function loadDB(){
  const raw = localStorage.getItem(DB_KEY);
  if(!raw) return { talhoes: [], estoque: [], registros: [] };
  try { return JSON.parse(raw); }
  catch(e){ console.warn("DB inválido, resetando.", e); return { talhoes: [], estoque: [], registros: [] }; }
}
function saveDB(db){ localStorage.setItem(DB_KEY, JSON.stringify(db)); }

function formatBRL(v){ return v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}); }

function setupNav(){
  $$("#today").forEach?null:0;
  $("#today").textContent = todayStr();
  $$(".nav-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      $$(".nav-btn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.dataset.tab;
      $$(".tab").forEach(t=>t.classList.remove("active"));
      $("#"+tab).classList.add("active");
      if(tab==="tab-resumo") renderResumo();
      if(tab==="tab-registros") renderRegistros();
      if(tab==="tab-estoque") renderEstoque();
      if(tab==="tab-talhoes") renderTalhoes();
    });
  });
}

function renderTalhoes(){
  const db = loadDB();
  const ul = $("#lista-talhoes");
  ul.innerHTML = "";
  db.talhoes.forEach((t, idx)=>{
    const li = document.createElement("li");
    li.className = "item";
    li.innerHTML = `<div><span class="badge">#${String(idx+1).padStart(2,"0")}</span> &nbsp; ${t}</div>
      <div class="row gap">
        <button class="btn" data-act="ren" data-i="${idx}">Renomear</button>
        <button class="btn danger" data-act="del" data-i="${idx}">Excluir</button>
      </div>`;
    ul.appendChild(li);
  });
}
function bindTalhoes(){
  $("#add-talhao").addEventListener("click", ()=>{
    const nome = $("#novo-talhao").value.trim();
    if(!nome) return alert("Informe um nome de talhão.");
    const db = loadDB();
    db.talhoes.push(nome);
    saveDB(db);
    $("#novo-talhao").value = "";
    renderTalhoes();
    refreshTalhaoSelects();
  });
  $("#lista-talhoes").addEventListener("click",(ev)=>{
    const btn = ev.target.closest("button");
    if(!btn) return;
    const i = +btn.dataset.i;
    const db = loadDB();
    if(btn.dataset.act==="del"){
      if(!confirm("Excluir este talhão?")) return;
      const nome = db.talhoes[i];
      // impedir remoção se tiver registros vinculados
      const temRegs = db.registros.some(r=>r.talhao===nome);
      if(temRegs) return alert("Existem registros vinculados a este talhão. Exclua-os primeiro.");
      db.talhoes.splice(i,1);
    } else {
      const novo = prompt("Novo nome para o talhão:", db.talhoes[i]);
      if(novo && novo.trim()){
        // atualizar registros que apontam para o talhão
        const antigo = db.talhoes[i];
        db.talhoes[i] = novo.trim();
        db.registros.forEach(r=>{ if(r.talhao===antigo) r.talhao = novo.trim(); });
      }
    }
    saveDB(db);
    renderTalhoes();
    refreshTalhaoSelects();
  });
}

function renderEstoque(){
  const db = loadDB();
  const tbody = $("#tabela-estoque tbody");
  tbody.innerHTML = "";
  db.estoque.forEach((it, idx)=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${it.nome}</td>
      <td>${it.kg.toFixed(1)}</td>
      <td>${formatBRL(it.precoSaco)}</td>
      <td><button class="btn danger" data-i="${idx}">Remover</button></td>`;
    tbody.appendChild(tr);
  });
  refreshInsumoSelect();
}
function bindEstoque(){
  $("#btn-add-estoque").addEventListener("click", ()=>{
    const nome = $("#stk-nome").value.trim();
    const kg = parseFloat($("#stk-kg").value);
    const preco = parseFloat($("#stk-preco").value);
    if(!nome || !(kg>=0) || !(preco>=0)) return alert("Preencha os campos do estoque corretamente.");
    const db = loadDB();
    const ex = db.estoque.find(e=>e.nome.toLowerCase()===nome.toLowerCase());
    if(ex){ ex.kg += kg; ex.precoSaco = preco; }
    else db.estoque.push({nome, kg, precoSaco: preco});
    saveDB(db);
    $("#stk-nome").value = "";
    $("#stk-kg").value = "";
    $("#stk-preco").value = "";
    renderEstoque();
  });
  $("#tabela-estoque").addEventListener("click",(ev)=>{
    const btn = ev.target.closest("button");
    if(!btn) return;
    const i = +btn.dataset.i;
    const db = loadDB();
    if(confirm("Remover este item do estoque?")){
      // impedir remoção se houver registros que o usam
      const nome = db.estoque[i].nome;
      const temRegs = db.registros.some(r=>r.insumo===nome);
      if(temRegs) return alert("Existem registros usando este insumo. Exclua-os primeiro.");
      db.estoque.splice(i,1);
      saveDB(db);
      renderEstoque();
    }
  });
}

function refreshTalhaoSelects(){
  const db = loadDB();
  const sel = $("#reg-talhao");
  sel.innerHTML = `<option value="">Selecione</option>` + db.talhoes.map(t=>`<option>${t}</option>`).join("");
}
function refreshInsumoSelect(){
  const db = loadDB();
  const sel = $("#reg-insumo");
  sel.innerHTML = `<option value="">Selecione</option>` + db.estoque.map(e=>`<option>${e.nome}</option>`).join("");
}

function bindRegistros(){
  $("#btn-salvar-aplicacao").addEventListener("click", ()=>{
    const talhao = $("#reg-talhao").value;
    const insumo = $("#reg-insumo").value;
    const kg = parseFloat($("#reg-kg").value);
    const desc = $("#reg-desc").value.trim();
    if(!talhao || !insumo || !(kg>0)) return alert("Preencha talhão, insumo e quantidade.");
    const db = loadDB();
    const est = db.estoque.find(e=>e.nome===insumo);
    if(!est) return alert("Insumo não encontrado no estoque.");
    const precoPorKg = est.precoSaco / 50;
    const custo = kg * precoPorKg;
    // Atualiza estoque (apenas informativo, não deixa negativo)
    est.kg = Math.max(0, est.kg - kg);
    db.registros.push({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      data: new Date().toISOString(),
      talhao, insumo, kg, custo, desc
    });
    saveDB(db);
    $("#reg-kg").value = ""; $("#reg-desc").value = "";
    renderRegistros();
    renderEstoque();
  });

  $("#tabela-registros").addEventListener("click", (ev)=>{
    const btn = ev.target.closest("button");
    if(!btn) return;
    const id = btn.dataset.id;
    const db = loadDB();
    const i = db.registros.findIndex(r=>r.id===id);
    if(i>=0 && confirm("Excluir este registro?")){
      // ao excluir, devolver kg ao estoque
      const r = db.registros[i];
      const est = db.estoque.find(e=>e.nome===r.insumo);
      if(est) est.kg += r.kg;
      db.registros.splice(i,1);
      saveDB(db);
      renderRegistros();
      renderEstoque();
      renderResumo();
    }
  });
}

function renderRegistros(){
  refreshTalhaoSelects();
  refreshInsumoSelect();
  const db = loadDB();
  const tbody = $("#tabela-registros tbody");
  tbody.innerHTML = "";
  // mostrar últimos primeiro
  [...db.registros].reverse().forEach(r=>{
    const d = new Date(r.data);
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${d.toLocaleDateString("pt-BR")}</td>
      <td>${r.talhao}</td><td>${r.insumo}</td>
      <td>${r.kg.toFixed(1)}</td><td>${formatBRL(r.custo)}</td>
      <td>${r.desc||""}</td>
      <td><button class="btn danger" data-id="${r.id}">Excluir</button></td>`;
    tbody.appendChild(tr);
  });
}

// --------- RESUMO (com TALHÃO) ---------
function mesesPT(){return ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];}
function setupResumoFiltros(){
  const selMes = $("#filtro-mes");
  const selAno = $("#filtro-ano");
  selMes.innerHTML = mesesPT().map((m,i)=>`<option value="${i}">${m}</option>`).join("");
  const anoAtual = new Date().getFullYear();
  selAno.innerHTML = Array.from({length:6},(_,k)=>anoAtual-3+k).map(a=>`<option>${a}</option>`).join("");
  selMes.value = String(new Date().getMonth());
  selAno.value = String(anoAtual);
}
function agruparResumo(db, mes, ano){
  const out = {};
  db.registros.forEach(r=>{
    const d = new Date(r.data);
    if(d.getMonth()===mes && d.getFullYear()===ano){
      const chave = `${r.talhao}||${r.insumo}`;
      if(!out[chave]) out[chave] = { talhao:r.talhao, insumo:r.insumo, kg:0, custo:0, mesAno:`${String(mes+1).padStart(2,"0")}/${ano}` };
      out[chave].kg += r.kg;
      out[chave].custo += r.custo;
    }
  });
  return Object.values(out).sort((a,b)=> (a.talhao.localeCompare(b.talhao) || a.insumo.localeCompare(b.insumo)));
}
function renderResumo(){
  const db = loadDB();
  const mes = parseInt($("#filtro-mes").value);
  const ano = parseInt($("#filtro-ano").value);
  const linhas = agruparResumo(db, mes, ano);
  const tbody = $("#tabela-resumo tbody");
  tbody.innerHTML = "";
  linhas.forEach(l=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${l.talhao}</td><td>${l.insumo}</td><td>${l.kg.toFixed(1)}</td><td>${formatBRL(l.custo)}</td><td>${l.mesAno}</td>`;
    tbody.appendChild(tr);
  });
  // gráficos: barras por (talhão+insumo)
  const labels = linhas.map(l=>`${l.talhao} - ${l.insumo}`);
  const dataKg = linhas.map(l=>+l.kg.toFixed(2));
  const dataCusto = linhas.map(l=>+l.custo.toFixed(2));
  drawChart("grafico-kg", "Kg aplicados", labels, dataKg, "kg");
  drawChart("grafico-custo", "Gasto (R$)", labels, dataCusto, "R$");
}
function drawChart(canvasId, titulo, labels, data, sufixo){
  const ctx = document.getElementById(canvasId).getContext("2d");
  if(state.charts[canvasId.includes("kg")?"kg":"custo"]) state.charts[canvasId.includes("kg")?"kg":"custo"].destroy();
  state.charts[canvasId.includes("kg")?"kg":"custo"] = new Chart(ctx, {
    type: "bar",
    data: { labels, datasets: [{ label: titulo, data }]},
    options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:true}}, scales:{ y:{ beginAtZero:true } } }
  });
}

function bindResumo(){
  $("#btn-filtrar").addEventListener("click", renderResumo);
  $("#btn-csv").addEventListener("click", exportCSVResumo);
  $("#btn-pdf").addEventListener("click", exportPDFResumo);
}
function exportCSVResumo(){
  const mes = parseInt($("#filtro-mes").value);
  const ano = parseInt($("#filtro-ano").value);
  const linhas = agruparResumo(loadDB(), mes, ano);
  const header = ["Talhão","Insumo","Kg aplicados","Gasto (R$)","Mês/Ano"];
  const rows = linhas.map(l=>[l.talhao,l.insumo,l.kg.toFixed(1),l.custo.toFixed(2),l.mesAno]);
  const csv = [header.join(","), ...rows.map(r=>r.join(","))].join("\n");
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `resumo_${String(mes+1).padStart(2,"0")}-${ano}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
function exportPDFResumo(){
  // Usa impressão do navegador para gerar PDF com somente a tabela de resumo
  const tabelaHTML = $("#tabela-resumo").outerHTML;
  const win = window.open("","_blank");
  win.document.write(`<html><head><title>Resumo</title>
    <style>body{font-family:Segoe UI,Arial} table{border-collapse:collapse;width:100%}
    th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}</style></head>
    <body><h2>Resumo Mensal</h2>${tabelaHTML}</body></html>`);
  win.document.close();
  win.focus();
  win.print();
}


// --------- BACKUP JSON ---------
function bindBackup(){
  $("#btn-exportar-json").addEventListener("click", ()=>{
    const blob = new Blob([JSON.stringify(loadDB(), null, 2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "backup_grao_digital.json"; a.click();
    URL.revokeObjectURL(url);
  });
  $("#btn-importar-json").addEventListener("click", ()=>{
    const file = $("#input-backup").files[0];
    if(!file) return alert("Escolha um arquivo JSON.");
    const fr = new FileReader();
    fr.onload = () => {
      try{
        const data = JSON.parse(fr.result);
        if(!data || !("talhoes" in data)) throw new Error("Arquivo inválido.");
        saveDB(data);
        alert("Backup importado com sucesso.");
        renderTalhoes(); renderEstoque(); renderRegistros(); renderResumo();
      }catch(e){ alert("Falha ao importar: "+e.message); }
    };
    fr.readAsText(file);
  });
  $("#btn-apagar-tudo").addEventListener("click", ()=>{
    if(confirm("Apagar TODOS os dados? Esta ação não pode ser desfeita.")){
      localStorage.removeItem(DB_KEY);
      location.reload();
    }
  });
}

// --------- Google Drive (Opcional) ---------
function ensureGapiLoaded(){
  return new Promise((resolve, reject)=>{
    if(!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY){
      alert("Preencha GOOGLE_CLIENT_ID e GOOGLE_API_KEY em app.js para usar o Drive.");
      return reject("no-keys");
    }
    if(window.gapi){ return resolve(); }
    const s = document.createElement("script");
    s.src = "https://apis.google.com/js/api.js";
    s.onload = ()=> gapi.load("client:picker", ()=> resolve());
    s.onerror = reject;
    document.body.appendChild(s);
  });
}
let isAuthed = false;
async function googleAuth(){
  await ensureGapiLoaded();
  await gapi.client.init({
    apiKey: GOOGLE_API_KEY,
    clientId: GOOGLE_CLIENT_ID,
    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
    scope: GOOGLE_SCOPES
  });
  const googleUser = await gapi.auth2.getAuthInstance().signIn();
  isAuthed = !!googleUser;
  alert("Conectado ao Google.");
}
async function googleSave(){
  await ensureGapiLoaded();
  if(!isAuthed) await googleAuth();
  const fileContent = JSON.stringify(loadDB());
  const metadata = { name: "grao_digital_backup.json", mimeType: "application/json" };
  const boundary = "-------314159265358979323846";
  const delimiter = "\\r\\n--" + boundary + "\\r\\n";
  const closeDelim = "\\r\\n--" + boundary + "--";
  const body = delimiter +
    "Content-Type: application/json\\r\\n\\r\\n" +
    JSON.stringify(metadata) + delimiter +
    "Content-Type: application/json\\r\\n\\r\\n" +
    fileContent + closeDelim;

  const res = await gapi.client.request({
    path: "/upload/drive/v3/files",
    method: "POST",
    params: { uploadType: "multipart" },
    headers: { "Content-Type": "multipart/related; boundary=" + boundary },
    body
  });
  alert("Backup salvo no Drive (arquivo ID: " + res.result.id + ").");
}
async function googleLoad(){
  await ensureGapiLoaded();
  if(!isAuthed) await googleAuth();
  const res = await gapi.client.drive.files.list({ q: "name='grao_digital_backup.json' and trashed=false", pageSize: 1 });
  const file = res.result.files?.[0];
  if(!file) return alert("Arquivo não encontrado no Drive.");
  const fileRes = await gapi.client.drive.files.get({ fileId: file.id, alt: "media" });
  const data = fileRes.result;
  if(!data || !data.talhoes) return alert("Backup inválido.");
  saveDB(data);
  alert("Backup carregado do Drive.");
  renderTalhoes(); renderEstoque(); renderRegistros(); renderResumo();
}

function bindGoogle(){
  $("#btn-google-auth").addEventListener("click", googleAuth);
  $("#btn-google-save").addEventListener("click", googleSave);
  $("#btn-google-load").addEventListener("click", googleLoad);
}

// --------- INIT ---------
function seedIfEmpty(){
  const db = loadDB();
  if(db.talhoes.length===0 && db.estoque.length===0 && db.registros.length===0){
    db.talhoes = ["01","02"];
    db.estoque = [
      {nome:"ureia", kg: 65, precoSaco: 120.0},
      {"nome":"19 04 19", kg: 122, precoSaco: 170.0}
    ];
    // exemplos de registros (mês atual)
    const now = new Date();
    const iso = (d)=> new Date(now.getFullYear(), now.getMonth(), d).toISOString();
    db.registros = [
      {id:crypto.randomUUID?crypto.randomUUID():String(Date.now()), data: iso(2), talhao:"01", insumo:"19 04 19", kg:15, custo:15*(170/50), desc:""},
      {id:crypto.randomUUID?crypto.randomUUID():String(Date.now()+1), data: iso(2), talhao:"02", insumo:"19 04 19", kg:13, custo:13*(170/50), desc:""},
      {id:crypto.randomUUID?crypto.randomUUID():String(Date.now()+2), data: iso(2), talhao:"02", insumo:"ureia", kg:15, custo:15*(120/50), desc:""}
    ];
    saveDB(db);
  }
}

function init(){
  setupNav();
  bindTalhoes(); renderTalhoes();
  bindEstoque(); renderEstoque();
  bindRegistros(); renderRegistros();
  setupResumoFiltros(); bindResumo(); renderResumo();
  bindBackup();
  bindGoogle();
  seedIfEmpty();
}
document.addEventListener("DOMContentLoaded", init);
