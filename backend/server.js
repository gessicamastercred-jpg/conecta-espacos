const express = require("express");
const { Pool } = require("pg");
const path = require("path");
const app = express();

// Conexão com o PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Serve arquivos estáticos da raiz (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "..")));

// Rota padrão (index.html)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
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

// Qualquer outra rota envia o index.html (para frontend "single page")
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

// Iniciar servidor
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
