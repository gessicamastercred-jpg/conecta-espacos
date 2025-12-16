// ================== VARIÁVEIS ==================
let clientesCache = [];

// ================== SELETORES ==================
const btnNovoEspaco = document.getElementById('btnNovoEspaco');
const btnNovoCliente = document.getElementById('btnNovoCliente');
const btnNovaReserva = document.getElementById('btnNovaReserva');

const espacosContainer = document.getElementById('espacosContainer');
const clientesContainer = document.getElementById('clientesContainer');
const reservasContainer = document.getElementById('reservasContainer');

// ================== EVENTOS ==================
btnNovoEspaco?.addEventListener('click', criarFormularioEspaco);
btnNovoCliente?.addEventListener('click', criarFormularioCliente);
btnNovaReserva?.addEventListener('click', criarFormularioReserva);

// ================== POPUP ==================
function criarPopup(html) {
  fecharPopup();
  const div = document.createElement('div');
  div.className = 'form-popup';
  div.innerHTML = html;
  document.body.appendChild(div);
}
function fecharPopup() {
  document.querySelector('.form-popup')?.remove();
}

// ================== FORMULÁRIOS ==================
function criarFormularioEspaco(espaco = {}) {
  criarPopup(`
    <h3>${espaco.id ? 'Editar Espaço' : 'Novo Espaço'}</h3>
    <input id="nome" placeholder="Nome" value="${espaco.nome || ''}">
    <input id="descricao" placeholder="Descrição" value="${espaco.descricao || ''}">
    <input id="tipo" placeholder="Tipo" value="${espaco.tipo || ''}">
    <input id="capacidade" type="number" placeholder="Capacidade" value="${espaco.capacidade || ''}">
    <button id="btnSalvar">Salvar</button>
    <button onclick="fecharPopup()">Cancelar</button>
  `);

  document.getElementById('btnSalvar').onclick = () =>
    espaco.id ? atualizarEspaco(espaco.id) : salvarEspaco();
}

function criarFormularioCliente(cliente = {}) {
  criarPopup(`
    <h3>${cliente.id ? 'Editar Cliente' : 'Novo Cliente'}</h3>
    <input id="nome" placeholder="Nome" value="${cliente.nome || ''}">
    <input id="empresa" placeholder="Empresa" value="${cliente.empresa || ''}">
    <input id="email" placeholder="Email" value="${cliente.email || ''}">
    <button id="btnSalvar">Salvar</button>
    <button onclick="fecharPopup()">Cancelar</button>
  `);

  document.getElementById('btnSalvar').onclick = () =>
    cliente.id ? atualizarCliente(cliente.id) : salvarCliente();
}

async function criarFormularioReserva(reserva = {}) {
  const espacos = await fetch('/espacos').then(r => r.json());
  const clientes = await fetch('/clientes').then(r => r.json());

  criarPopup(`
    <h3>${reserva.id ? 'Editar Reserva' : 'Nova Reserva'}</h3>
    <select id="id_espaco">
      ${espacos.map(e => `<option value="${e.id}" ${e.id === reserva.id_espaco ? 'selected' : ''}>${e.nome}</option>`).join('')}
    </select>
    <select id="id_cliente">
      ${clientes.map(c => `<option value="${c.id}" ${c.id === reserva.id_cliente ? 'selected' : ''}>${c.nome}</option>`).join('')}
    </select>
    <input id="data" type="date" value="${reserva.data || ''}">
    <input id="horario" placeholder="Horário" value="${reserva.horario || ''}">
    <button id="btnSalvar">Salvar</button>
    <button onclick="fecharPopup()">Cancelar</button>
  `);

  document.getElementById('btnSalvar').onclick = () =>
    reserva.id ? atualizarReserva(reserva.id) : salvarReserva();
}

// ================== CRUD ==================
function salvarEspaco() {
  fetch('/espacos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: nome.value,
      descricao: descricao.value,
      tipo: tipo.value,
      capacidade: Number(capacidade.value)
    })
  }).then(() => { fecharPopup(); carregarEspacos(); });
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
  }).then(() => { fecharPopup(); carregarClientes(); });
}

