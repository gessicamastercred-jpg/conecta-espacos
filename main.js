// ================== VARIÁVEIS GLOBAIS ==================

// Cache local para armazenar clientes já carregados
// Evita novas requisições desnecessárias
let clientesCache = [];

// URL base da API (back-end)
const API_URL = 'https://conecta-espacos-production.up.railway.app';



// ================== SELETORES ==================

// Botões principais do sistema
const btnNovoEspaco = document.getElementById('btnNovoEspaco');
const btnNovoCliente = document.getElementById('btnNovoCliente');
const btnNovaReserva = document.getElementById('btnNovaReserva');

// Containers onde os cards serão renderizados
const espacosContainer = document.getElementById('espacosContainer');
const clientesContainer = document.getElementById('clientesContainer');
const reservasContainer = document.getElementById('reservasContainer');


// ================== EVENTOS ==================

// Evento para abrir formulário de novo espaço
btnNovoEspaco?.addEventListener('click', () => criarFormularioEspaco());

// Evento para abrir formulário de novo cliente
btnNovoCliente?.addEventListener('click', () => criarFormularioCliente());

// Evento para abrir formulário de nova reserva
btnNovaReserva?.addEventListener('click', () => criarFormularioReserva());


// ================== POPUP ==================

// Cria um popup genérico para formulários
function criarPopup(html) {
  // Fecha qualquer popup aberto antes
  fecharPopup();

  // Cria uma div para o popup
  const div = document.createElement('div');
  div.className = 'form-popup';

  // Insere o HTML do formulário
  div.innerHTML = html;

  // Adiciona o popup ao body
  document.body.appendChild(div);
}

// Fecha o popup removendo do DOM
function fecharPopup() {
  document.querySelector('.form-popup')?.remove();
}


// ================== FORMULÁRIOS ==================

// Formulário de criação/edição de espaço
function criarFormularioEspaco(espaco = {}) {
  criarPopup(`
    <h3>${espaco.id ? 'Editar Espaço' : 'Novo Espaço'}</h3>

    <input id="nome" placeholder="Nome" value="${espaco.nome || ''}">
    <input id="descricao" placeholder="Descrição" value="${espaco.descricao || ''}">
    <input id="tipo" placeholder="Tipo (sala,auditório,coworking,etc)" value="${espaco.tipo || ''}">
    <input id="capacidade" type="number" placeholder="Capacidade" value="${espaco.capacidade || ''}">

    <button onclick="${espaco.id ? `atualizarEspaco(${espaco.id})` : 'salvarEspaco()'}">
      Salvar
    </button>

    <button onclick="fecharPopup()">Cancelar</button>
  `);
}

// Formulário de criação/edição de cliente
function criarFormularioCliente(cliente = {}) {
  criarPopup(`
    <h3>${cliente.id ? 'Editar Cliente' : 'Novo Cliente'}</h3>

    <input id="nome" placeholder="Nome" value="${cliente.nome || ''}">
    <input id="empresa" placeholder="Empresa" value="${cliente.empresa || ''}">
    <input id="email" placeholder="Email" value="${cliente.email || ''}">

    <button onclick="${cliente.id ? `atualizarCliente(${cliente.id})` : 'salvarCliente()'}">
      Salvar
    </button>

    <button onclick="fecharPopup()">Cancelar</button>
  `);
}

// Formulário de criação/edição de reserva
async function criarFormularioReserva(reserva = {}) {

  // Busca espaços disponíveis na API
  const espacos = await fetch(`${API_URL}/espacos`).then(r => r.json());

  // Busca clientes cadastrados na API
  const clientes = await fetch(`${API_URL}/clientes`).then(r => r.json());

  criarPopup(`
    <h3>${reserva.id ? 'Editar Reserva' : 'Nova Reserva'}</h3>

    <!-- Select de espaços -->
    <select id="id_espaco">
      <option value="">Selecione o Espaço</option>
      ${espacos.map(e => `
        <option value="${e.id}" ${e.id === reserva.id_espaco ? 'selected' : ''}>
          ${e.nome}
        </option>
      `).join('')}
    </select>

    <!-- Select de clientes -->
    <select id="id_cliente">
      <option value="">Selecione o Cliente</option>
      ${clientes.map(c => `
        <option value="${c.id}" ${c.id === reserva.id_cliente ? 'selected' : ''}>
          ${c.nome}
        </option>
      `).join('')}
    </select>

    <!-- Data da reserva -->
    <input id="data" type="date" value="${reserva.data || ''}">

    <!-- Horário da reserva -->
    <input id="horario" placeholder="Horário (HH:MM-HH:MM)" value="${reserva.horario || ''}">

    <button onclick="${reserva.id ? `atualizarReserva(${reserva.id})` : 'salvarReserva()'}">
      Salvar
    </button>

    <button onclick="fecharPopup()">Cancelar</button>
  `);
}


