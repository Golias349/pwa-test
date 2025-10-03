
const CLIENT_ID = "149167584419-39h4d0qhjfjqs09687oih6p1fkpqds0k.apps.googleusercontent.com";
const DRIVE_FILE_NAME = "grao-digital-backup.json";
const $ = (sel)=>document.querySelector(sel);
const el = (id)=>document.getElementById(id);
const fmtBR = (v)=> (v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const hoje = ()=> new Date().toISOString().slice(0,10);
const get = (k, def)=> JSON.parse(localStorage.getItem(k)||JSON.stringify(def));
const set = (k, v)=> localStorage.setItem(k, JSON.stringify(v));
let talhoes = get('talhoes', []);
let estoque = get('estoque', []);
let registros = get('registros', []);
let oauthToken = null;
let grafKg, grafRs;

document.querySelectorAll(".tab-btn").forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove('ativa'));
    document.querySelectorAll(".tela").forEach(t=>t.classList.remove('ativa'));
    btn.classList.add('ativa'); el(btn.dataset.alvo).classList.add('ativa');
  });
});

function renderTalhoes(){
  const ul = el('listaTalhoes'); ul.innerHTML = '';
  talhoes.forEach((t,i)=>{
    const li = document.createElement('li');
    li.innerHTML = `<span>${t}</span>
      <span class="acao">
        <button class="btn" onclick="renomearTalhao(${i})">Editar</button>
        <button class="btn perigo" onclick="excluirTalhao(${i})">Excluir</button>
      </span>`;
    ul.appendChild(li);
  });
  const sel = el('selTalhao'); sel.innerHTML='';
  talhoes.forEach(t=>{ const op=document.createElement('option'); op.value=t; op.textContent=t; sel.appendChild(op); });
}
function adicionarTalhao(){
  const n = el('nomeTalhao').value.trim();
  if(!n) return;
  talhoes.push(n); set('talhoes', talhoes); el('nomeTalhao').value=''; renderTalhoes();
}
function renomearTalhao(i){
  const novo = prompt("Novo nome do talhão:", talhoes[i]); if(!novo) return;
  talhoes[i]=novo; set('talhoes', talhoes); renderTalhoes();
}
function excluirTalhao(i){
  if(confirm("Remover talhão?")){ talhoes.splice(i,1); set('talhoes', talhoes); renderTalhoes(); }
}

