const CLIENT_ID = "149167584419-39h4d0qhjfjqs09687oih6p1fkpqds0k.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/drive.file openid email profile";
let accessToken = null;

// Exibir data
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("data").textContent = new Date().toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });
  mostrar('talhoes');
});

// Alternar páginas
function mostrar(pagina) {
  const conteudo = document.getElementById("conteudo");
  if (pagina === 'estoque') {
    conteudo.innerHTML = `
      <section>
        <h2>📦 Estoque</h2>
        <input id="nomeInsumo" placeholder="Nome do Insumo"><br>
        <input id="qtdInsumo" type="number" placeholder="Quantidade (kg)"><br>
        <input id="precoInsumo" type="number" placeholder="Preço (R$)"><br>
        <button onclick="adicionarEstoque()">Adicionar ao Estoque</button>
        <div id="listaEstoque"></div>
        <h3>📊 Resumo Mensal</h3>
        <div id="resumo"></div>
      </section>`;
    atualizarEstoque();
    atualizarResumo();
  }
  else if (pagina === 'registros') {
    conteudo.innerHTML = `
      <section>
        <h2>📋 Registros de Adubação</h2>
        <select id="talhao"></select>
        <select id="insumo"></select>
        <input id="descricao" placeholder="Descrição"><br>
        <input id="qtdAplicada" type="number" placeholder="Quantidade (kg)"><br>
        <button onclick="salvarRegistro()">Salvar Aplicação</button>
        <div id="aplicacoes"></div>
      </section>`;
    atualizarSelects();
    atualizarAplicacoes();
  }
  else if (pagina === 'talhoes') {
    conteudo.innerHTML = `
      <section>
        <h2>🌿 Talhões</h2>
        <input id="nomeTalhao" placeholder="Nome do Talhão">
        <button onclick="adicionarTalhao()">Adicionar Talhão</button>
        <div id="listaTalhoes"></div>
      </section>`;
    atualizarTalhoes();
  }
  else if (pagina === 'config') {
    conteudo.innerHTML = `
      <section>
        <h2>⚙️ Configurações</h2>
        <button onclick="exportarBackup()">Exportar Backup</button>
        <button onclick="importarBackup()">Importar Backup</button>
        <h3>☁️ Backup no Google Drive</h3>
        <button onclick="initGoogle()">Conectar ao Google</button>
        <button onclick="salvarNoDrive()">Salvar no Drive</button>
        <button onclick="carregarDoDrive()">Carregar do Drive</button>
      </section>`;
  }
}

// ----- ESTOQUE -----
function adicionarEstoque() {
  let estoque = JSON.parse(localStorage.getItem("estoque")) || [];
  let nome = document.getElementById("nomeInsumo").value;
  let qtd = parseFloat(document.getElementById("qtdInsumo").value);
  let preco = parseFloat(document.getElementById("precoInsumo").value);
  if (!nome || !qtd || !preco) return;
  estoque.push({ nome, qtd, preco });
  localStorage.setItem("estoque", JSON.stringify(estoque));
  atualizarEstoque();
  atualizarResumo();
}

function atualizarEstoque() {
  let estoque = JSON.parse(localStorage.getItem("estoque")) || [];
  let lista = estoque.map(i => `<p>${i.nome} - ${i.qtd}kg - R$${i.preco}</p>`).join("");
  document.getElementById("listaEstoque").innerHTML = lista;
}

function atualizarResumo() {
  let registros = JSON.parse(localStorage.getItem("registros")) || [];
  let resumo = {};
  registros.forEach(r => {
    if (!resumo[r.insumo]) resumo[r.insumo] = { qtd: 0, gasto: 0 };
    resumo[r.insumo].qtd += r.qtd;
    resumo[r.insumo].gasto += r.qtd * r.preco;
  });
  let html = Object.entries(resumo).map(([nome, dados]) =>
    `<p>${nome}: ${dados.qtd}kg - R$${dados.gasto.toFixed(2)}</p>`
  ).join("");
  document.getElementById("resumo").innerHTML = html;
}

// ----- TALHÕES -----
function adicionarTalhao() {
  let talhoes = JSON.parse(localStorage.getItem("talhoes")) || [];
  let nome = document.getElementById("nomeTalhao").value;
  if (!nome) return;
  talhoes.push(nome);
  localStorage.setItem("talhoes", JSON.stringify(talhoes));
  atualizarTalhoes();
}

function atualizarTalhoes() {
  let talhoes = JSON.parse(localStorage.getItem("talhoes")) || [];
  document.getElementById("listaTalhoes").innerHTML = talhoes.map(t => `<p>${t}</p>`).join("");
}

// ----- REGISTROS -----
function atualizarSelects() {
  let talhoes = JSON.parse(localStorage.getItem("talhoes")) || [];
  let insumos = JSON.parse(localStorage.getItem("estoque")) || [];
  document.getElementById("talhao").innerHTML = talhoes.map(t => `<option>${t}</option>`).join("");
  document.getElementById("insumo").innerHTML = insumos.map(i => `<option value="${i.nome}" data-preco="${i.preco}">${i.nome}</option>`).join("");
}

function salvarRegistro() {
  let registros = JSON.parse(localStorage.getItem("registros")) || [];
  let talhao = document.getElementById("talhao").value;
  let insumo = document.getElementById("insumo").value;
  let descricao = document.getElementById("descricao").value;
  let qtd = parseFloat(document.getElementById("qtdAplicada").value);
  let preco = parseFloat(document.querySelector(`#insumo option[value="${insumo}"]`).dataset.preco);
  if (!talhao || !insumo || !qtd) return;
  registros.push({ talhao, insumo, descricao, qtd, preco, data: new Date().toLocaleDateString("pt-BR") });
  localStorage.setItem("registros", JSON.stringify(registros));
  atualizarAplicacoes();
  atualizarResumo();
}

function atualizarAplicacoes() {
  let registros = JSON.parse(localStorage.getItem("registros")) || [];
  let lista = registros.map(r => `<p>${r.data} - ${r.talhao} - ${r.insumo} - ${r.qtd}kg - R$${(r.qtd * r.preco).toFixed(2)}</p>`).join("");
  document.getElementById("aplicacoes").innerHTML = lista;
}

// ----- BACKUP GOOGLE DRIVE -----
function initGoogle() {
  const s = document.createElement("script");
  s.src = "https://accounts.google.com/gsi/client";
  s.onload = () => {
    google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (token) => { accessToken = token.access_token; alert("Conectado ao Google!"); }
    }).requestAccessToken();
  };
  document.body.appendChild(s);
}

function salvarNoDrive() {
  if (!accessToken) return alert("Conecte ao Google primeiro!");
  let dados = localStorage.getItem("registros") || "{}";
  fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=media", {
    method: "POST",
    headers: { "Authorization": "Bearer " + accessToken, "Content-Type": "application/json" },
    body: dados
  }).then(() => alert("Backup salvo no Drive!"));
}

function carregarDoDrive() {
  if (!accessToken) return alert("Conecte ao Google primeiro!");
  alert("Carregar do Drive precisa buscar pelo fileId (implementação simplificada aqui).");
}

// ----- BACKUP LOCAL -----
function exportarBackup() {
  let dados = localStorage.getItem("registros") || "{}";
  let blob = new Blob([dados], { type: "application/json" });
  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  a.download = "backup.json";
  a.click();
}
function importarBackup() {
  let input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = e => {
    let reader = new FileReader();
    reader.onload = () => {
      localStorage.setItem("registros", reader.result);
      atualizarAplicacoes();
      atualizarResumo();
    };
    reader.readAsText(e.target.files[0]);
  };
  input.click();
}