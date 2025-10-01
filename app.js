// Util
const EL = s => document.querySelector(s);
const ELS = s => document.querySelectorAll(s);
const fmtMoeda = v => v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const hojeStr = () => new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

EL('#data').textContent = hojeStr();

let talhoes   = JSON.parse(localStorage.getItem('talhoes'))   || [];
let estoque   = JSON.parse(localStorage.getItem('estoque'))   || []; // [{nome, kg, precoSaco50}]
let aplics    = JSON.parse(localStorage.getItem('aplicacoes'))|| []; // [{data, talhao, insumo, desc, kg, custo}]

function salvarTudo(){
  localStorage.setItem('talhoes', JSON.stringify(talhoes));
  localStorage.setItem('estoque', JSON.stringify(estoque));
  localStorage.setItem('aplicacoes', JSON.stringify(aplics));
}

// Render
function render(){
  renderTalhoes();
  renderEstoque();
  renderAplics();
  atualizarSelects();
  atualizarResumoMensal();
}
function renderTalhoes(){
  const ul = EL('#listaTalhoes'); ul.innerHTML='';
  talhoes.forEach((t,i)=>{
    const li = document.createElement('li'); li.className='item';
    li.innerHTML = `<div><strong>${t}</strong></div>
      <div class="acoes">
        <button class="btn" data-editar="${i}">Editar</button>
        <button class="btn perigo" data-del="${i}">Excluir</button>
      </div>`;
    ul.appendChild(li);
  });
}
function renderEstoque(){
  const ul = EL('#listaEstoque'); ul.innerHTML='';
  estoque.forEach((e,i)=>{
    const precoKg = (Number(e.precoSaco50)||0)/50;
    const li = document.createElement('li'); li.className='item';
    li.innerHTML = `<div><strong>${e.nome}</strong>
      <span class="badge">${e.kg.toFixed(2)} kg</span>
      <span class="badge">R$ ${Number(e.precoSaco50).toFixed(2)}/50kg</span>
      <span class="badge">R$ ${precoKg.toFixed(2)}/kg</span></div>
      <div class="acoes">
        <button class="btn" data-repor="${i}">Repor</button>
        <button class="btn perigo" data-delins="${i}">Excluir</button>
      </div>`;
    ul.appendChild(li);
  });
}
function renderAplics(){
  const ul = EL('#listaAplic'); ul.innerHTML='';
  const ult = [...aplics].reverse().slice(0,10);
  ult.forEach((a,i)=>{
    const li = document.createElement('li'); li.className='item';
    li.innerHTML = `<div><strong>${a.talhao}</strong> – <span class="badge">${a.insumo}</span>
      • ${a.kg.toFixed(2)} kg • ${fmtMoeda(a.custo)}
      <br><small>${a.data} — ${a.desc||'-'}</small></div>
      <div class="acoes"><button class="btn perigo" data-delapl="${aplics.length-1 - i}">Excluir</button></div>`;
    ul.appendChild(li);
  });
}
function atualizarSelects(){
  const selT = EL('#selTalhao'); selT.innerHTML='';
  talhoes.forEach(t=>{ const o=document.createElement('option'); o.value=o.textContent=t; selT.appendChild(o); });
  const selI = EL('#selInsumo'); selI.innerHTML='';
  estoque.forEach(e=>{
    const o = document.createElement('option');
    o.value = e.nome;
    o.textContent = `${e.nome} — ${e.kg.toFixed(1)}kg • R$${Number(e.precoSaco50).toFixed(2)}/50kg`;
    selI.appendChild(o);
  });
  EL('#hintInsumo').textContent = estoque.length ? 'O custo usa o preço do estoque.' : 'Cadastre insumos no Estoque.';
}
function atualizarResumoMensal(){
  const body = EL('#tbodyResumo'); body.innerHTML='';
  const mapa = {};
  aplics.forEach(a=>{
    const [d,m,y] = a.data.split('/');
    const key = `${y}-${m}`;
    mapa[key] = mapa[key] || {kg:0, gasto:0};
    mapa[key].kg += a.kg;
    mapa[key].gasto += a.custo;
  });
  Object.keys(mapa).sort().forEach(k=>{
    const [y,m] = k.split('-');
    const row = document.createElement('div'); row.className='t-row';
    row.innerHTML = `<span>${m}/${y}</span><span>${mapa[k].kg.toFixed(2)}</span><span>${fmtMoeda(mapa[k].gasto)}</span>`;
    body.appendChild(row);
  });
}

