
const money = n => new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:2}).format(Number(n||0));
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const today = () => new Date().toISOString().slice(0,10);

let db = JSON.parse(localStorage.getItem('donner_db') || '{"trips":[],"costs":[],"payments":[],"providers":[]}');
let config = JSON.parse(localStorage.getItem('donner_cfg') || '{"company":"Donner Turismo","api":""}');

document.querySelectorAll('nav button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('nav button').forEach(x=>x.classList.remove('active')); b.classList.add('active');
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.getElementById(b.dataset.section).classList.add('active');
  const titles={inicio:['Panel general','Control económico de todos los viajes.'],viajes:['Viajes','Administración integral de viajes.'],gastos:['Gastos y costos','Costos previstos y reales por viaje.'],pagos:['Pagos','Transferencias, efectivo y comprobantes.'],proveedores:['Proveedores y agentes','Agenda de hoteles, choferes, coordinadores y otros.'],informes:['Informes','Resúmenes listos para PDF o Excel.'],config:['Configuración','Conexión y datos generales.']};
  document.getElementById('pageTitle').textContent=titles[b.dataset.section][0];
  document.getElementById('pageSubtitle').textContent=titles[b.dataset.section][1];
}));

function persist(){ localStorage.setItem('donner_db',JSON.stringify(db)); renderAll(); syncRemote(); }
function saveConfig(){
  config.company=document.getElementById('cfgCompany').value.trim()||'Donner Turismo';
  config.api=document.getElementById('cfgApi').value.trim();
  localStorage.setItem('donner_cfg',JSON.stringify(config));
  updateSyncState(); alert('Configuración guardada.');
}
function updateSyncState(){document.getElementById('syncState').textContent=config.api?'● Sincronización configurada':'● Modo local'}
async function syncRemote(){
  if(!config.api) return;
  try{
    await fetch(config.api,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'backup',payload:db})});
    document.getElementById('syncState').textContent='● Datos sincronizados';
  }catch(e){document.getElementById('syncState').textContent='● Pendiente de sincronizar'}
}
async function loadRemote(){
  if(!config.api) return;
  try{
    const r=await fetch(config.api+'?action=load');
    const j=await r.json();
    if(j && j.ok && j.data){db=j.data; localStorage.setItem('donner_db',JSON.stringify(db)); renderAll();}
  }catch(e){}
}

function openModal(id){document.getElementById(id).classList.add('open')}
function closeModal(id){document.getElementById(id).classList.remove('open')}
function openTripModal(){openModal('tripModal')}
function openCostModal(){fillSelects(); openModal('costModal')}
function openPaymentModal(costId=''){fillSelects();document.getElementById('pDate').value=today();if(costId){const c=db.costs.find(x=>x.id===costId);if(c){pTrip.value=c.tripId;fillPaymentCosts(c.tripId);pCost.value=c.id;syncPaymentCost();}}else{fillPaymentCosts(pTrip.value)}openModal('paymentModal')}
function openProviderModal(){openModal('providerModal')}

function saveTrip(e){e.preventDefault();db.trips.push({id:uid(),name:tName.value,destination:tDestination.value,start:tStart.value,end:tEnd.value,passengers:+tPassengers.value,responsible:tResponsible.value,notes:tNotes.value,created:new Date().toISOString()});persist();e.target.reset();closeModal('tripModal')}
function saveCost(e){e.preventDefault();db.costs.push({id:uid(),tripId:cTrip.value,category:cCategory.value,concept:cConcept.value,providerId:cProvider.value,qty:1,unit:+cTotal.value,total:+cTotal.value,notes:cNotes.value,created:new Date().toISOString()});persist();e.target.reset();closeModal('costModal')}
function savePayment(e){
  e.preventDefault();
  const cost=db.costs.find(x=>x.id===pCost.value);
  if(!cost)return alert('Seleccioná la cuenta o gasto que estás pagando.');
  const amount=+pAmount.value;
  const pending=costPending(cost.id);
  if(amount<=0)return alert('Ingresá un monto válido.');
  if(amount>pending+0.001)return alert('El pago supera el saldo pendiente de '+money(pending)+'.');
  db.payments.push({id:uid(),tripId:pTrip.value,costId:pCost.value,date:pDate.value,providerId:pProvider.value,concept:pConcept.value,method:pMethod.value,amount,receipt:pReceipt.value,notes:pNotes.value,created:new Date().toISOString()});
  persist();e.target.reset();closeModal('paymentModal');
}
function saveProvider(e){e.preventDefault();db.providers.push({id:uid(),name:prName.value,type:prType.value,phone:prPhone.value,tax:prTax.value,notes:prNotes.value});persist();e.target.reset();closeModal('providerModal')}