function renderEstoque(){
  const tb = el('tbodyEstoque'); tb.innerHTML='';
  estoque.forEach((e,i)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${e.nome}</td><td>${fmtBR(e.qtd)}</td><td>R$ ${fmtBR(e.preco50)}</td>
    <td class="acao"><button class="btn" onclick="editarEstoque(${i})">Editar</button>
    <button class="btn perigo" onclick="delEstoque(${i})">Excluir</button></td>`;
    tb.appendChild(tr);
  });
  const sel = el('selInsumo'); sel.innerHTML='';
  estoque.forEach(e=>{ const op=document.createElement('option'); op.value=e.nome; op.textContent=`${e.nome} — ${e.qtd.toFixed(1)}kg`; sel.appendChild(op) });
}
function adicionarEstoque(){
  const nome = el('nomeInsumo').value.trim();
  const qtd = parseFloat(el('qtdInsumo').value||0);
  const preco = parseFloat(el('precoSaco').value||0);
  if(!nome || !qtd || !preco) return;
  const idx = estoque.findIndex(x=>x.nome.toLowerCase()==nome.toLowerCase());
  if(idx>=0){ estoque[idx].qtd += qtd; estoque[idx].preco50 = preco; }
  else estoque.push({nome,qtd,preco50:preco});
  set('estoque', estoque);
  el('nomeInsumo').value=''; el('qtdInsumo').value=''; el('precoSaco').value='';
  renderEstoque();
}
function editarEstoque(i){
  const e=estoque[i];
  const nome = prompt("Nome do insumo:", e.nome)||e.nome;
  const qtd = parseFloat(prompt("Quantidade (kg):", e.qtd)||e.qtd);
  const preco = parseFloat(prompt("Preço por saco 50kg (R$):", e.preco50)||e.preco50);
  estoque[i]={nome,qtd,preco50:preco}; set('estoque', estoque); renderEstoque();
}
function delEstoque(i){
  if(confirm("Excluir item do estoque?")){ estoque.splice(i,1); set('estoque', estoque); renderEstoque(); }
}

function salvarAplicacao(){
  const talhao = el('selTalhao').value;
  const insumo = el('selInsumo').value;
  const qtdKg = parseFloat(el('qtdAplic').value||0);
  const desc = el('descAplic').value.trim();
  if(!talhao || !insumo || !qtdKg) return alert("Preencha talhão, insumo e quantidade.");
  const item = estoque.find(e=>e.nome==insumo);
  const preco50 = item? item.preco50 : 0;
  if(item){ item.qtd = Math.max(0, item.qtd - qtdKg); set('estoque', estoque); renderEstoque(); }
  registros.unshift({data:hoje(), talhao, insumo, qtdKg, desc, preco50});
  set('registros', registros);
  el('qtdAplic').value=''; el('descAplic').value=''; renderRegistros();
}
function renderRegistros(){
  const box = el('ultimosRegistros'); box.innerHTML='';
  registros.slice(0,20).forEach(r=>{
    const custo = (r.preco50/50) * r.qtdKg;
    const div = document.createElement('div');
    div.className='item';
    div.innerHTML = `<strong>${r.talhao}</strong> — <span class="muted">${r.insumo}</span>
    <div class="muted">${r.qtdKg.toFixed(1)} kg • R$ ${fmtBR(custo)} • ${r.data} ${r.desc? "• "+r.desc:""}</div>`;
    box.appendChild(div);
  });
}

function popularMesAno(){
  const ms = el('mesResumo'); ms.innerHTML='';
  for(let m=1;m<=12;m++){ const op=document.createElement('option'); op.value=String(m).padStart(2,'0'); op.textContent=String(m).padStart(2,'0'); ms.appendChild(op) }
  const as = el('anoResumo'); as.innerHTML='';
  const anoAtual = new Date().getFullYear();
  for(let a=anoAtual-5;a<=anoAtual+1;a++){ const op=document.createElement('option'); op.value=a; op.textContent=a; as.appendChild(op) }
  ms.value = String(new Date().getMonth()+1).padStart(2,'0'); as.value = String(anoAtual);
}
function gerarResumo(){
  const m = el('mesResumo').value; const a = el('anoResumo').value;
  const alvo = `${a}-${m}`;
  const linhas = {}; let totalKg=0, totalR$=0;
  registros.forEach(r=>{
    if((r.data||'').startsWith(alvo)){
      const key=r.insumo; const gasto = (r.preco50/50) * r.qtdKg;
      if(!linhas[key]) linhas[key]={kg:0, rs:0}; linhas[key].kg+=r.qtdKg; linhas[key].rs+=gasto;
      totalKg+=r.qtdKg; totalR$+=gasto;
    }
  });
  const tb = el('tbodyResumo'); tb.innerHTML='';
  Object.entries(linhas).forEach(([insumo, v])=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${insumo}</td><td>${fmtBR(v.kg)}</td><td>R$ ${fmtBR(v.rs)}</td><td>${m}/${a}</td>`;
    tb.appendChild(tr);
  });
  el('totalKg').textContent = fmtBR(totalKg);
  el('totalGasto').textContent = "R$ "+fmtBR(totalR$);
  const labels = Object.keys(linhas);
  const dataKg = labels.map(k=>linhas[k].kg);
  const dataRs = labels.map(k=>linhas[k].rs);
  if(grafKg) grafKg.destroy(); if(grafRs) grafRs.destroy();
  grafKg = new Chart(el('grafKg'), {type:'bar', data:{labels, datasets:[{label:'Kg', data:dataKg}]}, options:{responsive:true, maintainAspectRatio:false}});
  grafRs = new Chart(el('grafR$'), {type:'bar', data:{labels, datasets:[{label:'R$', data:dataRs}]}, options:{responsive:true, maintainAspectRatio:false}});
}
function exportarCSV(){
  const rows = [["Insumo","Kg aplicados","Gasto (R$)","Mês/Ano"]];
  document.querySelectorAll("#tbodyResumo tr").forEach(tr=>{
    rows.push([...tr.children].map(td=>td.textContent));
  });
  rows.push(["Total", el('totalKg').textContent, el('totalGasto').textContent, ""]);
  const csv = rows.map(r=>r.join(";")).join("\n");
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8"});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download="resumo.csv"; a.click();
}
async function exportarPDF(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:'pt', format:'a4'});
  doc.setFontSize(14); doc.text("Resumo Mensal - Grão Digital", 40, 40);
  let y=70; doc.setFontSize(11);
  doc.text(`Mês: ${el('mesResumo').value}  Ano: ${el('anoResumo').value}`, 40, y); y+=20;
  doc.text("Insumo      Kg aplicados      Gasto (R$)", 40, y); y+=12;
  document.querySelectorAll("#tbodyResumo tr").forEach(tr=>{
    const tds=[...tr.children].map(td=>td.textContent);
    doc.text(`${tds[0]}      ${tds[1]}      ${tds[2]}`, 40, y); y+=14;
  });
  y+=8; doc.text(`Total:  Kg=${el('totalKg').textContent}   Gasto=${el('totalGasto').textContent}`, 40, y);
  doc.save("resumo.pdf");
}

