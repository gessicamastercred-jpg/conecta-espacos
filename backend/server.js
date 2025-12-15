const express = require("express");
const { Pool } = require("pg");
const app = express();

// Conexão com o PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Rota padrão
app.get("/", (req, res) => {
  res.json({ status: "API Conecta Espaços rodando 🚀" });
});

// Rota para listar usuários
app.get("/usuarios", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM usuarios"); // mude "usuarios" para sua tabela
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao consultar o banco" });
  }
});

// Rota para listar espaços (exemplo)
app.get("/espacos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM espacos"); // mude "espacos" para sua tabela
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao consultar o banco" });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