// ================== SALVAR ==================

// Envia novo espaço para a API
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
  }).then(() => {
    fecharPopup();
    carregarEspacos();
  });
}

// Envia novo cliente para a API
function salvarCliente() {
  fetch(`${API_URL}/clientes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: nome.value,
      empresa: empresa.value,
      email: email.value
    })
  }).then(() => {
    fecharPopup();
    carregarClientes();
  });
}

// Envia nova reserva para a API
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

    // Caso a API retorne erro (ex: conflito de horário)
    if (data.error) {
      alert(data.error);
      return;
    }

    fecharPopup();
    carregarReservas();

    // Atualiza a agenda automaticamente, se existir
    if (typeof carregarAgenda === 'function') {
      carregarAgenda();
    }
  });
}


// ================== ATUALIZAR ==================

// Atualiza espaço existente
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
  }).then(() => {
    fecharPopup();
    carregarEspacos();
  });
}

// Atualiza cliente existente
function atualizarCliente(id) {
  fetch(`${API_URL}/clientes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: nome.value,
      empresa: empresa.value,
      email: email.value
    })
  }).then(() => {
    fecharPopup();
    carregarClientes();
  });
}

// Atualiza reserva existente
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
  }).then(() => {
    fecharPopup();
    carregarReservas();
  });
}


// ================== EXCLUIR ==================

// Exclui espaço após confirmação
function excluirEspaco(id) {
  if (confirm('Excluir espaço?')) {
    fetch(`${API_URL}/espacos/${id}`, { method: 'DELETE' })
      .then(() => carregarEspacos());
  }
}

// Exclui cliente após confirmação
function excluirCliente(id) {
  if (confirm('Excluir cliente?')) {
    fetch(`${API_URL}/clientes/${id}`, { method: 'DELETE' })
      .then(() => carregarClientes());
  }
}

// Exclui reserva após confirmação
function excluirReserva(id) {
  if (confirm('Excluir reserva?')) {
    fetch(`${API_URL}/reservas/${id}`, { method: 'DELETE' })
      .then(() => carregarReservas());
  }
}


// ================== LISTAGEM ==================

// Carrega e renderiza espaços
function carregarEspacos() {
  fetch(`${API_URL}/espacos`)
    .then(r => r.json())
    .then(data => {
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
          <button class="edit" onclick='criarFormularioEspaco(${JSON.stringify(e)})'>
            Editar
          </button>
          <button class="delete" onclick='excluirEspaco(${e.id})'>
            Excluir
          </button>
        </div>
      </div>
    </div>
  `;
});


    });
}

// Carrega e renderiza clientes
function carregarClientes() {
  fetch(`${API_URL}/clientes`)
    .then(res => res.json())
    .then(data => {

      // Atualiza o cache de clientes
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
                <button class="edit" onclick="editarCliente(${c.id})">
                  Editar
                </button>
                <button class="delete" onclick="excluirCliente(${c.id})">
                  Excluir
                </button>
              </div>
            </div>
          </div>
        `;
      });
    });
}

// Busca cliente no cache e abre formulário de edição
function editarCliente(id) {
  const cliente = clientesCache.find(c => c.id === id);
  criarFormularioCliente(cliente);
}

// Carrega e renderiza reservas
function carregarReservas() {
  fetch(`${API_URL}/reservas`)
    .then(r => r.json())
    .then(data => {
      reservasContainer.innerHTML = '';

      data.forEach(r => {
  reservasContainer.innerHTML += `
    <div class="card">
      <div class="card-body">
        <h4>Reserva</h4>
        <p>Espaço: ${r.nome_espaco}</p>
        <p>Cliente: ${r.nome_cliente}</p>

        <div class="btn-actions">
          <button class="edit" onclick='criarFormularioReserva(${JSON.stringify(r)})'>
            Editar
          </button>
          <button class="delete" onclick='excluirReserva(${r.id})'>
            Excluir
          </button>
        </div>
      </div>
    </div>
  `;
});

    });
}

// Carrega a agenda em formato de tabela
function carregarAgenda() {
  fetch(`${API_URL}/reservas`)
    .then(res => res.json())
    .then(data => {
      const tbody = document.querySelector('#agendaTable tbody');
      if (!tbody) return;

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

// Carrega tudo ao iniciar a aplicação
carregarEspacos();
carregarClientes();
carregarReservas();
carregarAgenda();
