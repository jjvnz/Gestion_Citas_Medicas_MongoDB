// Database configuration
const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/gestion_citas_medicas";
let client;
let database;

async function connectDB() {
  try {
    client = new MongoClient(uri);
    await client.connect();
    database = client.db();
    console.log('✅ Conectado a MongoDB');
    return database;
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
}

function getDB() {
  if (!database) {
    throw new Error('Database not initialized');
  }
  return database;
}

async function closeDB() {
  if (client) {
    await client.close();
  }
}

module.exports = { connectDB, getDB, closeDB };