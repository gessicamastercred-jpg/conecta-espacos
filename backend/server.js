// ========================= IMPORTAÇÕES =========================
// Importa o framework Express para criar o servidor e as rotas
const express = require('express');

// Importa o CORS para permitir que o front-end acesse a API
const cors = require('cors');

// Importa o body-parser para ler dados enviados em JSON
const bodyParser = require('body-parser');

// Importa o SQLite3 para trabalhar com banco de dados local
const sqlite3 = require('sqlite3').verbose();

// Importa o path para trabalhar com caminhos de arquivos
const path = require('path');


// ========================= CONFIGURAÇÃO =========================

// Cria a aplicação Express
const app = express();

// Define a porta onde o servidor vai rodar
const PORT = 3000;

// Permite requisições de outros endereços (front-end)
app.use(cors());

// Permite que o servidor entenda JSON enviado pelo front
app.use(bodyParser.json());

// Define a pasta do front-end como pública
app.use(express.static(path.join(__dirname, '../frontend')));


// ========================= BANCO DE DADOS =========================

// Cria (ou abre) o banco de dados SQLite
const db = new sqlite3.Database(path.join(__dirname, 'database.db'));

// Função que transforma um horário (ex: "08:00-10:00")
// em minutos para facilitar comparação
function parseHorario(horario) {
  const [inicio, fim] = horario.replace(/\s/g, '').split('-');
  const [hi, mi] = inicio.split(':').map(Number);
  const [hf, mf] = fim.split(':').map(Number);
  return [hi * 60 + mi, hf * 60 + mf];
}

// Função que verifica se existe conflito de horário
// Retorna true se houver conflito
function existeConflito(novoInicio, novoFim, reservas) {
  return reservas.some(r => {
    const [inicio, fim] = parseHorario(r.horario);
    return novoInicio < fim && novoFim > inicio;
  });
}


// ========================= CRIAÇÃO DAS TABELAS =========================

// Executa os comandos em sequência
db.serialize(() => {

  // Tabela de espaços disponíveis para locação
  db.run(`CREATE TABLE IF NOT EXISTS espacos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    descricao TEXT,
    tipo TEXT,
    capacidade INTEGER
  )`);

  // Tabela de clientes
  db.run(`CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    empresa TEXT,
    email TEXT
  )`);

  // Tabela de reservas (relacionada a espaços e clientes)
  db.run(`CREATE TABLE IF NOT EXISTS reservas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_espaco INTEGER,
    id_cliente INTEGER,
    data TEXT,
    horario TEXT,
    FOREIGN KEY(id_espaco) REFERENCES espacos(id),
    FOREIGN KEY(id_cliente) REFERENCES clientes(id)
  )`);
});


// ========================= ROTAS DE ESPAÇOS =========================

// Rota para cadastrar um novo espaço
app.post('/espacos', (req, res) => {
  const { nome, descricao, tipo, capacidade } = req.body;

  db.run(
    `INSERT INTO espacos (nome, descricao, tipo, capacidade) VALUES (?, ?, ?, ?)`,
    [nome, descricao, tipo, capacidade],
    function(err) {
      if (err) return res.status(400).json({ error: err.message });

      // Retorna o ID do espaço criado
      res.json({ id: this.lastID });
    }
  );
});

// Rota para listar todos os espaços
app.get('/espacos', (req, res) => {
  db.all(`SELECT * FROM espacos`, [], (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(rows);
  });
});

// Rota para atualizar um espaço existente
app.put('/espacos/:id', (req, res) => {
  const { nome, descricao, tipo, capacidade } = req.body;

  db.run(
    `UPDATE espacos SET nome=?, descricao=?, tipo=?, capacidade=? WHERE id=?`,
    [nome, descricao, tipo, capacidade, req.params.id],
    function(err) {
      if (err) return res.status(400).json({ error: err.message });

      // Retorna quantos registros foram atualizados
      res.json({ updated: this.changes });
    }
  );
});

// Rota para excluir um espaço
app.delete('/espacos/:id', (req, res) => {
  db.run(
    `DELETE FROM espacos WHERE id=?`,
    [req.params.id],
    function(err) {
      if (err) return res.status(400).json({ error: err.message });

      // Retorna quantos registros foram excluídos
      res.json({ deleted: this.changes });
    }
  );
});


