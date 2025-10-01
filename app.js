// ====== Storage helpers ======
const LS = {
  get: (k, d) => JSON.parse(localStorage.getItem(k) || JSON.stringify(d)),
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  wipe: () => localStorage.clear()
};

// ====== Data keys ======
const K = {
  TALHOES: "talhoes",
  ESTOQUE: "estoque",
  APLICACOES: "aplicacoes"
};

// ====== Google Drive OAuth (token) ======
const CLIENT_ID = "149167584419-39h4d0qhjfjqs09687oih6p1fkpqds0k.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/drive.file email profile";
let accessToken = null;

function initGoogle(){
  if(!CLIENT_ID.includes(".apps.googleusercontent.com")){
    alert("Edite CLIENT_ID em app.js antes de conectar.");
    return;
  }
  const s = document.createElement("script");
  s.src = "https://accounts.google.com/gsi/client";
  s.onload = () => {
    google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID, scope: SCOPES,
      callback: token => { accessToken = token.access_token; alert("Conectado ao Google."); }
    }).requestAccessToken();
  };
  document.body.appendChild(s);
}

async function salvarNoDrive(){
  if(!accessToken) return alert("Conecte ao Google primeiro.");
  const payload = {
    talhoes: LS.get(K.TALHOES, []),
    estoque: LS.get(K.ESTOQUE, []),
    aplicacoes: LS.get(K.APLICACOES, []),
    savedAt: new Date().toISOString()
  };
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify({name:"grao-digital-backup.json", mimeType:"application/json"})], {type:"application/json"}));
  form.append("file", new Blob([JSON.stringify(payload, null, 2)], {type:"application/json"}));
  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method:"POST",
    headers: { Authorization: "Bearer " + accessToken },
    body: form
  });
  if(!res.ok) return alert("Falha ao salvar no Drive.");
  alert("Backup salvo no Drive!");
}

async function carregarDoDrive(){
  if(!accessToken) return alert("Conecte ao Google primeiro.");
  // Busca arquivo pelo nome
  const q = encodeURIComponent("name='grao-digital-backup.json' and trashed=false");
  const ls = await fetch("https://www.googleapis.com/drive/v3/files?q="+q+"&fields=files(id,name)", {
    headers:{Authorization:"Bearer "+accessToken}
  }).then(r=>r.json());
  if(!ls.files?.length) return alert("Nenhum backup encontrado.");
  const id = ls.files[0].id;
  const data = await fetch("https://www.googleapis.com/drive/v3/files/"+id+"?alt=media", {
    headers:{Authorization:"Bearer "+accessToken}
  }).then(r=>r.json());
  LS.set(K.TALHOES, data.talhoes||[]);
  LS.set(K.ESTOQUE, data.estoque||[]);
  LS.set(K.APLICACOES, data.aplicacoes||[]);
  renderAll(); alert("Backup carregado do Drive!");
}

// ====== UI helpers ======
function $(id){ return document.getElementById(id); }
function opt(v,t){ const o=document.createElement("option"); o.value=v; o.textContent=t; return o; }
function money(v){ return (v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}); }

// ====== Render & Actions ======
function renderTalhoes(){
  const talhoes = LS.get(K.TALHOES, []);
  const ul = $("listaTalhoes"); ul.innerHTML="";
  talhoes.forEach((t,i)=>{
    const li = document.createElement("li");
    li.innerHTML = `<span>${t}</span>
      <span>
        <button class="btn" onclick="remTalhao(${i})">Excluir</button>
      </span>`;
    ul.appendChild(li);
  });
  const sel = $("selTalhao"); sel.innerHTML=""; sel.appendChild(opt("","Talhão..."));
  talhoes.forEach(t=> sel.appendChild(opt(t,t)));
}
function remTalhao(i){
  const arr = LS.get(K.TALHOES, []);
  arr.splice(i,1); LS.set(K.TALHOES, arr); renderTalhoes();
}

