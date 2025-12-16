import express from 'express';
import cors from 'cors';
import pkg from 'pg';

const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

// ================== BANCO ==================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// ================== ESPAÇOS ==================
app.get('/espacos', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM espacos ORDER BY id');
  res.json(rows);
});

app.post('/espacos', async (req, res) => {
  const { nome, descricao, tipo, capacidade } = req.body;
  await pool.query(
    'INSERT INTO espacos (nome, descricao, tipo, capacidade) VALUES ($1,$2,$3,$4)',
    [nome, descricao, tipo, capacidade]
  );
  res.sendStatus(201);
});

app.put('/espacos/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, descricao, tipo, capacidade } = req.body;
  await pool.query(
    'UPDATE espacos SET nome=$1, descricao=$2, tipo=$3, capacidade=$4 WHERE id=$5',
    [nome, descricao, tipo, capacidade, id]
  );
  res.sendStatus(200);
});

app.delete('/espacos/:id', async (req, res) => {
  await pool.query('DELETE FROM espacos WHERE id=$1', [req.params.id]);
  res.sendStatus(200);
});

// ================== CLIENTES ==================
app.get('/clientes', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM clientes ORDER BY id');
  res.json(rows);
});

app.post('/clientes', async (req, res) => {
  const { nome, empresa, email } = req.body;
  await pool.query(
    'INSERT INTO clientes (nome, empresa, email) VALUES ($1,$2,$3)',
    [nome, empresa, email]
  );
  res.sendStatus(201);
});

app.put('/clientes/:id', async (req, res) => {
  const { nome, empresa, email } = req.body;
  await pool.query(
    'UPDATE clientes SET nome=$1, empresa=$2, email=$3 WHERE id=$4',
    [nome, empresa, email, req.params.id]
  );
  res.sendStatus(200);
});

app.delete('/clientes/:id', async (req, res) => {
  await pool.query('DELETE FROM clientes WHERE id=$1', [req.params.id]);
  res.sendStatus(200);
});

// ================== RESERVAS ==================
app.get('/reservas', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT r.id, r.data, r.horario,
           e.nome AS nome_espaco,
           c.nome AS nome_cliente
    FROM reservas r
    JOIN espacos e ON r.id_espaco = e.id
    JOIN clientes c ON r.id_cliente = c.id
    ORDER BY r.data
  `);
  res.json(rows);
});

app.post('/reservas', async (req, res) => {
  const { isadmin } = req.headers;
  if (isadmin !== 'true') {
    return res.status(403).json({ error: 'Apenas administradores podem criar reservas.' });
  }

  const { id_espaco, id_cliente, data, horario } = req.body;

  // 🔒 CONFLITO DE HORÁRIO
  const conflito = await pool.query(
    `SELECT * FROM reservas
     WHERE id_espaco = $1
       AND data = $2
       AND horario = $3`,
    [id_espaco, data, horario]
  );

  if (conflito.rows.length > 0) {
    return res.status(400).json({
      error: 'Este espaço já está reservado neste horário.'
    });
  }

  await pool.query(
    'INSERT INTO reservas (id_espaco, id_cliente, data, horario) VALUES ($1,$2,$3,$4)',
    [id_espaco, id_cliente, data, horario]
  );

  res.sendStatus(201);
});

app.put('/reservas/:id', async (req, res) => {
  const { id_espaco, id_cliente, data, horario } = req.body;
  await pool.query(
    'UPDATE reservas SET id_espaco=$1, id_cliente=$2, data=$3, horario=$4 WHERE id=$5',
    [id_espaco, id_cliente, data, horario, req.params.id]
  );
  res.sendStatus(200);
});

app.delete('/reservas/:id', async (req, res) => {
  await pool.query('DELETE FROM reservas WHERE id=$1', [req.params.id]);
  res.sendStatus(200);
});

// ================== SERVER ==================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Servidor rodando na porta', PORT);
});
