const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

// Simple sanitization function to remove potentially dangerous characters
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  // Remove HTML tags and script content
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}


// GET /api/patients - Obtener todos los pacientes
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const db = getDB();
    
    const patients = await db.collection('patients')
      .find({})
      .sort({ 'personalInfo.lastName': 1 })
      .toArray();
    
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/patients/:id - Obtener paciente por ID
router.get('/:id', authenticateJWT, async (req, res) => {
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
router.post('/', authenticateJWT, authorizeRoles('admin', 'receptionist'), async (req, res) => {
  try {
    const db = getDB();
    const { personalInfo, contact, medicalInfo, emergencyContact } = req.body;
    
    // VALIDACIÓN (capa Backend)
    const errors = [];
    
    if (!personalInfo || !personalInfo.firstName || personalInfo.firstName.trim() === '') {
      errors.push('El nombre es requerido');
    }
    if (!personalInfo || !personalInfo.lastName || personalInfo.lastName.trim() === '') {
      errors.push('El apellido es requerido');
    }
    if (!personalInfo || !personalInfo.nationalId || personalInfo.nationalId.trim() === '') {
      errors.push('La cédula es requerida');
    }
    if (!personalInfo || !personalInfo.dateOfBirth) {
      errors.push('La fecha de nacimiento es requerida');
    }
    if (!personalInfo || !personalInfo.gender) {
      errors.push('El género es requerido');
    }
    const email = contact && contact.email ? contact.email.trim() : '';
    if (!contact || !email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      errors.push('Email válido es requerido');
    }
    if (!contact || !contact.phone || contact.phone.trim() === '') {
      errors.push('El teléfono es requerido');
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Validación fallida', 
        details: errors 
      });
    }
    
    // Verificar si ya existe un paciente con la misma cédula
    const existingPatient = await db.collection('patients').findOne({
      'personalInfo.nationalId': personalInfo.nationalId
    });
    
    if (existingPatient) {
      return res.status(409).json({ 
        success: false,
        error: 'Ya existe un paciente con esta cédula' 
      });
    }
    
    // Crear documento completo con valores por defecto
    const nuevoPaciente = {
      personalInfo: {
        firstName: sanitizeInput(personalInfo.firstName.trim()),
        lastName: sanitizeInput(personalInfo.lastName.trim()),
        dateOfBirth: new Date(personalInfo.dateOfBirth),
        gender: personalInfo.gender,
        nationalId: sanitizeInput(personalInfo.nationalId.trim())
      },
      contact: {
        email: contact.email.trim().toLowerCase(),
        phone: sanitizeInput(contact.phone.trim()),
        address: contact.address || {
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
    console.error('Error al crear paciente:', error);
    if (error.code === 121) {
      return res.status(400).json({ 
        success: false,
        error: 'Datos inválidos según schema de base de datos'
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

router.put('/:id', authenticateJWT, authorizeRoles('admin', 'receptionist'), async (req, res) => {
  try {
    const db = getDB();
    const { personalInfo, contact, medicalInfo, emergencyContact, status } = req.body;
    
    // VALIDACIÓN DE DATOS (capa Backend - crítica)
    const errors = [];
    
    if (personalInfo) {
      if (!personalInfo.firstName || personalInfo.firstName.trim() === '') {
        errors.push('El nombre es requerido');
      }
      if (!personalInfo.lastName || personalInfo.lastName.trim() === '') {
        errors.push('El apellido es requerido');
      }
      if (!personalInfo.nationalId || personalInfo.nationalId.trim() === '') {
        errors.push('La cédula es requerida');
      }
      if (!personalInfo.dateOfBirth) {
        errors.push('La fecha de nacimiento es requerida');
      }
    }
    
    if (contact) {
      const email = contact.email ? contact.email.trim() : '';
      if (email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        errors.push('El email no es válido');
      }
      if (!contact.phone || contact.phone.trim() === '') {
        errors.push('El teléfono es requerido');
      }
    }
    
    if (status && !['active', 'inactive'].includes(status)) {
      errors.push('El status debe ser "active" o "inactive"');
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Validación fallida', 
        details: errors 
      });
    }
    
    // Verificar duplicado de cédula si se está actualizando
    if (personalInfo && personalInfo.nationalId) {
      const existingPatient = await db.collection('patients').findOne({
        'personalInfo.nationalId': personalInfo.nationalId,
        _id: { $ne: new ObjectId(req.params.id) }
      });
      
      if (existingPatient) {
        return res.status(400).json({ 
          success: false,
          error: 'Ya existe un paciente con esta cédula' 
        });
      }
    }
    
    // Construir objeto de actualización
    const updateFields = {
      updatedAt: new Date()
    };
    
    // Convertir dateOfBirth de string a Date
    if (personalInfo) {
      updateFields.personalInfo = { ...personalInfo };
      if (personalInfo.dateOfBirth) {
        updateFields.personalInfo.dateOfBirth = new Date(personalInfo.dateOfBirth);
      }
    }
    
    if (contact) updateFields.contact = contact;
    if (medicalInfo) updateFields.medicalInfo = medicalInfo;
    if (emergencyContact) updateFields.emergencyContact = emergencyContact;
    if (status) updateFields.status = status;
    
    const resultado = await db.collection('patients').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateFields }
    );
    
    if (resultado.matchedCount === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Paciente no encontrado' 
      });
    }
    
    res.json({ success: true, message: 'Paciente actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar paciente:', error);
    if (error.code === 121) {
      return res.status(400).json({ 
        success: false,
        error: 'Datos inválidos según schema de base de datos'
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// DELETE /api/patients/:id - Eliminar paciente (soft delete)
router.delete('/:id', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  try {
    const db = getDB();
    
    // Verificar que el paciente existe
    const patient = await db.collection('patients').findOne({
      _id: new ObjectId(req.params.id)
    });
    
    if (!patient) {
      return res.status(404).json({ 
        success: false,
        error: 'Paciente no encontrado' 
      });
    }
    
    if (patient.status === 'inactive') {
      return res.status(400).json({ 
        success: false,
        error: 'El paciente ya está inactivo' 
      });
    }
    
    // Verificar si tiene citas futuras
    const citasFuturas = await db.collection('appointments').countDocuments({
      patientId: new ObjectId(req.params.id),
      dateTime: { $gte: new Date() },
      status: { $in: ['scheduled', 'confirmed'] }
    });
    
    if (citasFuturas > 0) {
      return res.status(400).json({ 
        success: false,
        error: `No se puede desactivar. El paciente tiene ${citasFuturas} cita(s) programada(s)`,
        details: { citasFuturas }
      });
    }
    
    // Soft delete - cambiar estado a inactive
    const resultado = await db.collection('patients').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: 'inactive', updatedAt: new Date() } }
    );
    
    res.json({ 
      success: true, 
      message: 'Paciente desactivado exitosamente' 
    });
  } catch (error) {
    console.error('Error al desactivar paciente:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;