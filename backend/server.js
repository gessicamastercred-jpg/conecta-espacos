// ========================= IMPORTAÇÕES =========================
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

// ========================= CONFIGURAÇÃO =========================
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ========================= BANCO DE DADOS =========================
const pool = new Pool({
  connectionString: 'postgresql://postgres:cRJMCXAKdkDbzqOlSIrfyFSqzYvteUuk@shinkansen.proxy.rlwy.net:42832/railway'
});

async function query(text, params) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}

// Funções para lidar com horários
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
(async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS espacos (
      id SERIAL PRIMARY KEY,
      nome TEXT,
      descricao TEXT,
      tipo TEXT,
      capacidade INTEGER
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS clientes (
      id SERIAL PRIMARY KEY,
      nome TEXT,
      empresa TEXT,
      email TEXT
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS reservas (
      id SERIAL PRIMARY KEY,
      id_espaco INTEGER REFERENCES espacos(id),
      id_cliente INTEGER REFERENCES clientes(id),
      data TEXT,
      horario TEXT
    )
  `);
})();

// ========================= ROTAS =========================

// --- ESPAÇOS ---
app.post('/espacos', async (req, res) => {
  const { nome, descricao, tipo, capacidade } = req.body;
  try {
    const result = await query(
      'INSERT INTO espacos (nome, descricao, tipo, capacidade) VALUES ($1,$2,$3,$4) RETURNING id',
      [nome, descricao, tipo, capacidade]
    );
    res.json({ id: result.rows[0].id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/espacos', async (req, res) => {
  try {
    const result = await query('SELECT * FROM espacos');
    res.json(result.rows);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/espacos/:id', async (req, res) => {
  const { nome, descricao, tipo, capacidade } = req.body;
  try {
    const result = await query(
      'UPDATE espacos SET nome=$1, descricao=$2, tipo=$3, capacidade=$4 WHERE id=$5',
      [nome, descricao, tipo, capacidade, req.params.id]
    );
    res.json({ updated: result.rowCount });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/espacos/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM espacos WHERE id=$1', [req.params.id]);
    res.json({ deleted: result.rowCount });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- CLIENTES ---
app.post('/clientes', async (req, res) => {
  const { nome, empresa, email } = req.body;
  try {
    const result = await query(
      'INSERT INTO clientes (nome, empresa, email) VALUES ($1,$2,$3) RETURNING id',
      [nome, empresa, email]
    );
    res.json({ id: result.rows[0].id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/clientes', async (req, res) => {
  try {
    const result = await query('SELECT * FROM clientes');
    res.json(result.rows);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/clientes/:id', async (req, res) => {
  const { nome, empresa, email } = req.body;
  try {
    const result = await query(
      'UPDATE clientes SET nome=$1, empresa=$2, email=$3 WHERE id=$4',
      [nome, empresa, email, req.params.id]
    );
    res.json({ updated: result.rowCount });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/clientes/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM clientes WHERE id=$1', [req.params.id]);
    res.json({ deleted: result.rowCount });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- RESERVAS ---
app.post('/reservas', async (req, res) => {
  const { id_espaco, id_cliente, data, horario } = req.body;
  const [novoInicio, novoFim] = parseHorario(horario);

  try {
    const { rows: reservas } = await query(
      'SELECT horario FROM reservas WHERE id_espaco=$1 AND data=$2',
      [id_espaco, data]
    );

    if (existeConflito(novoInicio, novoFim, reservas)) {
      return res.status(400).json({ error: 'Conflito de horário para este espaço' });
    }

    const result = await query(
      'INSERT INTO reservas (id_espaco, id_cliente, data, horario) VALUES ($1,$2,$3,$4) RETURNING id',
      [id_espaco, id_cliente, data, horario]
    );

    res.json({ id: result.rows[0].id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/reservas', async (req, res) => {
  try {
    const result = await query(`
      SELECT r.*, e.nome AS nome_espaco, c.nome AS nome_cliente
      FROM reservas r
      JOIN espacos e ON r.id_espaco = e.id
      JOIN clientes c ON r.id_cliente = c.id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/reservas/:id', async (req, res) => {
  const { id_espaco, id_cliente, data, horario } = req.body;
  const [novoInicio, novoFim] = parseHorario(horario);

  try {
    const { rows: reservas } = await query(
      'SELECT horario FROM reservas WHERE id_espaco=$1 AND data=$2 AND id<>$3',
      [id_espaco, data, req.params.id]
    );

    if (existeConflito(novoInicio, novoFim, reservas)) {
      return res.status(400).json({ error: 'Conflito de horário para este espaço' });
    }

    const result = await query(
      'UPDATE reservas SET id_espaco=$1, id_cliente=$2, data=$3, horario=$4 WHERE id=$5',
      [id_espaco, id_cliente, data, horario, req.params.id]
    );

    res.json({ updated: result.rowCount });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/reservas/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM reservas WHERE id=$1', [req.params.id]);
    res.json({ deleted: result.rowCount });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ========================= ROTA PRINCIPAL =========================
app.get('/', (req, res) => {
  res.json({ status: 'API Conecta Espaços rodando 🚀' });
});

// ========================= INICIAR SERVIDOR =========================
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
