const express = require("express");
const { Pool } = require("pg");
const path = require("path");
const cors = require("cors");

const app = express();

// ================== CORS (PRIMEIRO DE TUDO) ==================
app.use(cors({
  origin: "https://conecta-espacos-production-ebea.up.railway.app",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));

app.options("*", cors());

// ================== CONFIGURAÇÃO ==================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(express.json());

// ================== ROTAS API (ANTES DO STATIC) ==================
app.get("/espacos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM espacos");
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Erro ao buscar espaços" });
  }
});

app.get("/clientes", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM clientes");
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Erro ao buscar clientes" });
  }
});

app.get("/reservas", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.id, r.data, r.horario, 
             e.nome AS nome_espaco, 
             c.nome AS nome_cliente
      FROM reservas r
      JOIN espacos e ON r.id_espaco = e.id
      JOIN clientes c ON r.id_cliente = c.id
    `);
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Erro ao buscar reservas" });
  }
});

// ================== POST ==================
app.post("/espacos", async (req, res) => {
  const { nome, descricao, tipo, capacidade } = req.body;
  const result = await pool.query(
    "INSERT INTO espacos (nome, descricao, tipo, capacidade) VALUES ($1,$2,$3,$4) RETURNING *",
    [nome, descricao, tipo, capacidade]
  );
  res.json(result.rows[0]);
});

// (clientes, reservas iguais – mantêm)

// ================== STATIC (DEPOIS DA API) ==================
app.use(express.static(path.join(__dirname, "..")));

// ================== PÁGINAS ==================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

// ⚠️ wildcard APENAS PARA PÁGINAS
app.get(/^\/(?!espacos|clientes|reservas).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

// ================== START ==================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
  console.log(`Servidor rodando na porta ${PORT}`)
);