// ========================= ROTAS DE CLIENTES =========================

// Rota para cadastrar um cliente
app.post('/clientes', (req, res) => {
  const { nome, empresa, email } = req.body;

  db.run(
    `INSERT INTO clientes (nome, empresa, email) VALUES (?, ?, ?)`,
    [nome, empresa, email],
    function(err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// Rota para listar clientes
app.get('/clientes', (req, res) => {
  db.all(`SELECT * FROM clientes`, [], (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(rows);
  });
});

// Rota para atualizar cliente
app.put('/clientes/:id', (req, res) => {
  const { nome, empresa, email } = req.body;

  db.run(
    `UPDATE clientes SET nome=?, empresa=?, email=? WHERE id=?`,
    [nome, empresa, email, req.params.id],
    function(err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

// Rota para excluir cliente
app.delete('/clientes/:id', (req, res) => {
  db.run(
    `DELETE FROM clientes WHERE id=?`,
    [req.params.id],
    function(err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ deleted: this.changes });
    }
  );
});


// ========================= ROTAS DE RESERVAS =========================

// Rota para criar uma nova reserva com verificação de conflito
app.post('/reservas', (req, res) => {
  const { id_espaco, id_cliente, data, horario } = req.body;

  // Converte o horário em minutos
  const [novoInicio, novoFim] = parseHorario(horario);

  // Busca reservas do mesmo espaço e data
  db.all(
    `SELECT horario FROM reservas WHERE id_espaco=? AND data=?`,
    [id_espaco, data],
    (err, reservas) => {
      if (err) return res.status(400).json({ error: err.message });

      // Verifica se existe conflito
      if (existeConflito(novoInicio, novoFim, reservas)) {
        return res.status(400).json({ error: 'Conflito de horário para este espaço' });
      }

      // Insere a reserva se não houver conflito
      db.run(
        `INSERT INTO reservas (id_espaco, id_cliente, data, horario) VALUES (?, ?, ?, ?)`,
        [id_espaco, id_cliente, data, horario],
        function(err) {
          if (err) return res.status(400).json({ error: err.message });
          res.json({ id: this.lastID });
        }
      );
    }
  );
});

// Rota para listar reservas com nome do espaço e do cliente
app.get('/reservas', (req, res) => {
  db.all(
    `
    SELECT r.*, e.nome AS nome_espaco, c.nome AS nome_cliente
    FROM reservas r
    JOIN espacos e ON r.id_espaco = e.id
    JOIN clientes c ON r.id_cliente = c.id
    `,
    [],
    (err, rows) => {
      if (err) return res.status(400).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Rota para atualizar reserva
app.put('/reservas/:id', (req, res) => {
  const { id_espaco, id_cliente, data, horario } = req.body;
  const [novoInicio, novoFim] = parseHorario(horario);

  // Busca outras reservas do mesmo espaço/data
  db.all(
    `SELECT horario FROM reservas WHERE id_espaco=? AND data=? AND id<>?`,
    [id_espaco, data, req.params.id],
    (err, reservas) => {
      if (err) return res.status(400).json({ error: err.message });

      if (existeConflito(novoInicio, novoFim, reservas)) {
        return res.status(400).json({ error: 'Conflito de horário para este espaço' });
      }

      db.run(
        `UPDATE reservas SET id_espaco=?, id_cliente=?, data=?, horario=? WHERE id=?`,
        [id_espaco, id_cliente, data, horario, req.params.id],
        function(err) {
          if (err) return res.status(400).json({ error: err.message });
          res.json({ updated: this.changes });
        }
      );
    }
  );
});

// Rota para excluir reserva
app.delete('/reservas/:id', (req, res) => {
  db.run(
    `DELETE FROM reservas WHERE id=?`,
    [req.params.id],
    function(err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ deleted: this.changes });
    }
  );
});


// ========================= ROTA PRINCIPAL =========================

// Retorna o arquivo index.html do front-end
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});


// ========================= INICIAR SERVIDOR =========================

// Inicia o servidor na porta definida
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
