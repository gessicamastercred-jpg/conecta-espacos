// ================== CONFIG ==================
const API_URL = "https://conecta-espacos-production.up.railway.app";

// ================== VARIÁVEIS ==================
let clientesCache = [];

// ================== SELETORES ==================
const btnNovoEspaco = document.getElementById("btnNovoEspaco");
const btnNovoCliente = document.getElementById("btnNovoCliente");
const btnNovaReserva = document.getElementById("btnNovaReserva");

const espacosContainer = document.getElementById("espacosContainer");
const clientesContainer = document.getElementById("clientesContainer");
const reservasContainer = document.getElementById("reservasContainer");

// ================== EVENTOS ==================
btnNovoEspaco?.addEventListener("click", () => criarFormularioEspaco());
btnNovoCliente?.addEventListener("click", () => criarFormularioCliente());
btnNovaReserva?.addEventListener("click", () => criarFormularioReserva());

// ================== POPUP ==================
function criarPopup(html) {
  fecharPopup();
  const div = document.createElement("div");
  div.className = "form-popup";
  div.innerHTML = html;
  document.body.appendChild(div);
}

function fecharPopup() {
  document.querySelector(".form-popup")?.remove();
}

// ================== FORMULÁRIOS ==================
function criarFormularioEspaco(espaco = {}) {
  criarPopup(`
    <h3>${espaco.id ? "Editar Espaço" : "Novo Espaço"}</h3>
    <input id="nome" placeholder="Nome" value="${espaco.nome || ""}">
    <input id="descricao" placeholder="Descrição" value="${espaco.descricao || ""}">
    <input id="tipo" placeholder="Tipo" value="${espaco.tipo || ""}">
    <input id="capacidade" type="number" placeholder="Capacidade" value="${espaco.capacidade || ""}">
    <button id="btnSalvar">${espaco.id ? "Atualizar" : "Salvar"}</button>
    <button onclick="fecharPopup()">Cancelar</button>
  `);

  document.getElementById("btnSalvar").onclick = () => {
    espaco.id ? atualizarEspaco(espaco.id) : salvarEspaco();
  };
}

function criarFormularioCliente(cliente = {}) {
  criarPopup(`
    <h3>${cliente.id ? "Editar Cliente" : "Novo Cliente"}</h3>
    <input id="nome" placeholder="Nome" value="${cliente.nome || ""}">
    <input id="empresa" placeholder="Empresa" value="${cliente.empresa || ""}">
    <input id="email" placeholder="Email" value="${cliente.email || ""}">
    <button id="btnSalvar">${cliente.id ? "Atualizar" : "Salvar"}</button>
    <button onclick="fecharPopup()">Cancelar</button>
  `);

  document.getElementById("btnSalvar").onclick = () => {
    cliente.id ? atualizarCliente(cliente.id) : salvarCliente();
  };
}

async function criarFormularioReserva(reserva = {}) {
  try {
    const [espacos, clientes] = await Promise.all([
      fetch(`${API_URL}/espacos`).then(r => r.json()),
      fetch(`${API_URL}/clientes`).then(r => r.json())
    ]);

    criarPopup(`
      <h3>${reserva.id ? "Editar Reserva" : "Nova Reserva"}</h3>
      <select id="id_espaco">
        <option value="">Espaço</option>
        ${espacos.map(e => `<option value="${e.id}" ${e.id === reserva.id_espaco ? "selected" : ""}>${e.nome}</option>`).join("")}
      </select>
      <select id="id_cliente">
        <option value="">Cliente</option>
        ${clientes.map(c => `<option value="${c.id}" ${c.id === reserva.id_cliente ? "selected" : ""}>${c.nome}</option>`).join("")}
      </select>
      <input id="data" type="date" value="${reserva.data || ""}">
      <input id="horario" placeholder="Horário" value="${reserva.horario || ""}">
      <button id="btnSalvar">${reserva.id ? "Atualizar" : "Salvar"}</button>
      <button onclick="fecharPopup()">Cancelar</button>
    `);

    document.getElementById("btnSalvar").onclick = () => {
      reserva.id ? atualizarReserva(reserva.id) : salvarReserva();
    };
  } catch {
    alert("Erro ao carregar dados da reserva");
  }
}

// ================== CRUD ==================
async function salvarEspaco() {
  await fetch(`${API_URL}/espacos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome: nome.value,
      descricao: descricao.value,
      tipo: tipo.value,
      capacidade: Number(capacidade.value)
    })
  });
  fecharPopup();
  carregarEspacos();
}

async function atualizarEspaco(id) {
  await fetch(`${API_URL}/espacos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome: nome.value,
      descricao: descricao.value,
      tipo: tipo.value,
      capacidade: Number(capacidade.value)
    })
  });
  fecharPopup();
  carregarEspacos();
}

async function salvarCliente() {
  await fetch(`${API_URL}/clientes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome: nome.value,
      empresa: empresa.value,
      email: email.value
    })
  });
  fecharPopup();
  carregarClientes();
}

async function atualizarCliente(id) {
  await fetch(`${API_URL}/clientes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome: nome.value,
      empresa: empresa.value,
      email: email.value
    })
  });
  fecharPopup();
  carregarClientes();
}

async function salvarReserva() {
  await fetch(`${API_URL}/reservas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id_espaco: Number(id_espaco.value),
      id_cliente: Number(id_cliente.value),
      data: data.value,
      horario: horario.value
    })
  });
  fecharPopup();
  carregarReservas();
}

async function atualizarReserva(id) {
  await fetch(`${API_URL}/reservas/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id_espaco: Number(id_espaco.value),
      id_cliente: Number(id_cliente.value),
      data: data.value,
      horario: horario.value
    })
  });
  fecharPopup();
  carregarReservas();
}

// ================== DELETE ==================
const excluir = (rota, cb) => confirm("Confirmar exclusão?") &&
  fetch(`${API_URL}/${rota}`, { method: "DELETE" }).then(cb);

// ================== LISTAGEM ==================
async function carregarEspacos() {
  const data = await fetch(`${API_URL}/espacos`).then(r => r.json());
  espacosContainer.innerHTML = data.map(e => `
    <div class="card">
      <h4>${e.nome}</h4>
      <p>${e.descricao}</p>
      <button onclick='criarFormularioEspaco(${JSON.stringify(e)})'>Editar</button>
      <button onclick='excluir("espacos/${e.id}", carregarEspacos)'>Excluir</button>
    </div>
  `).join("");
}

async function carregarClientes() {
  clientesCache = await fetch(`${API_URL}/clientes`).then(r => r.json());
  clientesContainer.innerHTML = clientesCache.map(c => `
    <div class="card">
      <h4>${c.nome}</h4>
      <p>${c.email}</p>
      <button onclick='criarFormularioCliente(${JSON.stringify(c)})'>Editar</button>
      <button onclick='excluir("clientes/${c.id}", carregarClientes)'>Excluir</button>
    </div>
  `).join("");
}

async function carregarReservas() {
  const data = await fetch(`${API_URL}/reservas`).then(r => r.json());
  reservasContainer.innerHTML = data.map(r => `
    <div class="card">
      <p>${r.nome_espaco} - ${r.nome_cliente}</p>
      <button onclick='criarFormularioReserva(${JSON.stringify(r)})'>Editar</button>
      <button onclick='excluir("reservas/${r.id}", carregarReservas)'>Excluir</button>
    </div>
  `).join("");
}

// ================== INIT ==================
carregarEspacos();
carregarClientes();
carregarReservas();