// Talhões
EL('#btnAddTalhao').addEventListener('click', ()=>{
  const nome = EL('#inpTalhao').value.trim();
  if(!nome) return;
  if(talhoes.includes(nome)) return alert('Já existe um talhão com esse nome.');
  talhoes.push(nome);
  EL('#inpTalhao').value='';
  salvarTudo(); render();
});
EL('#listaTalhoes').addEventListener('click', (ev)=>{
  const del = ev.target.getAttribute('data-del');
  const ed  = ev.target.getAttribute('data-editar');
  if(del!==null){
    const i = Number(del);
    if(confirm(`Excluir talhão "${talhoes[i]}"?`)){
      aplics = aplics.filter(a=>a.talhao!==talhoes[i]);
      talhoes.splice(i,1);
      salvarTudo(); render();
    }
  }
  if(ed!==null){
    const i = Number(ed);
    const novo = prompt('Novo nome do talhão:', talhoes[i]);
    if(novo && !talhoes.includes(novo)){
      aplics = aplics.map(a => a.talhao===talhoes[i] ? {...a, talhao:novo} : a);
      talhoes[i]=novo; salvarTudo(); render();
    }
  }
});

// Estoque
EL('#btnAddEstoque').addEventListener('click', ()=>{
  const nome = EL('#inpNomeIns').value.trim();
  const kg   = Number(EL('#inpQtdIns').value);
  const preco= Number(EL('#inpPrecoIns').value);
  if(!nome || kg<=0 || preco<0) return;
  const ex = estoque.find(e=>e.nome.toLowerCase()===nome.toLowerCase());
  if(ex){ ex.kg += kg; ex.precoSaco50 = preco; } else { estoque.push({nome, kg, precoSaco50:preco}); }
  EL('#inpNomeIns').value=EL('#inpQtdIns').value=EL('#inpPrecoIns').value='';
  salvarTudo(); render();
});
EL('#listaEstoque').addEventListener('click',(ev)=>{
  const rep = ev.target.getAttribute('data-repor');
  const del = ev.target.getAttribute('data-delins');
  if(rep!==null){
    const i=Number(rep); const add=Number(prompt('Adicionar quantidade (kg):','0'));
    if(add>0){ estoque[i].kg+=add; salvarTudo(); render(); }
  }
  if(del!==null){
    const i=Number(del);
    if(confirm(`Excluir insumo "${estoque[i].nome}"?`)){
      estoque.splice(i,1); salvarTudo(); render();
    }
  }
});

// Registros (integração com Estoque)
EL('#btnSalvarAplic').addEventListener('click', ()=>{
  if(!talhoes.length) return alert('Cadastre um talhão primeiro.');
  if(!estoque.length) return alert('Cadastre um insumo no estoque primeiro.');

  const talhao = EL('#selTalhao').value;
  const insumoNome = EL('#selInsumo').value;
  const desc = EL('#inpDesc').value.trim();
  const kg = Number(EL('#inpKg').value);
  if(kg<=0) return;

  const ins = estoque.find(e=>e.nome===insumoNome);
  if(!ins) return alert('Insumo não encontrado no estoque.');
  if(ins.kg < kg){
    if(!confirm(`Estoque insuficiente (${ins.kg.toFixed(2)} kg). Deseja aplicar mesmo assim?`)) return;
  }
  const precoKg = (Number(ins.precoSaco50)||0)/50;
  const custo = precoKg * kg;

  ins.kg -= kg;
  aplics.push({ data: new Date().toLocaleDateString('pt-BR'), talhao, insumo: insumoNome, desc, kg, custo });

  EL('#inpDesc').value=''; EL('#inpKg').value='';
  salvarTudo(); render();
});