function removeItem(kind,id){
  if(!confirm('¿Eliminar este registro?')) return;
  db[kind]=db[kind].filter(x=>x.id!==id);persist();
}
function tripCost(id){return db.costs.filter(x=>x.tripId===id).reduce((a,b)=>a+Number(b.total||0),0)}
function tripPaid(id){return db.payments.filter(x=>x.tripId===id).reduce((a,b)=>a+Number(b.amount||0),0)}
function tripPending(id){return Math.max(0,tripCost(id)-tripPaid(id))}
function costPaid(id){return db.payments.filter(x=>x.costId===id).reduce((a,b)=>a+Number(b.amount||0),0)}
function costPending(id){const c=db.costs.find(x=>x.id===id);return c?Math.max(0,Number(c.total||0)-costPaid(id)):0}
function costStatus(id){
  const c=db.costs.find(x=>x.id===id); if(!c)return ['—','b-red'];
  const total=Number(c.total||0), paid=costPaid(id);
  if(total>0 && paid>=total-0.001)return ['Pagado','b-green'];
  if(paid>0)return ['Parcial','b-yellow'];
  return ['Pendiente','b-red'];
}
function payStatus(id){
  const cost=tripCost(id), paid=tripPaid(id);
  if(cost>0 && paid>=cost) return ['Pagado','b-green'];
  if(paid>0) return ['Parcial','b-yellow'];
  return ['Sin pagos','b-red'];
}
function providerName(id){return db.providers.find(x=>x.id===id)?.name || '—'}
function tripName(id){return db.trips.find(x=>x.id===id)?.name || '—'}

