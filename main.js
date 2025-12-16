const API_URL = '';

const espacosContainer = document.getElementById('espacosContainer');
const clientesContainer = document.getElementById('clientesContainer');
const reservasContainer = document.getElementById('reservasContainer');

document.getElementById('btnNovoEspaco').onclick = () => criarFormularioEspaco();
document.getElementById('btnNovoCliente').onclick = () => criarFormularioCliente();
document.getElementById('btnNovaReserva').onclick = () => criarFormularioReserva();

// ================== POPUP ==================
function popup(html) {
  document.querySelector('.form-popup')?.remove();
  const div = document.createElement('div');
  div.className = 'form-popup';
  div.innerHTML = html;
  document.body.appendChild(div);
}
function fechar() {
  document.querySelector('.form-popup')?.remove();
}

// ================== ESPAÇOS ==================
function criarFormularioEspaco(e = {}) {
  popup(`
    <h3>${e.id ? 'Editar' : 'Novo'} Espaço</h3>
    <input id="nome" placeholder="Nome" value="${e.nome || ''}">
    <input id="descricao" placeholder="Descrição" value="${e.descricao || ''}">
    <input id="tipo" placeholder="Tipo" value="${e.tipo || ''}">
    <input id="capacidade" type="number" placeholder="Capacidade" value="${e.capacidade || ''}">
    <button onclick="${e.id ? `atualizarEspaco(${e.id})` : 'salvarEspaco()'}">Salvar</button>
    <button onclick="fechar()">Cancelar</button>
  `);
}

function salvarEspaco() {
  fetch('/espacos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: nome.value,
      descricao: descricao.value,
      tipo: tipo.value,
      capacidade: capacidade.value
    })
  }).then(() => { fechar(); carregarEspacos(); });
}

function atualizarEspaco(id) {
  fetch(`/espacos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: nome.value,
      descricao: descricao.value,
      tipo: tipo.value,
      capacidade: capacidade.value
    })
  }).then(() => { fechar(); carregarEspacos(); });
}

// ================== CLIENTES ==================
function criarFormularioCliente(c = {}) {
  popup(`
    <h3>${c.id ? 'Editar' : 'Novo'} Cliente</h3>
    <input id="nome" placeholder="Nome" value="${c.nome || ''}">
    <input id="empresa" placeholder="Empresa" value="${c.empresa || ''}">
    <input id="email" placeholder="Email" value="${c.email || ''}">
    <button onclick="${c.id ? `atualizarCliente(${c.id})` : 'salvarCliente()'}">Salvar</button>
    <button onclick="fechar()">Cancelar</button>
  `);
}

function salvarCliente() {
  fetch('/clientes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: nome.value,
      empresa: empresa.value,
      email: email.value
    })
  }).then(() => { fechar(); carregarClientes(); });
}

function atualizarCliente(id) {
  fetch(`/clientes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: nome.value,
      empresa: empresa.value,
      email: email.value
    })
  }).then(() => { fechar(); carregarClientes(); });
}

// ================== RESERVAS ==================
function criarFormularioReserva() {
  Promise.all([
    fetch('/espacos').then(r => r.json()),
    fetch('/clientes').then(r => r.json())
  ]).then(([espacos, clientes]) => {
    popup(`
      <h3>Nova Reserva</h3>
      <select id="id_espaco">${espacos.map(e => `<option value="${e.id}">${e.nome}</option>`)}</select>
      <select id="id_cliente">${clientes.map(c => `<option value="${c.id}">${c.nome}</option>`)}</select>
      <input id="data" type="date">
      <input id="horario" placeholder="Ex: 14:00-16:00">
      <button onclick="salvarReserva()">Salvar</button>
      <button onclick="fechar()">Cancelar</button>
    `);
  });
}

function salvarReserva() {
  fetch('/reservas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'isadmin': 'true'
    },
    body: JSON.stringify({
      id_espaco: id_espaco.value,
      id_cliente: id_cliente.value,
      data: data.value,
      horario: horario.value
    })
  })
  .then(r => r.json())
  .then(res => {
    if (res?.error) return alert(res.error);
    fechar();
    carregarReservas();
  });
}

// ================== LISTAGEM ==================
function carregarEspacos() {
  fetch('/espacos').then(r=>r.json()).then(d=>{
    espacosContainer.innerHTML='';
    d.forEach(e=>{
      espacosContainer.innerHTML+=`
        <div class="card">
          <h4>${e.nome}</h4>
          <p>${e.descricao}</p>
          <button onclick='criarFormularioEspaco(${JSON.stringify(e)})'>Editar</button>
        </div>`;
    });
  });
}

function carregarClientes() {
  fetch('/clientes').then(r=>r.json()).then(d=>{
    clientesContainer.innerHTML='';
    d.forEach(c=>{
      clientesContainer.innerHTML+=`
        <div class="card">
          <h4>${c.nome}</h4>
          <p>${c.email}</p>
        </div>`;
    });
  });
}

function carregarReservas() {
  fetch('/reservas').then(r=>r.json()).then(d=>{
    reservasContainer.innerHTML='';
    d.forEach(r=>{
      reservasContainer.innerHTML+=`
        <div class="card">
          <p>${r.nome_espaco} — ${r.nome_cliente}</p>
          <p>${r.data} | ${r.horario}</p>
        </div>`;
    });
  });
}

// ================== INIT ==================
carregarEspacos();
carregarClientes();
carregarReservas();

