let talhoes=JSON.parse(localStorage.getItem('talhoes')||'[]');
let estoque=JSON.parse(localStorage.getItem('estoque')||'[]');
let aplics=JSON.parse(localStorage.getItem('aplics')||'[]');
const $=s=>document.querySelector(s);const $$=s=>document.querySelectorAll(s);
function salvar(){localStorage.setItem('talhoes',JSON.stringify(talhoes));
localStorage.setItem('estoque',JSON.stringify(estoque));
localStorage.setItem('aplics',JSON.stringify(aplics));}
function renderTalhoes(){let ul=$('#listaTalhoes');ul.innerHTML='';talhoes.forEach(t=>{let li=document.createElement('li');li.textContent=t;ul.appendChild(li);});let sel=$('#selTalhao');sel.innerHTML='';talhoes.forEach(t=>{let o=document.createElement('option');o.value=t;o.textContent=t;sel.appendChild(o);});}
function renderEstoque(){let d=$('#listaEstoque');d.innerHTML='';estoque.forEach(e=>{let div=document.createElement('div');div.textContent=e.nome+' - '+e.qtd+'kg';d.appendChild(div);});let sel=$('#selInsumo');sel.innerHTML='';estoque.forEach(e=>{let o=document.createElement('option');o.value=e.nome;o.textContent=e.nome+' ('+e.qtd+'kg)';sel.appendChild(o);});}
function renderAplics(){let d=$('#listaAplics');d.innerHTML='';aplics.forEach(a=>{let div=document.createElement('div');div.textContent=a.talhao+' - '+a.insumo+' - '+a.qtd+'kg';d.appendChild(div);});}
$('#btnAddTalhao').onclick=()=>{if($('#inpTalhao').value){talhoes.push($('#inpTalhao').value);$('#inpTalhao').value='';salvar();renderTalhoes();}};
$('#btnAddEstoque').onclick=()=>{if($('#insNome').value){estoque.push({nome:$('#insNome').value,qtd:Number($('#insQtd').value),preco:Number($('#insPreco').value)});$('#insNome').value='';$('#insQtd').value='';$('#insPreco').value='';salvar();renderEstoque();}};
$('#btnSalvarAplic').onclick=()=>{aplics.push({talhao:$('#selTalhao').value,insumo:$('#selInsumo').value,qtd:Number($('#inpQtd').value),desc:$('#inpDesc').value,data:new Date().toISOString()});salvar();renderAplics();renderResumo();renderHistorico();};
$('#btnLimpar').onclick=()=>{if(confirm('Apagar tudo?')){talhoes=[];estoque=[];aplics=[];salvar();renderTalhoes();renderEstoque();renderAplics();renderResumo();renderHistorico();}};
$$('.bottom button').forEach(b=>b.onclick=()=>{go(b.dataset.go)});
function go(id){$$('main>section').forEach(s=>s.classList.add('hidden'));$('#'+id).classList.remove('hidden');$$('.bottom button').forEach(b=>b.classList.toggle('active',b.dataset.go===id));}
// resumo
let chartKg,chartGasto,tipoKg='bar',tipoGasto='bar';
function renderResumo(){let byInsumo={};aplics.forEach(a=>{if(!byInsumo[a.insumo])byInsumo[a.insumo]={kg:0,gasto:0};byInsumo[a.insumo].kg+=a.qtd;let e=estoque.find(x=>x.nome===a.insumo);if(e)byInsumo[a.insumo].gasto+=a.qtd*(e.preco/50);});let tab='<table><tr><th>Insumo</th><th>Kg</th><th>R$</th></tr>';let labels=[],kgs=[],gastos=[];for(let ins in byInsumo){tab+='<tr><td>'+ins+'</td><td>'+byInsumo[ins].kg+'</td><td>'+byInsumo[ins].gasto.toFixed(2)+'</td></tr>';labels.push(ins);kgs.push(byInsumo[ins].kg);g...
$('#btnTipoKg').onclick=()=>{tipoKg=tipoKg==='bar'?'pie':'bar';renderResumo();};
$('#btnTipoGasto').onclick=()=>{tipoGasto=tipoGasto==='bar'?'pie':'bar';renderResumo();};
// historico
let chartLinhaKg,chartLinhaGasto;
function renderHistorico(){let meses={};aplics.forEach(a=>{let d=new Date(a.data);let key=d.getFullYear()+'-'+(d.getMonth()+1);if(!meses[key])meses[key]={kg:0,gasto:0};meses[key].kg+=a.qtd;let e=estoque.find(x=>x.nome===a.insumo);if(e)meses[key].gasto+=a.qtd*(e.preco/50);});let labels=Object.keys(meses).sort();let kgs=labels.map(k=>meses[k].kg);let gastos=labels.map(k=>meses[k].gasto);if(chartLinhaKg)chartLinhaKg.destroy();if(chartLinhaGasto)chartLinhaGasto.destroy();chartLinhaKg=new Chart($('#graficoLinhaKg'),{type:'line',data:{labels:labels,datasets:[{label:'Kg aplicados',data:kgs,borderColor:'#10a760',fill:false}]},options:{responsive:true,maintainAspectRatio:false}});chartLinhaGasto=new Chart($('#graficoLinhaGasto'),{type:'line',data:{labels:labels,datasets:[{label:'R$ gasto',data:gastos,borderColor:'#1e90ff',fill:false}]},options:{responsive:true,maintainAspectRatio:false}});}
window.onload=()=>{renderTalhoes();renderEstoque();renderAplics();renderResumo();renderHistorico();};