function renderStats(){
  const costs=db.costs.reduce((a,b)=>a+Number(b.total||0),0), paid=db.payments.reduce((a,b)=>a+Number(b.amount||0),0);
  stTrips.textContent=db.trips.length;stCosts.textContent=money(costs);stPaid.textContent=money(paid);stPending.textContent=money(Math.max(0,costs-paid));
}
function renderRecent(){
  const rows=[...db.trips].sort((a,b)=>new Date(b.created)-new Date(a.created)).slice(0,5);
  recentTrips.innerHTML=rows.length?rows.map(t=>{const s=payStatus(t.id);return `<tr><td><span class="trip-title">${esc(t.name)}</span><div class="small muted">${esc(t.destination)}</div></td><td>${fmtDate(t.start)} - ${fmtDate(t.end)}</td><td>${t.passengers}</td><td>${money(tripCost(t.id))}</td><td>${money(tripPaid(t.id))}</td><td><span class="badge ${s[1]}">${s[0]}</span></td></tr>`}).join(''):`<tr><td colspan="6" class="empty">Todavía no hay viajes cargados.</td></tr>`;
}
function renderTrips(){
  const q=(tripSearch?.value||'').toLowerCase();
  const rows=db.trips.filter(t=>(t.name+' '+t.destination).toLowerCase().includes(q));
  tripsTable.innerHTML=rows.length?rows.map(t=>`<tr><td><strong>${esc(t.name)}</strong></td><td>${esc(t.destination)}</td><td>${fmtDate(t.start)}</td><td>${t.passengers}</td><td>${money(tripCost(t.id))}</td><td>${money(tripPaid(t.id))}</td><td>${money(tripPending(t.id))}</td><td><button class="btn btn-danger" onclick="removeItem('trips','${t.id}')">Eliminar</button></td></tr>`).join(''):`<tr><td colspan="8" class="empty">No hay viajes.</td></tr>`;
}
function renderCosts(){
  costsTable.innerHTML=db.costs.length?db.costs.map(c=>{
    const s=costStatus(c.id);
    return `<tr>
      <td>${esc(tripName(c.tripId))}</td>
      <td><span class="badge b-blue">${esc(c.category)}</span></td>
      <td>${esc(c.concept)}</td>
      <td>${esc(providerName(c.providerId))}</td>
      <td><strong>${money(c.total)}</strong></td>
      <td>${money(costPaid(c.id))}</td>
      <td><strong>${money(costPending(c.id))}</strong></td>
      <td><span class="badge ${s[1]}">${s[0]}</span></td>
      <td><div class="actions"><button class="btn btn-success" onclick="openPaymentModal('${c.id}')">+ Pago</button><button class="btn btn-danger" onclick="removeItem('costs','${c.id}')">Eliminar</button></div></td>
    </tr>`;
  }).join(''):`<tr><td colspan="9" class="empty">No hay costos cargados.</td></tr>`;
}
function renderPayments(){
  paymentsTable.innerHTML=db.payments.length?db.payments.map(p=>{
    const c=db.costs.find(x=>x.id===p.costId);
    return `<tr><td>${fmtDate(p.date)}</td><td>${esc(tripName(p.tripId))}</td><td>${esc(providerName(p.providerId))}</td><td>${esc(p.concept)}${c?`<div class="small muted">Cuenta: ${esc(c.concept)}</div>`:''}</td><td><span class="badge ${p.method==='Transferencia'?'b-blue':'b-yellow'}">${p.method}</span></td><td><strong>${money(p.amount)}</strong></td><td>${esc(p.receipt||'—')}</td><td><button class="btn btn-danger" onclick="removeItem('payments','${p.id}')">Eliminar</button></td></tr>`;
  }).join(''):`<tr><td colspan="8" class="empty">No hay pagos registrados.</td></tr>`;
}
function renderProviders(){
  providersTable.innerHTML=db.providers.length?db.providers.map(p=>`<tr><td><strong>${esc(p.name)}</strong></td><td>${esc(p.type)}</td><td>${esc(p.phone||'—')}</td><td>${esc(p.tax||'—')}</td><td>${esc(p.notes||'—')}</td><td><button class="btn btn-danger" onclick="removeItem('providers','${p.id}')">Eliminar</button></td></tr>`).join(''):`<tr><td colspan="6" class="empty">No hay proveedores registrados.</td></tr>`;
}
function fillSelects(){
  const tripOpts='<option value="">Seleccionar...</option>'+db.trips.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join('');
  const provOpts='<option value="">Sin asignar</option>'+db.providers.map(p=>`<option value="${p.id}">${esc(p.name)} · ${esc(p.type)}</option>`).join('');
  ['cTrip','pTrip','reportTrip'].forEach(id=>document.getElementById(id).innerHTML=tripOpts);
  ['cProvider','pProvider'].forEach(id=>document.getElementById(id).innerHTML=provOpts);
}
function fillPaymentCosts(tripId){
  const costs=db.costs.filter(c=>c.tripId===tripId);
  pCost.innerHTML='<option value="">Seleccionar cuenta...</option>'+costs.map(c=>`<option value="${c.id}">${esc(c.concept)} · ${money(c.total)} · pendiente ${money(costPending(c.id))}</option>`).join('');
}
function syncPaymentCost(){
  const c=db.costs.find(x=>x.id===pCost.value);
  if(!c){paymentBalanceNotice.textContent='Seleccioná una cuenta para ver cuánto queda pendiente.';return}
  pProvider.value=c.providerId||'';
  paymentBalanceNotice.innerHTML=`Monto previsto: <strong>${money(c.total)}</strong> · Pagado: <strong>${money(costPaid(c.id))}</strong> · Pendiente: <strong>${money(costPending(c.id))}</strong>`;
  pAmount.max=costPending(c.id);
}
pTrip.addEventListener('change',()=>{fillPaymentCosts(pTrip.value);syncPaymentCost()});
pCost.addEventListener('change',syncPaymentCost);
function renderReportSummary(){
  const id=reportTrip.value,t=db.trips.find(x=>x.id===id);
  if(!t){reportSummary.innerHTML='<h4>Resumen del viaje</h4><div style="color:#d1fae5">Seleccioná un viaje.</div>';return}
  const cost=tripCost(id),paid=tripPaid(id),pending=tripPending(id);
  const transfer=db.payments.filter(x=>x.tripId===id&&x.method==='Transferencia').reduce((a,b)=>a+b.amount,0);
  const cash=db.payments.filter(x=>x.tripId===id&&x.method==='Efectivo').reduce((a,b)=>a+b.amount,0);
  reportSummary.innerHTML=`<h4>${esc(t.name)}</h4><div class="sum-row"><span>Costo total</span><strong>${money(cost)}</strong></div><div class="sum-row"><span>Pagado</span><strong>${money(paid)}</strong></div><div class="sum-row"><span>Pendiente</span><strong>${money(pending)}</strong></div><hr style="border:0;border-top:1px solid rgba(255,255,255,.25)"><div class="sum-row"><span>Transferencias</span><span>${money(transfer)}</span></div><div class="sum-row"><span>Efectivo</span><span>${money(cash)}</span></div><div class="sum-row"><span>Costo por pasajero</span><strong>${money(t.passengers?cost/t.passengers:0)}</strong></div>`;
}
function fmtDate(s){if(!s)return'—';const [y,m,d]=s.split('-');return `${d}/${m}/${y}`}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

