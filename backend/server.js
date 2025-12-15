const express = require("express");
const { Pool } = require("pg");
const path = require("path");
const app = express();

// ================== CONFIGURAÇÃO DO POSTGRES ==================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ================== MIDDLEWARE ==================
app.use(express.json()); // para req.body JSON
app.use(express.static(path.join(__dirname, ".."))); // serve HTML/CSS/JS

// ================== ROTAS FRONTEND ==================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

// ================== ROTAS BACKEND ==================
// --------- ESPAÇOS ---------
app.get("/espacos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM espacos");
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/espacos", async (req, res) => {
  const { nome, descricao, tipo, capacidade } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO espacos (nome, descricao, tipo, capacidade) VALUES ($1,$2,$3,$4) RETURNING *",
      [nome, descricao, tipo, capacidade]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put("/espacos/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, descricao, tipo, capacidade } = req.body;
  try {
    const result = await pool.query(
      "UPDATE espacos SET nome=$1, descricao=$2, tipo=$3, capacidade=$4 WHERE id=$5 RETURNING *",
      [nome, descricao, tipo, capacidade, id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/espacos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM espacos WHERE id=$1", [id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --------- CLIENTES ---------
app.get("/clientes", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM clientes");
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/clientes", async (req, res) => {
  const { nome, empresa, email } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO clientes (nome, empresa, email) VALUES ($1,$2,$3) RETURNING *",
      [nome, empresa, email]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put("/clientes/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, empresa, email } = req.body;
  try {
    const result = await pool.query(
      "UPDATE clientes SET nome=$1, empresa=$2, email=$3 WHERE id=$4 RETURNING *",
      [nome, empresa, email, id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/clientes/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM clientes WHERE id=$1", [id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --------- RESERVAS ---------
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
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/reservas", async (req, res) => {
  const { id_espaco, id_cliente, data, horario } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO reservas (id_espaco, id_cliente, data, horario) VALUES ($1,$2,$3,$4) RETURNING *",
      [id_espaco, id_cliente, data, horario]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put("/reservas/:id", async (req, res) => {
  const { id } = req.params;
  const { id_espaco, id_cliente, data, horario } = req.body;
  try {
    const result = await pool.query(
      "UPDATE reservas SET id_espaco=$1, id_cliente=$2, data=$3, horario=$4 WHERE id=$5 RETURNING *",
      [id_espaco, id_cliente, data, horario, id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/reservas/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM reservas WHERE id=$1", [id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ================== INICIAR SERVIDOR ==================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
