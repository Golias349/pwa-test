let talhoes=JSON.parse(localStorage.getItem('talhoes')||'[]');
let estoque=JSON.parse(localStorage.getItem('estoque')||'[]');
let aplics=JSON.parse(localStorage.getItem('aplics')||'[]');
const $=s=>document.querySelector(s);const $$=s=>document.querySelectorAll(s);
function salvar(){localStorage.setItem('talhoes',JSON.stringify(talhoes));
localStorage.setItem('estoque',JSON.stringify(estoque));
localStorage.setItem('aplics',JSON.stringify(aplics));}
function renderTalhoes(){let ul=$('#listaTalhoes');ul.innerHTML='';talhoes.forEach((t,i)=>{let li=document.createElement('li');li.textContent=t;ul.appendChild(li);});let sel=$('#selTalhao');sel.innerHTML='';talhoes.forEach(t=>{let o=document.createElement('option');o.value=t;o.textContent=t;sel.appendChild(o);});}
function renderEstoque(){let d=$('#listaEstoque');d.innerHTML='';estoque.forEach(e=>{let div=document.createElement('div');div.textContent=e.nome+' - '+e.qtd+'kg';d.appendChild(div);});let sel=$('#selInsumo');sel.innerHTML='';estoque.forEach(e=>{let o=document.createElement('option');o.value=e.nome;o.textContent=e.nome+' ('+e.qtd+'kg)';sel.appendChild(o);});}
function renderAplics(){let d=$('#listaAplics');d.innerHTML='';aplics.forEach(a=>{let div=document.createElement('div');div.textContent=a.talhao+' - '+a.insumo+' - '+a.qtd+'kg';d.appendChild(div);});}
$('#btnAddTalhao').onclick=()=>{if($('#inpTalhao').value){talhoes.push($('#inpTalhao').value);$('#inpTalhao').value='';salvar();renderTalhoes();}};
$('#btnAddEstoque').onclick=()=>{if($('#insNome').value){estoque.push({nome:$('#insNome').value,qtd:Number($('#insQtd').value),preco:Number($('#insPreco').value)});$('#insNome').value='';$('#insQtd').value='';$('#insPreco').value='';salvar();renderEstoque();}};
$('#btnSalvarAplic').onclick=()=>{aplics.push({talhao:$('#selTalhao').value,insumo:$('#selInsumo').value,qtd:Number($('#inpQtd').value),desc:$('#inpDesc').value,data:new Date().toISOString()});salvar();renderAplics();renderResumo();};
$('#btnLimpar').onclick=()=>{if(confirm('Apagar tudo?')){talhoes=[];estoque=[];aplics=[];salvar();renderTalhoes();renderEstoque();renderAplics();renderResumo();}};
$$('.bottom button').forEach(b=>b.onclick=()=>{go(b.dataset.go)});
function go(id){$$('main>section').forEach(s=>s.classList.add('hidden'));$('#'+id).classList.remove('hidden');$$('.bottom button').forEach(b=>b.classList.toggle('active',b.dataset.go===id));}
function renderResumo(){let byInsumo={};aplics.forEach(a=>{if(!byInsumo[a.insumo])byInsumo[a.insumo]={kg:0,gasto:0};byInsumo[a.insumo].kg+=a.qtd;let e=estoque.find(x=>x.nome===a.insumo);if(e)byInsumo[a.insumo].gasto+=a.qtd*(e.preco/50);});let tab='<table><tr><th>Insumo</th><th>Kg</th><th>R$</th></tr>';let labels=[],kgs=[],gastos=[];for(let ins in byInsumo){tab+='<tr><td>'+ins+'</td><td>'+byInsumo[ins].kg+'</td><td>'+byInsumo[ins].gasto.toFixed(2)+'</td></tr>';labels.push(ins);kgs.push(byInsumo[ins].kg);gastos.push(byInsumo[ins].gasto.toFixed(2));}tab+='</table>';$('#tabelaResumo').innerHTML=tab;desenhar(labels,kgs,gastos);}
let chartKg,chartGasto,tipoKg='bar',tipoGasto='bar';
function desenhar(labels,kgs,gastos){if(chartKg)chartKg.destroy();if(chartGasto)chartGasto.destroy();chartKg=new Chart($('#graficoKg'),{type:tipoKg,data:{labels:labels,datasets:[{label:'Kg aplicados',data:kgs,backgroundColor:'#10a760'}]},options:{responsive:true,maintainAspectRatio:false}});chartGasto=new Chart($('#graficoGasto'),{type:tipoGasto,data:{labels:labels,datasets:[{label:'R$ gasto',data:gastos,backgroundColor:'#1e90ff'}]},options:{responsive:true,maintainAspectRatio:false}});}
$('#btnTipoKg').onclick=()=>{tipoKg=tipoKg==='bar'?'pie':'bar';renderResumo();};
$('#btnTipoGasto').onclick=()=>{tipoGasto=tipoGasto==='bar'?'pie':'bar';renderResumo();};
window.onload=()=>{renderTalhoes();renderEstoque();renderAplics();renderResumo();};