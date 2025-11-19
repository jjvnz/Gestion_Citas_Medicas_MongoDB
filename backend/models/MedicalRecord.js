const { getDB } = require('../config/database');

class MedicalRecord {
  constructor(recordData) {
    this.patientId = recordData.patientId;
    this.doctorId = recordData.doctorId;
    this.date = recordData.date ? new Date(recordData.date) : new Date();
    this.diagnosis = recordData.diagnosis || '';
    this.treatment = recordData.treatment || '';
    this.prescriptions = recordData.prescriptions || [];
    this.notes = recordData.notes || '';
    this.vitalSigns = recordData.vitalSigns || {};
    this.createdAt = recordData.createdAt || new Date();
    this.updatedAt = recordData.updatedAt;
  }

  // Crear nuevo registro médico
  static async create(recordData) {
    const db = getDB();
    
    // Validar que el paciente existe
    const patient = await db.collection('patients').findOne({ _id: recordData.patientId });
    if (!patient) {
      throw new Error('Paciente no encontrado');
    }

    // Validar que el doctor existe
    const doctor = await db.collection('doctors').findOne({ _id: recordData.doctorId });
    if (!doctor) {
      throw new Error('Doctor no encontrado');
    }

    const record = new MedicalRecord(recordData);
    const result = await db.collection('medical_records').insertOne(record);
    
    return { ...record, _id: result.insertedId };
  }

  // Buscar registro por ID
  static async findById(recordId) {
    const db = getDB();
    return await db.collection('medical_records').findOne({ _id: recordId });
  }

  // Obtener registro con detalles completos
  static async findByIdWithDetails(recordId) {
    const db = getDB();
    
    const result = await db.collection('medical_records').aggregate([
      { $match: { _id: recordId } },
      {
        $lookup: {
          from: 'doctors',
          localField: 'doctorId',
          foreignField: '_id',
          as: 'doctor'
        }
      },
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
          date: 1,
          diagnosis: 1,
          treatment: 1,
          prescriptions: 1,
          notes: 1,
          vitalSigns: 1,
          createdAt: 1,
          doctor: { $arrayElemAt: ['$doctor', 0] },
          patient: { $arrayElemAt: ['$patient', 0] }
        }
      }
    ]).toArray();
    
    return result[0];
  }

  // Obtener historial médico de un paciente
  static async findByPatient(patientId, options = {}) {
    const db = getDB();
    const { limit, startDate, endDate } = options;
    
    const query = { patientId: patientId };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    let cursor = db.collection('medical_records')
      .find(query)
      .sort({ date: -1 });
    
    if (limit) {
      cursor = cursor.limit(limit);
    }
    
    return await cursor.toArray();
  }

  // Obtener historial médico con detalles
  static async findByPatientWithDetails(patientId, options = {}) {
    const db = getDB();
    const { limit, startDate, endDate } = options;
    
    const matchStage = { $match: { patientId: patientId } };
    
    if (startDate || endDate) {
      matchStage.$match.date = {};
      if (startDate) matchStage.$match.date.$gte = new Date(startDate);
      if (endDate) matchStage.$match.date.$lte = new Date(endDate);
    }
    
    const pipeline = [
      matchStage,
      {
        $lookup: {
          from: 'doctors',
          localField: 'doctorId',
          foreignField: '_id',
          as: 'doctor'
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
              { $arrayElemAt: ['$doctor.personalInfo.firstName', 0] },
              ' ',
              { $arrayElemAt: ['$doctor.personalInfo.lastName', 0] }
            ]
          },
          doctorSpecialty: { $arrayElemAt: ['$doctor.professional.specialties', 0] }
        }
      },
      { $sort: { date: -1 } }
    ];
    
    if (limit) {
      pipeline.push({ $limit: limit });
    }
    
    return await db.collection('medical_records').aggregate(pipeline).toArray();
  }

  // Obtener registros por doctor
  static async findByDoctor(doctorId, options = {}) {
    const db = getDB();
    const { limit, startDate, endDate } = options;
    
    const query = { doctorId: doctorId };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    let cursor = db.collection('medical_records')
      .find(query)
      .sort({ date: -1 });
    
    if (limit) {
      cursor = cursor.limit(limit);
    }
    
    return await cursor.toArray();
  }

  // Actualizar registro médico
  static async update(recordId, updateData) {
    const db = getDB();
    updateData.updatedAt = new Date();
    
    const result = await db.collection('medical_records').updateOne(
      { _id: recordId },
      { $set: updateData }
    );
    
    return result;
  }

  // Obtener estadísticas de registros médicos
  static async getStats() {
    const db = getDB();
    
    const stats = await db.collection('medical_records').aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      },
      {
        $limit: 12
      },
      {
        $project: {
          _id: 0,
          period: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              { $toString: '$_id.month' }
            ]
          },
          count: 1
        }
      }
    ]).toArray();
    
    return stats;
  }

  // Buscar registros por diagnóstico
  static async findByDiagnosis(diagnosis) {
    const db = getDB();
    return await db.collection('medical_records').find({
      diagnosis: { $regex: diagnosis, $options: 'i' }
    }).toArray();
  }

  // Validar datos del registro médico
  validate() {
    const errors = [];
    
    if (!this.patientId) {
      errors.push('Paciente es requerido');
    }
    
    if (!this.doctorId) {
      errors.push('Doctor es requerido');
    }
    
    if (!this.diagnosis) {
      errors.push('Diagnóstico es requerido');
    }
    
    if (!this.date) {
      errors.push('Fecha es requerida');
    }
    
    if (this.date && new Date(this.date) > new Date()) {
      errors.push('La fecha no puede ser en el futuro');
    }
    
    return errors;
  }
}

module.exports = MedicalRecord;