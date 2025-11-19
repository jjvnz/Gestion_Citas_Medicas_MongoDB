const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { connectDB } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

// Conectar a la base de datos
connectDB().then(() => {
  console.log('✅ Base de datos MongoDB conectada');
}).catch(error => {
  console.error('❌ Error conectando a la base de datos:', error);
  process.exit(1);
});

// Importar rutas
const patientsRouter = require('./routes/patients');
const doctorsRouter = require('./routes/doctors');
const appointmentsRouter = require('./routes/appointments');
const medicalRecordsRouter = require('./routes/medicalRecords');

// Usar rutas
app.use('/api/patients', patientsRouter);
app.use('/api/doctors', doctorsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/medical-records', medicalRecordsRouter);

// Ruta principal - servir el frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Health check endpoint mejorado
app.get('/api/health', async (req, res) => {
  try {
    const { getDB } = require('./config/database');
    const db = getDB();
    
    // Verificar conexión a la base de datos
    await db.command({ ping: 1 });
    
    // Obtener estadísticas básicas
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
    
    res.json({ 
      status: 'OK', 
      message: 'Sistema de gestión de citas médicas funcionando correctamente',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        collections: collectionNames
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime()
      }
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'ERROR', 
      message: 'Problema de conexión con la base de datos',
      error: error.message 
    });
  }
});

// Ruta de información del sistema
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Sistema de Gestión de Citas Médicas',
    version: '1.0.0',
    description: 'Sistema web para gestión de citas médicas con MongoDB',
    author: 'Tu Nombre',
    endpoints: {
      patients: '/api/patients',
      doctors: '/api/doctors',
      appointments: '/api/appointments',
      medicalRecords: '/api/medical-records'
    }
  });
});

// Middleware para logging de requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    availableEndpoints: [
      '/api/patients',
      '/api/doctors', 
      '/api/appointments',
      '/api/medical-records',
      '/api/health',
      '/api/info'
    ]
  });
});

// Manejo de errores global mejorado
app.use((error, req, res, next) => {
  console.error('🚨 Error del servidor:', error);
  
  // Errores de MongoDB
  if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    return res.status(500).json({
      success: false,
      error: 'Error de base de datos',
      message: 'Ocurrió un error en la base de datos'
    });
  }
  
  // Errores de validación
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Error de validación',
      message: error.message
    });
  }
  
  // Error general
  res.status(500).json({ 
    success: false,
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Algo salió mal'
  });
});

// Manejar cierre graceful del servidor
process.on('SIGINT', () => {
  console.log('🛑 Cerrando servidor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Cerrando servidor...');
  process.exit(0);
});

// Inicializar servidor
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Información del sistema: http://localhost:${PORT}/api/info`);
  console.log(`🏥 Endpoints disponibles:`);
  console.log(`   👥 Pacientes: http://localhost:${PORT}/api/patients`);
  console.log(`   🩺 Doctores: http://localhost:${PORT}/api/doctors`);
  console.log(`   📅 Citas: http://localhost:${PORT}/api/appointments`);
  console.log(`   📋 Historial: http://localhost:${PORT}/api/medical-records`);
});

module.exports = { app, server };