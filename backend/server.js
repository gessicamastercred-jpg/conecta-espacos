const express = require("express");
const { Pool } = require("pg");
const path = require("path");
const cors = require("cors");

const app = express();

// ================== CORS (LIBERADO - EMERGÊNCIA) ==================
app.use(cors());
app.options("*", cors());

// ================== CONFIGURAÇÃO ==================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(express.json());

// ================== ROTAS API ==================

// ESPAÇOS
app.get("/espacos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM espacos ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar espaços" });
  }
});

app.post("/espacos", async (req, res) => {
  try {
    const { nome, descricao, tipo, capacidade } = req.body;
    const result = await pool.query(
      "INSERT INTO espacos (nome, descricao, tipo, capacidade) VALUES ($1,$2,$3,$4) RETURNING *",
      [nome, descricao, tipo, capacidade]
    );
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: "Erro ao criar espaço" });
  }
});

app.put("/espacos/:id", async (req, res) => {
  try {
    const { nome, descricao, tipo, capacidade } = req.body;
    await pool.query(
      "UPDATE espacos SET nome=$1, descricao=$2, tipo=$3, capacidade=$4 WHERE id=$5",
      [nome, descricao, tipo, capacidade, req.params.id]
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Erro ao atualizar espaço" });
  }
});

app.delete("/espacos/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM espacos WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Erro ao excluir espaço" });
  }
});

// CLIENTES
app.get("/clientes", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM clientes ORDER BY id");
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Erro ao buscar clientes" });
  }
});

app.post("/clientes", async (req, res) => {
  try {
    const { nome, empresa, email } = req.body;
    const result = await pool.query(
      "INSERT INTO clientes (nome, empresa, email) VALUES ($1,$2,$3) RETURNING *",
      [nome, empresa, email]
    );
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: "Erro ao criar cliente" });
  }
});

app.put("/clientes/:id", async (req, res) => {
  try {
    const { nome, empresa, email } = req.body;
    await pool.query(
      "UPDATE clientes SET nome=$1, empresa=$2, email=$3 WHERE id=$4",
      [nome, empresa, email, req.params.id]
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Erro ao atualizar cliente" });
  }
});

app.delete("/clientes/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM clientes WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Erro ao excluir cliente" });
  }
});

// RESERVAS
app.get("/reservas", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.id, r.data, r.horario,
             e.nome AS nome_espaco,
             c.nome AS nome_cliente,
             r.id_espaco,
             r.id_cliente
      FROM reservas r
      JOIN espacos e ON r.id_espaco = e.id
      JOIN clientes c ON r.id_cliente = c.id
      ORDER BY r.id
    `);
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Erro ao buscar reservas" });
  }
});

app.post("/reservas", async (req, res) => {
  try {
    const { id_espaco, id_cliente, data, horario } = req.body;
    const result = await pool.query(
      "INSERT INTO reservas (id_espaco, id_cliente, data, horario) VALUES ($1,$2,$3,$4) RETURNING *",
      [id_espaco, id_cliente, data, horario]
    );
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: "Erro ao criar reserva" });
  }
});

app.put("/reservas/:id", async (req, res) => {
  try {
    const { id_espaco, id_cliente, data, horario } = req.body;
    await pool.query(
      "UPDATE reservas SET id_espaco=$1, id_cliente=$2, data=$3, horario=$4 WHERE id=$5",
      [id_espaco, id_cliente, data, horario, req.params.id]
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Erro ao atualizar reserva" });
  }
});

app.delete("/reservas/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM reservas WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Erro ao excluir reserva" });
  }
});

// ================== STATIC ==================
app.use(express.static(path.join(__dirname, "..")));

// ================== FRONT ==================
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

// ================== START ==================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