function renderEstoque(){
  const itens = LS.get(K.ESTOQUE, []);
  const tb = $("tbEstoque"); tb.innerHTML="";
  itens.forEach((e,i)=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${e.nome}</td><td>${e.qtd}</td><td>${money(e.preco)}</td>
      <td><button class="btn" onclick="delEstoque(${i})">Excluir</button></td>`;
    tb.appendChild(tr);
  });
  // popular selInsumo
  const sel = $("selInsumo"); sel.innerHTML=""; sel.appendChild(opt("","Insumo (do estoque)"));
  itens.forEach(e=> sel.appendChild(opt(e.nome, e.nome)));
}
function delEstoque(i){
  const arr = LS.get(K.ESTOQUE, []); arr.splice(i,1); LS.set(K.ESTOQUE, arr); renderEstoque();
}

function renderAplicacoes(){
  const aps = LS.get(K.APLICACOES, []).slice(-10).reverse();
  const ul = $("listaAplicacoes"); ul.innerHTML="";
  aps.forEach(a=>{
    const li = document.createElement("li");
    li.textContent = `${a.data} • ${a.talhao} • ${a.insumo} • ${a.qtd}kg • ${money(a.custo)}`;
    ul.appendChild(li);
  });
}

function renderResumo(){
  // fill combos
  const mSel = $("selMes"), ySel = $("selAno");
  if(!mSel.options.length){
    for(let m=1;m<=12;m++) mSel.appendChild(opt(String(m).padStart(2,"0"), String(m).padStart(2,"0")));
  }
  if(!ySel.options.length){
    const y = new Date().getFullYear();
    for(let k=y-5;k<=y+3;k++) ySel.appendChild(opt(k,k));
    ySel.value = y;
    mSel.value = String(new Date().getMonth()+1).padStart(2,"0");
  }
  const mes = mSel.value, ano = ySel.value;
  const aps = LS.get(K.APLICACOES, []).filter(a=> a.mes===mes && a.ano===ano);
  // aggregate by insumo
  const map = {};
  aps.forEach(a=>{
    if(!map[a.insumo]) map[a.insumo] = {kg:0, gasto:0};
    map[a.insumo].kg += Number(a.qtd)||0;
    map[a.insumo].gasto += Number(a.custo)||0;
  });
  const tb = $("tbodyResumo"); tb.innerHTML="";
  let tkg=0, tg=0;
  Object.entries(map).forEach(([ins, obj])=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${ins}</td><td>${obj.kg}</td><td>${money(obj.gasto)}</td><td>${mes}/${ano}</td>`;
    tb.appendChild(tr); tkg+=obj.kg; tg+=obj.gasto;
  });
  $("totKg").textContent = tkg;
  $("totR$").textContent = money(tg);
  // charts
  const labels = Object.keys(map), dataKg = labels.map(l=>map[l].kg), dataR$ = labels.map(l=>map[l].gasto);
  drawCharts(labels, dataKg, dataR$);
}

let chartKg, chartGasto;
function drawCharts(labels, kg, gasto){
  const ctx1 = document.getElementById("chartKg");
  const ctx2 = document.getElementById("chartGasto");
  if(chartKg) chartKg.destroy(); if(chartGasto) chartGasto.destroy();
  chartKg = new Chart(ctx1, {
    type:"bar",
    data:{labels, datasets:[{label:"Kg", data:kg}]},
    options:{responsive:true, maintainAspectRatio:false}
  });
  chartGasto = new Chart(ctx2, {
    type:"bar",
    data:{labels, datasets:[{label:"R$", data:gasto}]},
    options:{responsive:true, maintainAspectRatio:false}
  });
}

// ====== Actions ======
$("btnAddTalhao").onclick = () => {
  const n = $("inpTalhao").value.trim(); if(!n) return;
  const arr = LS.get(K.TALHOES, []); if(arr.includes(n)) return alert("Já existe.");
  arr.push(n); LS.set(K.TALHOES, arr); $("inpTalhao").value=""; renderTalhoes();
};

$("btnAddEstoque").onclick = () => {
  const nome = $("inpNomeInsumo").value.trim();
  const qtd = parseFloat($("inpQtdInsumo").value||"0");
  const preco = parseFloat($("inpPrecoInsumo").value||"0");
  if(!nome || !qtd || !preco) return alert("Preencha insumo, quantidade e preço.");
  const arr = LS.get(K.ESTOQUE, []);
  const exist = arr.find(e=>e.nome.toLowerCase()===nome.toLowerCase());
  if(exist){ exist.qtd += qtd; exist.preco = preco; }
  else arr.push({nome, qtd, preco});
  LS.set(K.ESTOQUE, arr);
  $("inpNomeInsumo").value=""; $("inpQtdInsumo").value=""; $("inpPrecoInsumo").value="";
  renderEstoque();
};

