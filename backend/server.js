const express = require("express");
const { Pool } = require("pg");
const path = require("path");
const app = express();

// ================== MIDDLEWARE ==================
app.use(express.json()); // Para aceitar JSON no body
app.use(express.static(path.join(__dirname, ".."))); // Servir HTML/CSS/JS

// ================== CONEXÃO COM POSTGRES ==================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ================== ROTAS ==================

// Rota padrão
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

// LISTAR
app.get("/clientes", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM clientes");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/espacos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM espacos");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/reservas", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.id, r.id_espaco, r.id_cliente, r.data, r.horario,
             e.nome AS nome_espaco, c.nome AS nome_cliente
      FROM reservas r
      JOIN espacos e ON r.id_espaco = e.id
      JOIN clientes c ON r.id_cliente = c.id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CRIAR
app.post("/clientes", async (req, res) => {
  const { nome, empresa, email } = req.body;
  try {
    await pool.query(
      "INSERT INTO clientes (nome, empresa, email) VALUES ($1, $2, $3)",
      [nome, empresa, email]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/espacos", async (req, res) => {
  const { nome, descricao, tipo, capacidade } = req.body;
  try {
    await pool.query(
      "INSERT INTO espacos (nome, descricao, tipo, capacidade) VALUES ($1, $2, $3, $4)",
      [nome, descricao, tipo, capacidade]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/reservas", async (req, res) => {
  const { id_espaco, id_cliente, data, horario } = req.body;
  try {
    await pool.query(
      "INSERT INTO reservas (id_espaco, id_cliente, data, horario) VALUES ($1, $2, $3, $4)",
      [id_espaco, id_cliente, data, horario]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ATUALIZAR
app.put("/clientes/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, empresa, email } = req.body;
  try {
    await pool.query(
      "UPDATE clientes SET nome=$1, empresa=$2, email=$3 WHERE id=$4",
      [nome, empresa, email, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/espacos/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, descricao, tipo, capacidade } = req.body;
  try {
    await pool.query(
      "UPDATE espacos SET nome=$1, descricao=$2, tipo=$3, capacidade=$4 WHERE id=$5",
      [nome, descricao, tipo, capacidade, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/reservas/:id", async (req, res) => {
  const { id } = req.params;
  const { id_espaco, id_cliente, data, horario } = req.body;
  try {
    await pool.query(
      "UPDATE reservas SET id_espaco=$1, id_cliente=$2, data=$3, horario=$4 WHERE id=$5",
      [id_espaco, id_cliente, data, horario, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// EXCLUIR
app.delete("/clientes/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM clientes WHERE id=$1", [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/espacos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM espacos WHERE id=$1", [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/reservas/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM reservas WHERE id=$1", [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================== INICIAR SERVIDOR ==================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
