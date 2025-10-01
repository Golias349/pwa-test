document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("data").innerText = new Date().toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  mostrar("talhoes");
});

function mostrar(secao) {
  const conteudo = document.getElementById("conteudo");
  conteudo.innerHTML = "";

  if (secao === "talhoes") {
    conteudo.innerHTML = `
      <div class="card">
        <h2>🌿 Talhões</h2>
        <input type="text" placeholder="Nome do Talhão">
        <button>Adicionar Talhão</button>
      </div>`;
  } else if (secao === "registros") {
    conteudo.innerHTML = `
      <div class="card">
        <h2>📋 Registros de Adubação</h2>
        <select><option>Selecione o Talhão</option></select>
        <select><option>Selecione o Insumo</option></select>
        <input type="text" placeholder="Descrição">
        <input type="number" placeholder="Quantidade (kg)">
        <button>Salvar Aplicação</button>
      </div>`;
  } else if (secao === "estoque") {
    conteudo.innerHTML = `
      <div class="card">
        <h2>📦 Estoque</h2>
        <input type="text" placeholder="Nome do Insumo">
        <input type="number" placeholder="Quantidade (kg)">
        <input type="number" placeholder="Preço (R$)">
        <button>Adicionar ao Estoque</button>
      </div>`;
  } else if (secao === "config") {
    conteudo.innerHTML = `
      <div class="card">
        <h2>⚙️ Configurações</h2>
        <button>Exportar Backup</button>
        <button>Importar Backup</button>
      </div>`;
  }
}
