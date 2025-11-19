const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');

// GET /api/medical-records - Obtener todos los registros médicos
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const medicalRecords = await db.collection('medical_records')
      .find()
      .sort({ date: -1 })
      .toArray();
    
    res.json(medicalRecords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/medical-records/patient/:patientId - Historial por paciente
router.get('/patient/:patientId', async (req, res) => {
  try {
    const db = getDB();
    
    const medicalRecords = await db.collection('medical_records').aggregate([
      { 
        $match: { 
          patientId: new ObjectId(req.params.patientId) 
        } 
      },
      {
        $lookup: {
          from: 'doctors',
          localField: 'doctorId',
          foreignField: '_id',
          as: 'doctorInfo'
        }
      },
      {
        $lookup: {
          from: 'patients',
          localField: 'patientId',
          foreignField: '_id',
          as: 'patientInfo'
        }
      },
      {
        $project: {
          date: 1,
          diagnosis: 1,
          treatment: 1,
          prescriptions: 1,
          notes: 1,
          vitalSigns: 1,
          doctorName: {
            $concat: [
              { $arrayElemAt: ['$doctorInfo.personalInfo.firstName', 0] },
              ' ',
              { $arrayElemAt: ['$doctorInfo.personalInfo.lastName', 0] }
            ]
          },
          patientName: {
            $concat: [
              { $arrayElemAt: ['$patientInfo.personalInfo.firstName', 0] },
              ' ',
              { $arrayElemAt: ['$patientInfo.personalInfo.lastName', 0] }
            ]
          }
        }
      },
      { $sort: { date: -1 } }
    ]).toArray();
    
    res.json(medicalRecords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/medical-records - Crear nuevo registro médico
router.post('/', async (req, res) => {
  try {
    const db = getDB();
    const { patientId, doctorId, date, diagnosis, treatment, prescriptions, notes, vitalSigns } = req.body;
    
    if (!patientId || !doctorId || !diagnosis) {
      return res.status(400).json({ error: 'Paciente, doctor y diagnóstico son requeridos' });
    }
    
    const nuevoRegistro = {
      patientId: new ObjectId(patientId),
      doctorId: new ObjectId(doctorId),
      date: date ? new Date(date) : new Date(),
      diagnosis: diagnosis,
      treatment: treatment || '',
      prescriptions: prescriptions || [],
      notes: notes || '',
      vitalSigns: vitalSigns || {},
      createdAt: new Date()
    };
    
    const resultado = await db.collection('medical_records').insertOne(nuevoRegistro);
    
    res.status(201).json({
      success: true,
      recordId: resultado.insertedId,
      message: 'Registro médico creado exitosamente'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/medical-records/:id - Obtener registro médico por ID
router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    
    const medicalRecord = await db.collection('medical_records').aggregate([
      { 
        $match: { 
          _id: new ObjectId(req.params.id) 
        } 
      },
      {
        $lookup: {
          from: 'doctors',
          localField: 'doctorId',
          foreignField: '_id',
          as: 'doctorInfo'
        }
      },
      {
        $lookup: {
          from: 'patients',
          localField: 'patientId',
          foreignField: '_id',
          as: 'patientInfo'
        }
      }
    ]).toArray();
    
    if (medicalRecord.length === 0) {
      return res.status(404).json({ error: 'Registro médico no encontrado' });
    }
    
    res.json(medicalRecord[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/medical-records/:id - Actualizar registro médico
router.put('/:id', async (req, res) => {
  try {
    const db = getDB();
    const { diagnosis, treatment, prescriptions, notes, vitalSigns } = req.body;
    
    const actualizacion = {
      $set: {
        updatedAt: new Date()
      }
    };
    
    if (diagnosis) actualizacion.$set.diagnosis = diagnosis;
    if (treatment !== undefined) actualizacion.$set.treatment = treatment;
    if (prescriptions) actualizacion.$set.prescriptions = prescriptions;
    if (notes !== undefined) actualizacion.$set.notes = notes;
    if (vitalSigns) actualizacion.$set.vitalSigns = vitalSigns;
    
    const resultado = await db.collection('medical_records').updateOne(
      { _id: new ObjectId(req.params.id) },
      actualizacion
    );
    
    if (resultado.matchedCount === 0) {
      return res.status(404).json({ error: 'Registro médico no encontrado' });
    }
    
    res.json({ success: true, message: 'Registro médico actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/medical-records/:id - Eliminar registro médico
router.delete('/:id', async (req, res) => {
  try {
    const db = getDB();
    
    const resultado = await db.collection('medical_records').deleteOne({
      _id: new ObjectId(req.params.id)
    });
    
    if (resultado.deletedCount === 0) {
      return res.status(404).json({ error: 'Registro médico no encontrado' });
    }
    
    res.json({ success: true, message: 'Registro médico eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;