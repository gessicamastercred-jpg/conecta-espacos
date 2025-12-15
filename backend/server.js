// ========================= IMPORTAÇÕES =========================
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// ========================= CONFIGURAÇÃO =========================
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// ========================= BANCO DE DADOS =========================
const db = new sqlite3.Database(path.join(__dirname, 'database.db'));

function parseHorario(horario) {
  const [inicio, fim] = horario.replace(/\s/g, '').split('-');
  const [hi, mi] = inicio.split(':').map(Number);
  const [hf, mf] = fim.split(':').map(Number);
  return [hi * 60 + mi, hf * 60 + mf];
}

function existeConflito(novoInicio, novoFim, reservas) {
  return reservas.some(r => {
    const [inicio, fim] = parseHorario(r.horario);
    return novoInicio < fim && novoFim > inicio;
  });
}

// ========================= CRIAÇÃO DAS TABELAS =========================
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS espacos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    descricao TEXT,
    tipo TEXT,
    capacidade INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    empresa TEXT,
    email TEXT
  )`);

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

// ========================= ROTAS =========================

// --- ESPAÇOS ---
app.post('/espacos', (req, res) => {
  const { nome, descricao, tipo, capacidade } = req.body;
  db.run(`INSERT INTO espacos (nome, descricao, tipo, capacidade) VALUES (?, ?, ?, ?)`,
    [nome, descricao, tipo, capacidade],
    function(err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.get('/espacos', (req, res) => {
  db.all(`SELECT * FROM espacos`, [], (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(rows);
  });
});

app.put('/espacos/:id', (req, res) => {
  const { nome, descricao, tipo, capacidade } = req.body;
  db.run(`UPDATE espacos SET nome=?, descricao=?, tipo=?, capacidade=? WHERE id=?`,
    [nome, descricao, tipo, capacidade, req.params.id],
    function(err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

app.delete('/espacos/:id', (req, res) => {
  db.run(`DELETE FROM espacos WHERE id=?`, [req.params.id], function(err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// --- CLIENTES ---
app.post('/clientes', (req, res) => {
  const { nome, empresa, email } = req.body;
  db.run(`INSERT INTO clientes (nome, empresa, email) VALUES (?, ?, ?)`,
    [nome, empresa, email],
    function(err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.get('/clientes', (req, res) => {
  db.all(`SELECT * FROM clientes`, [], (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(rows);
  });
});

app.put('/clientes/:id', (req, res) => {
  const { nome, empresa, email } = req.body;
  db.run(`UPDATE clientes SET nome=?, empresa=?, email=? WHERE id=?`,
    [nome, empresa, email, req.params.id],
    function(err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

app.delete('/clientes/:id', (req, res) => {
  db.run(`DELETE FROM clientes WHERE id=?`, [req.params.id], function(err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// --- RESERVAS ---
app.post('/reservas', (req, res) => {
  const { id_espaco, id_cliente, data, horario } = req.body;
  const [novoInicio, novoFim] = parseHorario(horario);

  db.all(`SELECT horario FROM reservas WHERE id_espaco=? AND data=?`, [id_espaco, data], (err, reservas) => {
    if (err) return res.status(400).json({ error: err.message });
    if (existeConflito(novoInicio, novoFim, reservas)) {
      return res.status(400).json({ error: 'Conflito de horário para este espaço' });
    }
    db.run(`INSERT INTO reservas (id_espaco, id_cliente, data, horario) VALUES (?, ?, ?, ?)`,
      [id_espaco, id_cliente, data, horario],
      function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ id: this.lastID });
      }
    );
  });
});

app.get('/reservas', (req, res) => {
  db.all(`SELECT r.*, e.nome AS nome_espaco, c.nome AS nome_cliente
          FROM reservas r
          JOIN espacos e ON r.id_espaco = e.id
          JOIN clientes c ON r.id_cliente = c.id`,
          [],
          (err, rows) => {
            if (err) return res.status(400).json({ error: err.message });
            res.json(rows);
          });
});

app.put('/reservas/:id', (req, res) => {
  const { id_espaco, id_cliente, data, horario } = req.body;
  const [novoInicio, novoFim] = parseHorario(horario);

  db.all(`SELECT horario FROM reservas WHERE id_espaco=? AND data=? AND id<>?`, [id_espaco, data, req.params.id], (err, reservas) => {
    if (err) return res.status(400).json({ error: err.message });
    if (existeConflito(novoInicio, novoFim, reservas)) {
      return res.status(400).json({ error: 'Conflito de horário para este espaço' });
    }
    db.run(`UPDATE reservas SET id_espaco=?, id_cliente=?, data=?, horario=? WHERE id=?`,
      [id_espaco, id_cliente, data, horario, req.params.id],
      function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ updated: this.changes });
      }
    );
  });
});

app.delete('/reservas/:id', (req, res) => {
  db.run(`DELETE FROM reservas WHERE id=?`, [req.params.id], function(err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// ========================= ROTA PRINCIPAL =========================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ========================= INICIAR SERVIDOR =========================
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
