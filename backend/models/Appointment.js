const { getDB } = require('../config/database');
const Doctor = require('./Doctor');
const Patient = require('./Patient');

class Appointment {
  constructor(appointmentData) {
    this.doctorId = appointmentData.doctorId;
    this.patientId = appointmentData.patientId;
    this.dateTime = appointmentData.dateTime ? new Date(appointmentData.dateTime) : new Date();
    this.duration = appointmentData.duration || 30;
    this.status = appointmentData.status || 'scheduled';
    this.reason = appointmentData.reason || '';
    this.notes = appointmentData.notes || '';
    this.cancellationReason = appointmentData.cancellationReason;
    this.createdAt = appointmentData.createdAt || new Date();
    this.updatedAt = appointmentData.updatedAt;
    this.cancelledAt = appointmentData.cancelledAt;
  }

  // Crear nueva cita
  static async create(appointmentData) {
    const db = getDB();
    
    // Validar que el doctor existe
    const doctor = await Doctor.findById(appointmentData.doctorId);
    if (!doctor) {
      throw new Error('Doctor no encontrado');
    }

    // Validar que el paciente existe
    const patient = await Patient.findById(appointmentData.patientId);
    if (!patient) {
      throw new Error('Paciente no encontrado');
    }

    // Verificar disponibilidad del doctor
    const availability = await Doctor.checkAvailability(
      appointmentData.doctorId, 
      appointmentData.dateTime, 
      appointmentData.duration || 30
    );

    if (!availability.available) {
      throw new Error(availability.reason);
    }

    // Verificar que el paciente no tenga otra cita en el mismo horario
    const patientConflict = await db.collection('appointments').findOne({
      patientId: appointmentData.patientId,
      dateTime: { 
        $lt: new Date(new Date(appointmentData.dateTime).getTime() + (appointmentData.duration || 30) * 60000)
      },
      $expr: { 
        $gt: [ 
          { $add: ["$dateTime", { $multiply: ["$duration", 60000] }] }, 
          new Date(appointmentData.dateTime)
        ] 
      },
      status: { $in: ['scheduled', 'confirmed'] }
    });

    if (patientConflict) {
      throw new Error('El paciente ya tiene una cita en este horario');
    }

    const appointment = new Appointment(appointmentData);
    const result = await db.collection('appointments').insertOne(appointment);
    
    return { ...appointment, _id: result.insertedId };
  }

  // Buscar cita por ID
  static async findById(appointmentId) {
    const db = getDB();
    return await db.collection('appointments').findOne({ _id: appointmentId });
  }

  // Obtener cita con detalles completos
  static async findByIdWithDetails(appointmentId) {
    const db = getDB();
    
    const result = await db.collection('appointments').aggregate([
      { $match: { _id: appointmentId } },
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
          dateTime: 1,
          duration: 1,
          status: 1,
          reason: 1,
          notes: 1,
          cancellationReason: 1,
          createdAt: 1,
          doctor: { $arrayElemAt: ['$doctor', 0] },
          patient: { $arrayElemAt: ['$patient', 0] }
        }
      }
    ]).toArray();
    
    return result[0];
  }

  // Obtener todas las citas
  static async findAll(filter = {}) {
    const db = getDB();
    return await db.collection('appointments')
      .find(filter)
      .sort({ dateTime: 1 })
      .toArray();
  }

  // Obtener citas por doctor
  static async findByDoctor(doctorId, options = {}) {
    const db = getDB();
    const { status, startDate, endDate } = options;
    
    const query = { doctorId: doctorId };
    
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.dateTime = {};
      if (startDate) query.dateTime.$gte = new Date(startDate);
      if (endDate) query.dateTime.$lte = new Date(endDate);
    }
    
    return await db.collection('appointments')
      .find(query)
      .sort({ dateTime: 1 })
      .toArray();
  }

  // Obtener citas por paciente
  static async findByPatient(patientId, options = {}) {
    const db = getDB();
    const { status, startDate, endDate } = options;
    
    const query = { patientId: patientId };
    
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.dateTime = {};
      if (startDate) query.dateTime.$gte = new Date(startDate);
      if (endDate) query.dateTime.$lte = new Date(endDate);
    }
    
    return await db.collection('appointments')
      .find(query)
      .sort({ dateTime: -1 })
      .toArray();
  }

  // Actualizar estado de cita
  static async updateStatus(appointmentId, status, cancellationReason = null) {
    const db = getDB();
    
    const updateData = { 
      status: status,
      updatedAt: new Date()
    };
    
    if (status === 'cancelled' && cancellationReason) {
      updateData.cancellationReason = cancellationReason;
      updateData.cancelledAt = new Date();
    }
    
    const result = await db.collection('appointments').updateOne(
      { _id: appointmentId },
      { $set: updateData }
    );
    
    return result;
  }

  // Cancelar cita
  static async cancel(appointmentId, reason) {
    const appointment = await this.findById(appointmentId);
    
    if (!appointment) {
      throw new Error('Cita no encontrada');
    }
    
    if (appointment.status === 'completed') {
      throw new Error('No se puede cancelar una cita completada');
    }
    
    if (appointment.status === 'cancelled') {
      throw new Error('La cita ya está cancelada');
    }
    
    // Validar cancelación con al menos 24 horas de anticipación
    const now = new Date();
    const timeDiff = appointment.dateTime - now;
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    if (hoursDiff < 24) {
      throw new Error('No se puede cancelar con menos de 24 horas de anticipación');
    }
    
    return await this.updateStatus(appointmentId, 'cancelled', reason);
  }

  // Obtener estadísticas de citas
  static async getStats() {
    const db = getDB();
    
    const stats = await db.collection('appointments').aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalDuration: { $sum: '$duration' }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$count' },
          byStatus: { 
            $push: { 
              status: '$_id', 
              count: '$count',
              totalDuration: '$totalDuration'
            } 
          }
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

  // Obtener citas próximas
  static async getUpcomingAppointments(days = 7) {
    const db = getDB();
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    
    const appointments = await db.collection('appointments').aggregate([
      {
        $match: {
          dateTime: { $gte: startDate, $lte: endDate },
          status: { $in: ['scheduled', 'confirmed'] }
        }
      },
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
          dateTime: 1,
          duration: 1,
          status: 1,
          reason: 1,
          doctorName: {
            $concat: [
              { $arrayElemAt: ['$doctor.personalInfo.firstName', 0] },
              ' ',
              { $arrayElemAt: ['$doctor.personalInfo.lastName', 0] }
            ]
          },
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
    
    return appointments;
  }

  // Validar datos de la cita
  validate() {
    const errors = [];
    
    if (!this.doctorId) {
      errors.push('Doctor es requerido');
    }
    
    if (!this.patientId) {
      errors.push('Paciente es requerido');
    }
    
    if (!this.dateTime) {
      errors.push('Fecha y hora son requeridos');
    }
    
    if (this.dateTime && new Date(this.dateTime) < new Date()) {
      errors.push('La fecha de la cita no puede ser en el pasado');
    }
    
    const validStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'];
    if (this.status && !validStatuses.includes(this.status)) {
      errors.push('Estado de cita no válido');
    }
    
    return errors;
  }
}

module.exports = Appointment;