// ======================================================
// IMPORTAÇÕES
// ======================================================

// Importa a biblioteca SQLite para trabalhar com banco de dados local
// O método verbose() faz o SQLite mostrar mensagens mais detalhadas de erro
const sqlite3 = require('sqlite3').verbose();

// Biblioteca nativa do Node.js para trabalhar com caminhos de arquivos
// Usamos isso para evitar problemas entre Windows, Linux e Mac
const path = require('path');


// ======================================================
// CONFIGURAÇÃO DO BANCO DE DADOS
// ======================================================

// Define o caminho completo até o arquivo database.db
// __dirname representa a pasta atual onde este arquivo está (backend)
const dbPath = path.join(__dirname, 'database.db');

// Cria (se não existir) ou abre o banco de dados SQLite
// O arquivo database.db ficará salvo na pasta backend
const db = new sqlite3.Database(dbPath, (err) => {

  // Se ocorrer algum erro ao abrir o banco
  if (err) {
    console.error('❌ Erro ao conectar com o banco de dados:', err.message);
  } 
  // Se conectar com sucesso
  else {
    console.log('✅ Conectado ao banco de dados SQLite!');
  }
});


// ======================================================
// CRIAÇÃO DAS TABELAS
// ======================================================

// serialize() garante que os comandos SQL
// sejam executados em ordem (um depois do outro)
db.serialize(() => {

  // --------------------------------------------------
  // TABELA DE LOCAÇÕES
  // --------------------------------------------------
  // Esta tabela é um exemplo simples de locação
  // Pode ser usada para testes ou histórico
  db.run(`
    CREATE TABLE IF NOT EXISTS locacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT, -- ID único gerado automaticamente
      nome TEXT NOT NULL,                  -- Nome do responsável pela locação
      item TEXT NOT NULL,                  -- Espaço ou item locado
      data TEXT NOT NULL                   -- Data da locação
    )
  `, (err) => {
    if (err) {
      console.log("❌ Erro ao criar tabela 'locacoes':", err.message);
    } else {
      console.log("📌 Tabela 'locacoes' pronta!");
    }
  });


  // --------------------------------------------------
  // TABELA DE ESPAÇOS
  // --------------------------------------------------
  // Guarda todos os espaços disponíveis para locação
  db.run(`
    CREATE TABLE IF NOT EXISTS espacos (
      id INTEGER PRIMARY KEY AUTOINCREMENT, -- ID único do espaço
      nome TEXT NOT NULL,                   -- Nome do espaço (ex: Sala A)
      tipo TEXT NOT NULL,                   -- Tipo (coworking, auditório etc)
      capacidade INTEGER,                   -- Quantidade máxima de pessoas
      descricao TEXT                        -- Informações extras do espaço
    )
  `, (err) => {
    if (err) {
      console.log("❌ Erro ao criar tabela 'espacos':", err.message);
    } else {
      console.log("📌 Tabela 'espacos' pronta!");
    }
  });


  // --------------------------------------------------
  // TABELA DE CLIENTES
  // --------------------------------------------------
  // Armazena os dados dos clientes que fazem reservas
  db.run(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT, -- ID único do cliente
      nome TEXT NOT NULL,                   -- Nome completo do cliente
      email TEXT NOT NULL,                  -- Email para contato
      telefone TEXT                        -- Telefone (opcional)
    )
  `, (err) => {
    if (err) {
      console.log("❌ Erro ao criar tabela 'clientes':", err.message);
    } else {
      console.log("📌 Tabela 'clientes' pronta!");
    }
  });

});


// ======================================================
// EXPORTAÇÃO DO BANCO
// ======================================================

// Exporta a conexão com o banco de dados
// Isso permite que o server.js utilize o mesmo banco
module.exports = db;
