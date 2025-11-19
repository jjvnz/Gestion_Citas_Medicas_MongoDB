const { getDB } = require('../config/database');

class Patient {
  constructor(patientData) {
    this.personalInfo = patientData.personalInfo || {};
    this.contact = patientData.contact || {};
    this.medicalInfo = patientData.medicalInfo || {};
    this.emergencyContact = patientData.emergencyContact || {};
    this.status = patientData.status || 'active';
    this.createdAt = patientData.createdAt || new Date();
    this.updatedAt = patientData.updatedAt;
  }

  // Crear nuevo paciente
  static async create(patientData) {
    const db = getDB();
    const patient = new Patient(patientData);
    
    const result = await db.collection('patients').insertOne(patient);
    return { ...patient, _id: result.insertedId };
  }

  // Buscar paciente por ID
  static async findById(patientId) {
    const db = getDB();
    return await db.collection('patients').findOne({ _id: patientId });
  }

  // Buscar paciente por cédula
  static async findByNationalId(nationalId) {
    const db = getDB();
    return await db.collection('patients').findOne({ 
      'personalInfo.nationalId': nationalId 
    });
  }

  // Obtener todos los pacientes
  static async findAll(filter = {}) {
    const db = getDB();
    return await db.collection('patients')
      .find(filter)
      .sort({ 'personalInfo.lastName': 1, 'personalInfo.firstName': 1 })
      .toArray();
  }

  // Actualizar paciente
  static async update(patientId, updateData) {
    const db = getDB();
    updateData.updatedAt = new Date();
    
    const result = await db.collection('patients').updateOne(
      { _id: patientId },
      { $set: updateData }
    );
    
    return result;
  }

  // Cambiar estado del paciente
  static async updateStatus(patientId, status) {
    const db = getDB();
    const result = await db.collection('patients').updateOne(
      { _id: patientId },
      { 
        $set: { 
          status: status,
          updatedAt: new Date()
        } 
      }
    );
    
    return result;
  }

  // Buscar pacientes por condición médica
  static async findByCondition(condition) {
    const db = getDB();
    return await db.collection('patients').find({
      'medicalInfo.chronicConditions': condition,
      status: 'active'
    }).toArray();
  }

  // Obtener estadísticas de pacientes
  static async getStats() {
    const db = getDB();
    
    const stats = await db.collection('patients').aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$count' },
          byStatus: { $push: { status: '$_id', count: '$count' } }
        }
      },
      {
        $project: {
          _id: 0,
          total: 1,
          byStatus: 1
        }
      }
    ]).toArray();
    
    return stats[0] || { total: 0, byStatus: [] };
  }

  // Validar datos del paciente
  validate() {
    const errors = [];
    
    if (!this.personalInfo.firstName) {
      errors.push('El nombre es requerido');
    }
    
    if (!this.personalInfo.lastName) {
      errors.push('El apellido es requerido');
    }
    
    if (!this.personalInfo.nationalId) {
      errors.push('La cédula es requerida');
    }
    
    if (this.contact.email && !this.isValidEmail(this.contact.email)) {
      errors.push('El email no es válido');
    }
    
    return errors;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = Patient;