// Excluir aplicação (devolve estoque)
EL('#listaAplic').addEventListener('click',(ev)=>{
  const del = ev.target.getAttribute('data-delapl');
  if(del!==null){
    const i = Number(del); const a=aplics[i];
    if(confirm('Excluir registro e devolver o estoque?')){
      const ins = estoque.find(e=>e.nome===a.insumo); if(ins) ins.kg += a.kg;
      aplics.splice(i,1); salvarTudo(); render();
    }
  }
});

// Backup JSON
EL('#btnExport').addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify({talhoes, estoque, aplics},null,2)],{type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `grao-digital-backup-${Date.now()}.json`; a.click();
});
EL('#fileImport').addEventListener('change', e=>{
  const f = e.target.files[0]; if(!f) return;
  const rd = new FileReader();
  rd.onload = ()=>{
    try{
      const obj = JSON.parse(rd.result);
      talhoes = obj.talhoes || talhoes;
      estoque = obj.estoque || estoque;
      aplics  = obj.aplics  || aplics;
      salvarTudo(); render(); alert('Backup importado!');
    }catch(e){ alert('Arquivo inválido.'); }
  };
  rd.readAsText(f);
});

// Navegação
function mostrar(id){
  document.querySelectorAll('main section').forEach(s=> s.style.display='none');
  EL('#'+id).style.display='block';
  document.querySelectorAll('.nav-btn').forEach(b=> b.classList.remove('ativo'));
  const btn = document.querySelector(`.nav-btn[data-go="${id}"]`); if(btn) btn.classList.add('ativo');
}
document.querySelectorAll('.nav-btn').forEach(b=> b.addEventListener('click',()=>mostrar(b.dataset.go)));

// Drive (opcional)
const CLIENT_ID = "SUBSTITUA_AQUI_SEU_CLIENT_ID.apps.googleusercontent.com";
let accessToken = null;

function initGoogle(){
  if(!CLIENT_ID || CLIENT_ID.includes('SUBSTITUA_AQUI')) return alert("Edite CLIENT_ID em app.js para ativar o Drive.");
  const s = document.createElement('script'); s.src="https://accounts.google.com/gsi/client";
  s.onload = ()=>{
    google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: "https://www.googleapis.com/auth/drive.file openid email profile",
      callback: (token)=>{ accessToken = token.access_token; alert("Conectado ao Google."); }
    }).requestAccessToken();
  };
  document.body.appendChild(s);
}
async function saveToDrive(){
  if(!accessToken) return alert('Conecte ao Google primeiro.');
  const file = new Blob([JSON.stringify({talhoes, estoque, aplics},null,2)],{type:'application/json'});
  const metadata = { name: `grao-digital-backup-${Date.now()}.json`, mimeType:"application/json" };
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], {type:"application/json"}));
  form.append("file", file);
  const r = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",{
    method:"POST", headers:{Authorization:`Bearer ${accessToken}`}, body:form
  });
  if(r.ok) alert("Backup salvo no Drive!"); else alert("Falha ao salvar no Drive.");
}
async function loadFromDrive(){
  if(!accessToken) return alert('Conecte ao Google primeiro.');
  const q = encodeURIComponent("name contains 'grao-digital-backup-' and mimeType = 'application/json'");
  const r = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=modifiedTime desc&pageSize=1&fields=files(id,name)`,{
    headers:{Authorization:`Bearer ${accessToken}`}
  });
  const js = await r.json();
  if(!js.files?.length) return alert("Nenhum backup encontrado.");
  const fileId = js.files[0].id;
  const r2 = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,{
    headers:{Authorization:`Bearer ${accessToken}`}
  });
  const obj = await r2.json();
  talhoes = obj.talhoes || talhoes; estoque = obj.estoque || estoque; aplics = obj.aplics || aplics;
  salvarTudo(); render(); alert("Backup carregado do Drive!");
}
EL('#btnConnect')?.addEventListener('click', initGoogle);
EL('#btnSaveDrive')?.addEventListener('click', saveToDrive);
EL('#btnLoadDrive')?.addEventListener('click', loadFromDrive);

// PWA
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=> navigator.serviceWorker.register('service-worker.js'));
}

// inicial
mostrar('sec-talhoes'); render();
