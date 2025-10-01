let aplics=JSON.parse(localStorage.getItem('aplics')||'[]');
let estoque=JSON.parse(localStorage.getItem('estoque')||'[]');
let chartLinhaKg,chartLinhaGasto;
function renderHistorico(){let meses={};aplics.forEach(a=>{let d=new Date(a.data);let key=d.getFullYear()+'-'+(d.getMonth()+1);if(!meses[key])meses[key]={kg:0,gasto:0};meses[key].kg+=a.qtd;let e=estoque.find(x=>x.nome===a.insumo);if(e)meses[key].gasto+=a.qtd*(e.preco/50);});let labels=Object.keys(meses).sort();let kgs=labels.map(k=>meses[k].kg);let gastos=labels.map(k=>meses[k].gasto);if(chartLinhaKg)chartLinhaKg.destroy();if(chartLinhaGasto)chartLinhaGasto.destroy();chartLinhaKg=new Chart(document.getElementById('graficoLinhaKg'),{type:'line',data:{labels:labels,datasets:[{label:'Kg aplicados',data:kgs,borderColor:'#10a760'}]},options:{responsive:true,maintainAspectRatio:false}});chartLinhaGasto=new Chart(document.getElementById('graficoLinhaGasto'),{type:'line',data:{labels:labels,datasets:[{label:'R$ gasto',data:gastos,borderColor:'#1e90ff'}]},options:{responsive:true,maintainAspectRatio:false}});
// salvar CSV
document.getElementById('btnCsvHistorico').onclick=()=>{let csv='Mes,Kg,R$\n';labels.forEach((l,i)=>{csv+=l+','+kgs[i]+','+gastos[i].toFixed(2)+'\n';});let blob=new Blob([csv],{type:'text/csv'});let a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='historico.csv';a.click();};
// export PDF (via print)
document.getElementById('btnPdfHistorico').onclick=()=>{let w=window.open('');w.document.write('<h1>Histórico</h1><pre>'+labels.map((l,i)=>l+': '+kgs[i]+'kg - R$'+gastos[i].toFixed(2)).join('\n')+'</pre>');w.print();};
}
window.onload=renderHistorico;