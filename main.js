// ================== VARIÁVEIS GLOBAIS ==================
let clientesCache = [];
const API_URL = 'https://conecta-espacos-production.up.railway.app';

// ================== SELETORES ==================
const btnNovoEspaco = document.getElementById('btnNovoEspaco');
const btnNovoCliente = document.getElementById('btnNovoCliente');
const btnNovaReserva = document.getElementById('btnNovaReserva');

const espacosContainer = document.getElementById('espacosContainer');
const clientesContainer = document.getElementById('clientesContainer');
const reservasContainer = document.getElementById('reservasContainer');

// ================== EVENTOS ==================
btnNovoEspaco?.addEventListener('click', () => criarFormularioEspaco());
btnNovoCliente?.addEventListener('click', () => criarFormularioCliente());
btnNovaReserva?.addEventListener('click', () => criarFormularioReserva());

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
    <input id="tipo" placeholder="Tipo (sala,auditório,coworking,etc)" value="${espaco.tipo || ''}">
    <input id="capacidade" type="number" placeholder="Capacidade" value="${espaco.capacidade || ''}">
    <button onclick="${espaco.id ? `atualizarEspaco(${espaco.id})` : 'salvarEspaco()'}">Salvar</button>
    <button onclick="fecharPopup()">Cancelar</button>
  `);
}

function criarFormularioCliente(cliente = {}) {
  criarPopup(`
    <h3>${cliente.id ? 'Editar Cliente' : 'Novo Cliente'}</h3>
    <input id="nome" placeholder="Nome" value="${cliente.nome || ''}">
    <input id="empresa" placeholder="Empresa" value="${cliente.empresa || ''}">
    <input id="email" placeholder="Email" value="${cliente.email || ''}">
    <button onclick="${cliente.id ? `atualizarCliente(${cliente.id})` : 'salvarCliente()'}">Salvar</button>
    <button onclick="fecharPopup()">Cancelar</button>
  `);
}

async function criarFormularioReserva(reserva = {}) {
  const espacos = await fetch(`${API_URL}/espacos`).then(r => r.json());
  const clientes = await fetch(`${API_URL}/clientes`).then(r => r.json());

  criarPopup(`
    <h3>${reserva.id ? 'Editar Reserva' : 'Nova Reserva'}</h3>
    <select id="id_espaco">
      <option value="">Selecione o Espaço</option>
      ${espacos.map(e => `<option value="${e.id}" ${e.id === reserva.id_espaco ? 'selected' : ''}>${e.nome}</option>`).join('')}
    </select>
    <select id="id_cliente">
      <option value="">Selecione o Cliente</option>
      ${clientes.map(c => `<option value="${c.id}" ${c.id === reserva.id_cliente ? 'selected' : ''}>${c.nome}</option>`).join('')}
    </select>
    <input id="data" type="date" value="${reserva.data || ''}">
    <input id="horario" placeholder="Horário (HH:MM-HH:MM)" value="${reserva.horario || ''}">
    <button onclick="${reserva.id ? `atualizarReserva(${reserva.id})` : 'salvarReserva()'}">Salvar</button>
    <button onclick="fecharPopup()">Cancelar</button>
  `);
}

// ================== SALVAR ==================
function salvarEspaco() {
  fetch(`${API_URL}/espacos`, {
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
  fetch(`${API_URL}/clientes`, {
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
  fetch(`${API_URL}/reservas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id_espaco: Number(document.getElementById('id_espaco').value),
      id_cliente: Number(document.getElementById('id_cliente').value),
      data: document.getElementById('data').value,
      horario: document.getElementById('horario').value
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) { alert(data.error); return; }
    fecharPopup();
    carregarReservas();
  });
}

// ================== ATUALIZAR ==================
function atualizarEspaco(id) {
  fetch(`${API_URL}/espacos/${id}`, {
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
  fetch(`${API_URL}/clientes/${id}`, {
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
  fetch(`${API_URL}/reservas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id_espaco: Number(id_espaco.value),
      id_cliente: Number(id_cliente.value),
      data: data.value,
      horario: horario.value
    })
  }).then(() => { fecharPopup(); carregarReservas(); });
}

// ================== EXCLUIR ==================
function excluirEspaco(id) { if(confirm('Excluir espaço?')) fetch(`${API_URL}/espacos/${id}`,{method:'DELETE'}).then(carregarEspacos); }
function excluirCliente(id) { if(confirm('Excluir cliente?')) fetch(`${API_URL}/clientes/${id}`,{method:'DELETE'}).then(carregarClientes); }
function excluirReserva(id) { if(confirm('Excluir reserva?')) fetch(`${API_URL}/reservas/${id}`,{method:'DELETE'}).then(carregarReservas); }

// ================== LISTAGEM ==================
function carregarEspacos() {
  fetch(`${API_URL}/espacos`).then(r=>r.json()).then(data=>{
    espacosContainer.innerHTML='';
    data.forEach(e=>{
      espacosContainer.innerHTML+=`
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
  fetch(`${API_URL}/clientes`).then(r=>r.json()).then(data=>{
    clientesCache=data;
    clientesContainer.innerHTML='';
    data.forEach(c=>{
      clientesContainer.innerHTML+=`
        <div class="card">
          <div class="card-body">
            <h4>${c.nome}</h4>
            <p>${c.empresa}</p>
            <p>${c.email}</p>
            <div class="btn-actions">
              <button class="edit" onclick="editarCliente(${c.id})">Editar</button>
              <button class="delete" onclick="excluirCliente(${c.id})">Excluir</button>
            </div>
          </div>
        </div>
      `;
    });
  });
}

function editarCliente(id) {
  const cliente = clientesCache.find(c=>c.id===id);
  criarFormularioCliente(cliente);
}

function carregarReservas() {
  fetch(`${API_URL}/reservas`).then(r=>r.json()).then(data=>{
    reservasContainer.innerHTML='';
    data.forEach(r=>{
      reservasContainer.innerHTML+=`
        <div class="card">
          <div class="card-body">
            <h4>Reserva</h4>
            <p>Espaço: ${r.nome_espaco}</p>
            <p>Cliente: ${r.nome_cliente}</p>
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

// ================== INIT ==================
carregarEspacos();
carregarClientes();
carregarReservas();