$("btnSalvarAplicacao").onclick = () => {
  const talhao = $("selTalhao").value;
  const insumo = $("selInsumo").value;
  const desc = $("inpDesc").value.trim();
  const qtd = parseFloat($("inpQtd").value||"0");
  if(!talhao || !insumo || !qtd) return alert("Selecione talhão, insumo e quantidade.");
  const est = LS.get(K.ESTOQUE, []);
  const item = est.find(e=>e.nome===insumo);
  if(!item) return alert("Insumo não está no estoque.");
  if(item.qtd < qtd) return alert("Estoque insuficiente.");
  // custo proporcional (preço é por 50kg)
  const custo = (item.preco/50) * qtd;
  item.qtd -= qtd;
  LS.set(K.ESTOQUE, est);
  const d = new Date();
  const reg = {
    talhao, insumo, desc, qtd,
    custo, data: d.toLocaleDateString("pt-BR"),
    mes: String(d.getMonth()+1).padStart(2,"0"),
    ano: String(d.getFullYear())
  };
  const arr = LS.get(K.APLICACOES, []); arr.push(reg); LS.set(K.APLICACOES, arr);
  $("inpDesc").value=""; $("inpQtd").value="";
  renderAplicacoes(); renderEstoque(); renderResumo();
};

$("btnExportJSON").onclick = () => {
  const payload = {
    talhoes: LS.get(K.TALHOES, []),
    estoque: LS.get(K.ESTOQUE, []),
    aplicacoes: LS.get(K.APLICACOES, []),
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "grao-digital-backup.json";
  a.click();
};

$("fileImportJSON").onchange = ev => {
  const f = ev.target.files[0]; if(!f) return;
  const rd = new FileReader();
  rd.onload = () => {
    try{
      const data = JSON.parse(rd.result);
      LS.set(K.TALHOES, data.talhoes||[]);
      LS.set(K.ESTOQUE, data.estoque||[]);
      LS.set(K.APLICACOES, data.aplicacoes||[]);
      renderAll(); alert("Backup importado.");
    }catch(e){ alert("Arquivo inválido."); }
  };
  rd.readAsText(f);
};

$("btnGConnect").onclick = initGoogle;
$("btnGSalvar").onclick = salvarNoDrive;
$("btnGCarregar").onclick = carregarDoDrive;

$("btnCSV").onclick = () => {
  const rows = [...document.querySelectorAll("#tblResumo tr")].map(tr=>[...tr.children].map(td=>td.innerText));
  const csv = rows.map(r=> r.map(c=>`"${c.replaceAll('"','""')}"`).join(";")).join("\n");
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "resumo.csv"; a.click();
};

$("btnPDF").onclick = () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Resumo Mensal - Grão Digital", 14, 16);
  const head = [["Insumo","Kg aplicados","Gasto (R$)","Mês/Ano"]];
  const body = [...document.querySelectorAll("#tbodyResumo tr")].map(tr=>[...tr.children].map(td=>td.innerText));
  doc.autoTable({head, body, startY: 22});
  doc.save("resumo.pdf");
};

$("btnWipe").onclick = () => {
  if(confirm("Tem certeza? Isso apagará tudo.")){ LS.wipe(); renderAll(); }
};

// filtro resumo
$("selMes").onchange = renderResumo;
$("selAno").onchange = renderResumo;

// ====== Navigation ======
document.querySelectorAll(".nav button").forEach(b=>{
  b.onclick = () => {
    document.querySelectorAll(".nav button").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    document.querySelectorAll("main .card").forEach(c=>c.classList.remove("active"));
    document.getElementById(b.dataset.go).classList.add("active");
  };
});

function renderAll(){
  renderTalhoes(); renderEstoque(); renderAplicacoes(); renderResumo();
}
renderAll();
