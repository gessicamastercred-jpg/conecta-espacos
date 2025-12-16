const express = require("express");
const { Pool } = require("pg");
const path = require("path");
const cors = require("cors");

const app = express();

// ================== CORS ==================
app.use(cors());
app.use(express.json());

// ================== BANCO DE DADOS ==================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ================== ESPAÇOS ==================
app.get("/espacos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM espacos ORDER BY id");
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Erro ao buscar espaços" });
  }
});

app.post("/espacos", async (req, res) => {
  const { nome, descricao, tipo, capacidade } = req.body;
  try {
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
  const { nome, descricao, tipo, capacidade } = req.body;
  try {
    const result = await pool.query(
      "UPDATE espacos SET nome=$1, descricao=$2, tipo=$3, capacidade=$4 WHERE id=$5 RETURNING *",
      [nome, descricao, tipo, capacidade, req.params.id]
    );
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: "Erro ao atualizar espaço" });
  }
});

app.delete("/espacos/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM espacos WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Erro ao deletar espaço" });
  }
});

// ================== CLIENTES ==================
app.get("/clientes", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM clientes ORDER BY id");
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Erro ao buscar clientes" });
  }
});

app.post("/clientes", async (req, res) => {
  const { nome, empresa, email } = req.body;
  try {
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
  const { nome, empresa, email } = req.body;
  try {
    const result = await pool.query(
      "UPDATE clientes SET nome=$1, empresa=$2, email=$3 WHERE id=$4 RETURNING *",
      [nome, empresa, email, req.params.id]
    );
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: "Erro ao atualizar cliente" });
  }
});

app.delete("/clientes/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM clientes WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Erro ao deletar cliente" });
  }
});

// ================== RESERVAS (CONFLITO REAL) ==================
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
      ORDER BY r.data, r.horario
    `);
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Erro ao buscar reservas" });
  }
});

app.post("/reservas", async (req, res) => {
  const { id_espaco, id_cliente, data, horario } = req.body;

  try {
    const [inicioNovo, fimNovo] = horario.split("-");

    const conflito = await pool.query(
      `
      SELECT 1
      FROM reservas
      WHERE id_espaco = $1
        AND data = $2
        AND (
          $3::time < split_part(horario, '-', 2)::time
          AND
          $4::time > split_part(horario, '-', 1)::time
        )
      `,
      [id_espaco, data, inicioNovo, fimNovo]
    );

    if (conflito.rows.length > 0) {
      return res.status(400).json({
        error: "Conflito de horário: o espaço já está reservado nesse período."
      });
    }

    const result = await pool.query(
      "INSERT INTO reservas (id_espaco, id_cliente, data, horario) VALUES ($1,$2,$3,$4) RETURNING *",
      [id_espaco, id_cliente, data, horario]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar reserva" });
  }
});

app.put("/reservas/:id", async (req, res) => {
  const { id_espaco, id_cliente, data, horario } = req.body;
  try {
    const result = await pool.query(
      "UPDATE reservas SET id_espaco=$1, id_cliente=$2, data=$3, horario=$4 WHERE id=$5 RETURNING *",
      [id_espaco, id_cliente, data, horario, req.params.id]
    );
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: "Erro ao atualizar reserva" });
  }
});

app.delete("/reservas/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM reservas WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Erro ao deletar reserva" });
  }
});

// ================== FRONTEND ==================
app.use(express.static(path.join(__dirname, "..")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

// ================== START ==================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