function exportarBackupLocal(){
  const data = {talhoes, estoque, registros};
  const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download="grao-digital-backup.json"; a.click();
}
function importarBackupLocal(){
  const f = el('fileImport').files[0]; if(!f) return alert("Escolha um arquivo JSON.");
  const rd = new FileReader();
  rd.onload = ()=>{
    try{
      const data = JSON.parse(rd.result);
      talhoes = data.talhoes||[]; estoque = data.estoque||[]; registros = data.registros||[];
      set('talhoes',talhoes); set('estoque',estoque); set('registros',registros);
      renderTalhoes(); renderEstoque(); renderRegistros(); gerarResumo();
      alert("Backup importado com sucesso.");
    }catch(e){ alert("JSON inválido."); }
  };
  rd.readAsText(f);
}

function conectarGoogle(){
  const s = document.createElement('script');
  s.src = "https://accounts.google.com/gsi/client";
  s.onload = ()=>{
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: "https://www.googleapis.com/auth/drive.file",
      callback: (tokenResponse)=>{ oauthToken = tokenResponse.access_token; log("Conectado. Token OK."); }
    });
    tokenClient.requestAccessToken();
  };
  document.body.appendChild(s);
}
async function salvarNoDrive(){
  if(!oauthToken) return alert("Conecte ao Google primeiro.");
  const data = JSON.stringify({talhoes, estoque, registros});
  const metadata = {name: DRIVE_FILE_NAME, mimeType: "application/json"};
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
  form.append('file', new Blob([data], {type: 'application/json'}));
  const r = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method:"POST", headers:{Authorization:`Bearer ${oauthToken}`}, body: form
  });
  if(r.ok) log("Backup salvo no Drive."); else log("Falha ao salvar no Drive.");
}
async function carregarDoDrive(){
  if(!oauthToken) return alert("Conecte ao Google primeiro.");
  const q = encodeURIComponent(`name='${DRIVE_FILE_NAME}' and trashed=false`);
  const r = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&orderBy=modifiedTime desc`, {
    headers:{Authorization:`Bearer ${oauthToken}`}
  });
  const j = await r.json();
  if(!j.files?.length) return log("Nenhum backup encontrado com esse nome.");
  const id = j.files[0].id;
  const fr = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`, {
    headers:{Authorization:`Bearer ${oauthToken}`}
  });
  const data = await fr.json();
  talhoes = data.talhoes||[]; estoque=data.estoque||[]; registros=data.registros||[];
  set('talhoes',talhoes); set('estoque',estoque); set('registros',registros);
  renderTalhoes(); renderEstoque(); renderRegistros(); gerarResumo();
  log("Backup carregado do Drive.");
}
function log(msg){ const lg=el('logDrive'); if(lg) lg.textContent += `\n${msg}`; }

function apagarTudo(){
  if(!confirm("Tem certeza? Isso limpará todos os dados.")) return;
  localStorage.clear();
  talhoes=[]; estoque=[]; registros=[];
  renderTalhoes(); renderEstoque(); renderRegistros(); gerarResumo();
  alert("Pronto, tudo zerado.");
}

function init(){
  renderTalhoes(); renderEstoque(); renderRegistros(); popularMesAno(); gerarResumo();
}
document.addEventListener('DOMContentLoaded', init);
