const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');

// GET /api/patients - Obtener todos los pacientes
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const patients = await db.collection('patients')
      .find()
      .sort({ 'personalInfo.lastName': 1 })
      .toArray();
    
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/patients/:id - Obtener paciente por ID
router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const patient = await db.collection('patients').findOne({
      _id: new ObjectId(req.params.id)
    });
    
    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/patients - Crear nuevo paciente
router.post('/', async (req, res) => {
  try {
    const db = getDB();
    const { personalInfo, contact, medicalInfo, emergencyContact } = req.body;
    
    // Validaciones básicas
    if (!personalInfo || !personalInfo.firstName || !personalInfo.lastName) {
      return res.status(400).json({ error: 'Nombre y apellido son requeridos' });
    }
    
    // Crear documento con todos los campos requeridos por el schema
    const nuevoPaciente = {
      personalInfo: {
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        dateOfBirth: personalInfo.dateOfBirth ? new Date(personalInfo.dateOfBirth) : new Date('2000-01-01'), // Fecha por defecto si no se proporciona
        gender: personalInfo.gender || 'No especificado',
        nationalId: personalInfo.nationalId || ''
      },
      contact: {
        email: contact?.email || '',
        phone: contact?.phone || '',
        address: contact?.address || {
          street: '',
          city: '',
          postalCode: '',
          country: ''
        }
      },
      medicalInfo: medicalInfo || {
        bloodType: '',
        allergies: [],
        chronicConditions: [],
        insuranceProvider: '',
        insuranceNumber: ''
      },
      emergencyContact: emergencyContact || {
        name: '',
        relationship: '',
        phone: ''
      },
      status: 'active',
      createdAt: new Date()
    };
    
    const resultado = await db.collection('patients').insertOne(nuevoPaciente);
    
    res.status(201).json({
      success: true,
      patientId: resultado.insertedId,
      message: 'Paciente creado exitosamente'
    });
  } catch (error) {
    console.error('Error creando paciente:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/patients/:id - Actualizar paciente
router.put('/:id', async (req, res) => {
  try {
    const db = getDB();
    const { personalInfo, contact, medicalInfo, emergencyContact, status } = req.body;
    
    const actualizacion = {
      $set: {
        updatedAt: new Date()
      }
    };
    
    if (personalInfo) actualizacion.$set.personalInfo = personalInfo;
    if (contact) actualizacion.$set.contact = contact;
    if (medicalInfo) actualizacion.$set.medicalInfo = medicalInfo;
    if (emergencyContact) actualizacion.$set.emergencyContact = emergencyContact;
    if (status) actualizacion.$set.status = status;
    
    const resultado = await db.collection('patients').updateOne(
      { _id: new ObjectId(req.params.id) },
      actualizacion
    );
    
    if (resultado.matchedCount === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    
    res.json({ success: true, message: 'Paciente actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/patients/:id - Eliminar paciente (cambiar estado)
router.delete('/:id', async (req, res) => {
  try {
    const db = getDB();
    
    const resultado = await db.collection('patients').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: 'inactive', updatedAt: new Date() } }
    );
    
    if (resultado.matchedCount === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    
    res.json({ success: true, message: 'Paciente desactivado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;