function salvarReserva() {
  fetch('/reservas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id_espaco: Number(id_espaco.value),
      id_cliente: Number(id_cliente.value),
      data: data.value,
      horario: horario.value
    })
  }).then(() => {
    fecharPopup();
    carregarReservas();
    carregarAgenda();
  });
}

function atualizarEspaco(id) {
  fetch(`/espacos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: nome.value,
      descricao: descricao.value,
      tipo: tipo.value,
      capacidade: Number(capacidade.value)
    })
  }).then(() => { fecharPopup(); carregarEspacos(); });
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
  }).then(() => { fecharPopup(); carregarClientes(); });
}

function atualizarReserva(id) {
  fetch(`/reservas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id_espaco: Number(id_espaco.value),
      id_cliente: Number(id_cliente.value),
      data: data.value,
      horario: horario.value
    })
  }).then(() => {
    fecharPopup();
    carregarReservas();
    carregarAgenda();
  });
}

function excluirEspaco(id) {
  if (confirm('Excluir espaço?'))
    fetch(`/espacos/${id}`, { method: 'DELETE' }).then(carregarEspacos);
}
function excluirCliente(id) {
  if (confirm('Excluir cliente?'))
    fetch(`/clientes/${id}`, { method: 'DELETE' }).then(carregarClientes);
}
function excluirReserva(id) {
  if (confirm('Excluir reserva?'))
    fetch(`/reservas/${id}`, { method: 'DELETE' }).then(() => {
      carregarReservas();
      carregarAgenda();
    });
}

// ================== LISTAGENS ==================
function carregarEspacos() {
  fetch('/espacos').then(r => r.json()).then(data => {
    espacosContainer.innerHTML = '';
    data.forEach(e => {
      espacosContainer.innerHTML += `
        <div class="card">
          <div class="card-body">
            <h4>${e.nome}</h4>
            <p>Descrição: ${e.descricao}</p>
            <p>Tipo: ${e.tipo}</p>
            <p>Capacidade: ${e.capacidade}</p>
            <div class="btn-actions">
              <button class="edit" onclick='criarFormularioEspaco(${JSON.stringify(e)})'>Editar</button>
              <button class="delete" onclick='excluirEspaco(${e.id})'>Excluir</button>
            </div>
          </div>
        </div>
      `;
    });
  });
}

function carregarClientes() {
  fetch('/clientes').then(r => r.json()).then(data => {
    clientesCache = data;
    clientesContainer.innerHTML = '';
    data.forEach(c => {
      clientesContainer.innerHTML += `
        <div class="card">
          <div class="card-body">
            <h4>${c.nome}</h4>
            <p>${c.empresa}</p>
            <p>${c.email}</p>
            <div class="btn-actions">
              <button class="edit" onclick="criarFormularioCliente(${JSON.stringify(c)})">Editar</button>
              <button class="delete" onclick="excluirCliente(${c.id})">Excluir</button>
            </div>
          </div>
        </div>
      `;
    });
  });
}

function carregarReservas() {
  fetch('/reservas').then(r => r.json()).then(data => {
    reservasContainer.innerHTML = '';
    data.forEach(r => {
      reservasContainer.innerHTML += `
        <div class="card">
          <div class="card-body">
            <p><strong>Espaço:</strong> ${r.nome_espaco}</p>
            <p><strong>Cliente:</strong> ${r.nome_cliente}</p>
            <p><strong>Data:</strong> ${r.data}</p>
            <p><strong>Horário:</strong> ${r.horario}</p>
            <div class="btn-actions">
              <button class="edit" onclick='criarFormularioReserva(${JSON.stringify(r)})'>Editar</button>
              <button class="delete" onclick='excluirReserva(${r.id})'>Excluir</button>
            </div>
          </div>
        </div>
      `;
    });
  });
}

function carregarAgenda() {
  fetch('/reservas').then(r => r.json()).then(data => {
    const tbody = document.querySelector('#agendaTable tbody');
    tbody.innerHTML = '';
    data.forEach(r => {
      tbody.innerHTML += `
        <tr>
          <td>${r.nome_espaco}</td>
          <td>${r.data}</td>
          <td>${r.horario}</td>
          <td>${r.nome_cliente}</td>
        </tr>
      `;
    });
  });
}

// ================== INIT ==================
carregarEspacos();
carregarClientes();
carregarReservas();
carregarAgenda();
