const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');

// GET /api/doctors - Obtener todos los doctores
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const doctors = await db.collection('doctors')
      .find()
      .sort({ 'personalInfo.lastName': 1 })
      .toArray();
    
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/doctors/:id - Obtener doctor por ID
router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const doctor = await db.collection('doctors').findOne({
      _id: new ObjectId(req.params.id)
    });
    
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor no encontrado' });
    }
    
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/doctors/specialty/:specialty - Doctores por especialidad
router.get('/specialty/:specialty', async (req, res) => {
  try {
    const db = getDB();
    const doctors = await db.collection('doctors').find({
      'professional.specialties': req.params.specialty,
      status: 'active'
    }).toArray();
    
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/doctors - Crear nuevo doctor
router.post('/', async (req, res) => {
  try {
    const db = getDB();
    const { personalInfo, professional, contact, schedule } = req.body;
    
    if (!personalInfo || !personalInfo.firstName || !personalInfo.lastName) {
      return res.status(400).json({ error: 'Nombre y apellido son requeridos' });
    }
    
    if (!professional || !professional.licenseNumber) {
      return res.status(400).json({ error: 'Número de licencia es requerido' });
    }
    
    const nuevoDoctor = {
      personalInfo: {
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        dateOfBirth: personalInfo.dateOfBirth ? new Date(personalInfo.dateOfBirth) : null,
        gender: personalInfo.gender
      },
      professional: {
        licenseNumber: professional.licenseNumber,
        specialties: professional.specialties || [],
        yearsExperience: professional.yearsExperience || 0,
        education: professional.education || []
      },
      contact: contact || {},
      schedule: schedule || {
        workingDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
        startTime: '09:00',
        endTime: '17:00'
      },
      status: 'active',
      createdAt: new Date()
    };
    
    const resultado = await db.collection('doctors').insertOne(nuevoDoctor);
    
    res.status(201).json({
      success: true,
      doctorId: resultado.insertedId,
      message: 'Doctor creado exitosamente'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/doctors/:id - Actualizar doctor
router.put('/:id', async (req, res) => {
  try {
    const db = getDB();
    const { personalInfo, professional, contact, schedule, status } = req.body;
    
    const actualizacion = {
      $set: {
        updatedAt: new Date()
      }
    };
    
    if (personalInfo) actualizacion.$set.personalInfo = personalInfo;
    if (professional) actualizacion.$set.professional = professional;
    if (contact) actualizacion.$set.contact = contact;
    if (schedule) actualizacion.$set.schedule = schedule;
    if (status) actualizacion.$set.status = status;
    
    const resultado = await db.collection('doctors').updateOne(
      { _id: new ObjectId(req.params.id) },
      actualizacion
    );
    
    if (resultado.matchedCount === 0) {
      return res.status(404).json({ error: 'Doctor no encontrado' });
    }
    
    res.json({ success: true, message: 'Doctor actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/doctors/:id - Eliminar doctor (cambiar estado a inactive)
router.delete('/:id', async (req, res) => {
  try {
    const db = getDB();
    
    const resultado = await db.collection('doctors').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: 'inactive', updatedAt: new Date() } }
    );
    
    if (resultado.matchedCount === 0) {
      return res.status(404).json({ error: 'Doctor no encontrado' });
    }
    
    res.json({ success: true, message: 'Doctor desactivado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;