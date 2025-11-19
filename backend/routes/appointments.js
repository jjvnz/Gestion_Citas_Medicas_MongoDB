// Appointments routes
const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

// GET /api/appointments - Obtener todas las citas
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const db = getDB();
    const appointments = await db.collection('appointments')
      .find()
      .sort({ dateTime: 1 })
      .toArray();
    
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/appointments/doctor/:doctorId - Citas por doctor
router.get('/doctor/:doctorId', authenticateJWT, async (req, res) => {
  try {
    const db = getDB();
    const appointments = await db.collection('appointments').aggregate([
      { $match: { doctorId: new ObjectId(req.params.doctorId) } },
      {
        $lookup: {
          from: 'patients',
          localField: 'patientId',
          foreignField: '_id',
          as: 'patient'
        }
      },
      {
        $project: {
          dateTime: 1,
          status: 1,
          reason: 1,
          duration: 1,
          patientName: {
            $concat: [
              { $arrayElemAt: ['$patient.personalInfo.firstName', 0] },
              ' ',
              { $arrayElemAt: ['$patient.personalInfo.lastName', 0] }
            ]
          }
        }
      },
      { $sort: { dateTime: 1 } }
    ]).toArray();
    
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/appointments - Crear nueva cita
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const db = getDB();
    const { doctorId, patientId, dateTime, reason } = req.body;
    
    // Validaciones básicas
    if (!doctorId || !patientId || !dateTime) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    
    const nuevaCita = {
      doctorId: new ObjectId(doctorId),
      patientId: new ObjectId(patientId),
      dateTime: new Date(dateTime),
      duration: 30,
      status: 'scheduled',
      reason: reason,
      createdAt: new Date()
    };
    
    const resultado = await db.collection('appointments').insertOne(nuevaCita);
    res.status(201).json({ 
      success: true, 
      appointmentId: resultado.insertedId 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/appointments/:id - Obtener cita por ID
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const db = getDB();
    const appointment = await db.collection('appointments').findOne({
      _id: new ObjectId(req.params.id)
    });
    
    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/appointments/:id - Actualizar cita completa
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const db = getDB();
    const { doctorId, patientId, dateTime, duration, status, reason } = req.body;
    
    const actualizacion = {
      $set: {
        updatedAt: new Date()
      }
    };
    
    if (doctorId) actualizacion.$set.doctorId = new ObjectId(doctorId);
    if (patientId) actualizacion.$set.patientId = new ObjectId(patientId);
    if (dateTime) actualizacion.$set.dateTime = new Date(dateTime);
    if (duration) actualizacion.$set.duration = duration;
    if (status) actualizacion.$set.status = status;
    if (reason !== undefined) actualizacion.$set.reason = reason;
    
    const resultado = await db.collection('appointments').updateOne(
      { _id: new ObjectId(req.params.id) },
      actualizacion
    );
    
    if (resultado.matchedCount === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    
    res.json({ success: true, message: 'Cita actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/appointments/:id/status - Actualizar estado de cita
router.put('/:id/status', authenticateJWT, async (req, res) => {
  try {
    const db = getDB();
    const { status } = req.body;
    const estadosValidos = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'];
    
    if (!estadosValidos.includes(status)) {
      return res.status(400).json({ error: 'Estado no válido' });
    }
    
    const resultado = await db.collection('appointments').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: status, updatedAt: new Date() } }
    );
    
    if (resultado.matchedCount === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    
    res.json({ success: true, message: 'Estado actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/appointments/:id - Eliminar cita
router.delete('/:id', authenticateJWT, authorizeRoles('admin', 'doctor'), async (req, res) => {
  try {
    const db = getDB();
    
    const resultado = await db.collection('appointments').deleteOne({
      _id: new ObjectId(req.params.id)
    });
    
    if (resultado.deletedCount === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    
    res.json({ success: true, message: 'Cita eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;