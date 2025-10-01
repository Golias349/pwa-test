function atualizarResumoMensal(){
  const body=document.querySelector('#tbodyResumo');if(!body)return;
  body.innerHTML='';
  const mapa={};
  (aplics||[]).forEach(a=>{
    const [d,m,y]=a.data.split('/');
    const key=`${y}-${m}`;
    mapa[key]=mapa[key]||{totalKg:0,totalGasto:0,insumos:{}};
    mapa[key].totalKg+=a.kg;mapa[key].totalGasto+=a.custo;
    if(!mapa[key].insumos[a.insumo])mapa[key].insumos[a.insumo]={kg:0,gasto:0};
    mapa[key].insumos[a.insumo].kg+=a.kg;
    mapa[key].insumos[a.insumo].gasto+=a.custo;
  });
  Object.keys(mapa).sort().forEach(k=>{
    const [y,m]=k.split('-');
    const row=document.createElement('div');row.textContent=`${m}/${y} => ${mapa[k].totalKg}kg / R$${mapa[k].totalGasto.toFixed(2)}`;body.appendChild(row);
    Object.entries(mapa[k].insumos).forEach(([nome,info])=>{
      const row2=document.createElement('div');row2.textContent=`   ↳ ${nome}: ${info.kg}kg / R$${info.gasto.toFixed(2)}`;body.appendChild(row2);
    });
  });
}