function exportPDF(){
  const id=reportTrip.value,t=db.trips.find(x=>x.id===id);if(!t)return alert('Seleccioná un viaje.');
  const {jsPDF}=window.jspdf;const doc=new jsPDF();
  doc.setFontSize(18);doc.text(config.company||'Donner Turismo',14,18);
  doc.setFontSize(13);doc.text('Resumen económico del viaje',14,27);
  doc.setFontSize(10);doc.text(`Viaje: ${t.name}`,14,36);doc.text(`Destino: ${t.destination}`,14,42);doc.text(`Fechas: ${fmtDate(t.start)} al ${fmtDate(t.end)} · Pasajeros: ${t.passengers}`,14,48);
  const costs=db.costs.filter(x=>x.tripId===id).map(c=>[c.category,c.concept,providerName(c.providerId),money(c.total),money(costPaid(c.id)),money(costPending(c.id))]);
  doc.autoTable({startY:56,head:[['Categoría','Concepto','Proveedor','Monto previsto','Pagado','Pendiente']],body:costs,styles:{fontSize:8}});
  let y=doc.lastAutoTable.finalY+8;
  const pays=db.payments.filter(x=>x.tripId===id).map(p=>[fmtDate(p.date),providerName(p.providerId),p.concept,p.method,money(p.amount),p.receipt||'']);
  doc.autoTable({startY:y,head:[['Fecha','Destinatario','Concepto','Medio','Monto','Comprobante']],body:pays,styles:{fontSize:8}});
  y=doc.lastAutoTable.finalY+10;doc.setFontSize(11);
  doc.text(`Costo total: ${money(tripCost(id))}`,14,y);
  doc.text(`Pagado: ${money(tripPaid(id))}`,14,y+6);
  doc.text(`Pendiente: ${money(tripPending(id))}`,14,y+12);
  doc.text(`Costo por pasajero: ${money(t.passengers?tripCost(id)/t.passengers:0)}`,14,y+18);
  doc.save(`Donner_${t.name.replace(/\s+/g,'_')}.pdf`);
}
function exportExcel(){
  const id=reportTrip.value,t=db.trips.find(x=>x.id===id);if(!t)return alert('Seleccioná un viaje.');
  const wb=XLSX.utils.book_new();
  const resumen=[
    ['DONNER TURISMO - RESUMEN ECONÓMICO'],['Viaje',t.name],['Destino',t.destination],['Salida',fmtDate(t.start)],['Regreso',fmtDate(t.end)],['Pasajeros',t.passengers],
    [],['Costo total',tripCost(id)],['Pagado',tripPaid(id)],['Pendiente',tripPending(id)],['Costo por pasajero',t.passengers?tripCost(id)/t.passengers:0]
  ];
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(resumen),'Resumen');
  const costs=[['Categoría','Concepto','Proveedor','Monto previsto','Pagado','Pendiente','Estado','Observaciones'],...db.costs.filter(x=>x.tripId===id).map(c=>{const s=costStatus(c.id);return [c.category,c.concept,providerName(c.providerId),c.total,costPaid(c.id),costPending(c.id),s[0],c.notes||'']})];
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(costs),'Costos');
  const pays=[['Fecha','Cuenta / gasto','Destinatario','Concepto del pago','Medio','Monto','Comprobante','Observaciones'],...db.payments.filter(x=>x.tripId===id).map(p=>{const c=db.costs.find(x=>x.id===p.costId);return [fmtDate(p.date),c?c.concept:'Pago general',providerName(p.providerId),p.concept,p.method,p.amount,p.receipt||'',p.notes||'']})];
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(pays),'Pagos');
  XLSX.writeFile(wb,`Donner_${t.name.replace(/\s+/g,'_')}.xlsx`);
}
function renderAll(){renderStats();renderRecent();renderTrips();renderCosts();renderPayments();renderProviders();fillSelects();renderReportSummary()}
document.getElementById('cfgCompany').value=config.company||'Donner Turismo';
document.getElementById('cfgApi').value=config.api||'';
updateSyncState();renderAll();loadRemote();
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))}
