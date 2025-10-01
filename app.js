let talhoes = JSON.parse(localStorage.getItem('talhoes')) || [];
let registros = JSON.parse(localStorage.getItem('registros')) || [];
let estoque = JSON.parse(localStorage.getItem('estoque')) || [];

document.getElementById("data").textContent = new Date().toLocaleDateString("pt-BR", {weekday:"long", day:"numeric", month:"long", year:"numeric"});

function mostrar(secao){
  document.querySelectorAll('.secao').forEach(s=>s.style.display="none");
  document.getElementById(secao).style.display="block";
  if(secao==="estoque") atualizarResumoMensal();
}

function adicionarTalhao(){
  const nome=document.getElementById("nomeTalhao").value;
  if(!nome) return;
  talhoes.push(nome);
  localStorage.setItem("talhoes", JSON.stringify(talhoes));
  atualizarListas();
}

function salvarAplicacao(){
  const talhao=document.getElementById("talhaoSelect").value;
  const tipo=document.getElementById("tipoInsumo").value;
  const desc=document.getElementById("descricao").value;
  const qtd=parseFloat(document.getElementById("quantidade").value)||0;

  if(!talhao||!tipo||!qtd) return;

  let precoUnit=0;
  const itemEstoque = estoque.find(i=>i.nome===tipo);
  if(itemEstoque){
    precoUnit = (itemEstoque.preco/50);
    itemEstoque.qtd -= qtd;
  }

  registros.push({talhao,tipo,desc,qtd,precoUnit,data:new Date().toISOString()});
  localStorage.setItem("registros", JSON.stringify(registros));
  localStorage.setItem("estoque", JSON.stringify(estoque));
  atualizarListas();
}

function adicionarEstoque(){
  const nome=document.getElementById("nomeInsumo").value;
  const qtd=parseFloat(document.getElementById("qtdInsumo").value)||0;
  const preco=parseFloat(document.getElementById("precoInsumo").value)||0;
  if(!nome||!qtd||!preco) return;
  estoque.push({nome,qtd,preco});
  localStorage.setItem("estoque", JSON.stringify(estoque));
  atualizarListas();
}

function atualizarResumoMensal(){
  const resumo={};
  registros.forEach(r=>{
    const mes=new Date(r.data).toLocaleString("pt-BR",{month:"long",year:"numeric"});
    if(!resumo[mes]) resumo[mes]={};
    if(!resumo[mes][r.tipo]) resumo[mes][r.tipo]={kg:0,gasto:0};
    resumo[mes][r.tipo].kg+=r.qtd;
    resumo[mes][r.tipo].gasto+=r.qtd*r.precoUnit;
  });
  const tabela=document.getElementById("resumoMensal");
  tabela.innerHTML="<tr><th>Mês</th><th>Insumo</th><th>Kg aplicados</th><th>Gasto (R$)</th></tr>";
  for(let mes in resumo){
    for(let insumo in resumo[mes]){
      tabela.innerHTML+=`<tr><td>${mes}</td><td>${insumo}</td><td>${resumo[mes][insumo].kg}</td><td>${resumo[mes][insumo].gasto.toFixed(2)}</td></tr>`;
    }
  }
}

function atualizarListas(){
  document.getElementById("listaTalhoes").innerHTML=talhoes.map(t=>`<li>${t}</li>`).join("");
  document.getElementById("talhaoSelect").innerHTML=talhoes.map(t=>`<option>${t}</option>`).join("");
  document.getElementById("listaEstoque").innerHTML=estoque.map(e=>`<li>${e.nome} - ${e.qtd}kg - R$${e.preco}/saco</li>`).join("");
  document.getElementById("listaRegistros").innerHTML=registros.slice(-5).map(r=>`<li>${r.talhao} - ${r.tipo} (${r.qtd}kg)</li>`).join("");
}
atualizarListas();