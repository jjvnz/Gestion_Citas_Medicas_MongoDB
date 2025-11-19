const { getDB } = require('../config/database');

class Doctor {
  constructor(doctorData) {
    this.personalInfo = doctorData.personalInfo || {};
    this.professional = doctorData.professional || {};
    this.contact = doctorData.contact || {};
    this.schedule = doctorData.schedule || {
      workingDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
      startTime: '09:00',
      endTime: '17:00'
    };
    this.status = doctorData.status || 'active';
    this.createdAt = doctorData.createdAt || new Date();
    this.updatedAt = doctorData.updatedAt;
  }

  // Crear nuevo doctor
  static async create(doctorData) {
    const db = getDB();
    const doctor = new Doctor(doctorData);
    
    const result = await db.collection('doctors').insertOne(doctor);
    return { ...doctor, _id: result.insertedId };
  }

  // Buscar doctor por ID
  static async findById(doctorId) {
    const db = getDB();
    return await db.collection('doctors').findOne({ _id: doctorId });
  }

  // Buscar doctor por número de licencia
  static async findByLicense(licenseNumber) {
    const db = getDB();
    return await db.collection('doctors').findOne({ 
      'professional.licenseNumber': licenseNumber 
    });
  }

  // Obtener todos los doctores
  static async findAll(filter = {}) {
    const db = getDB();
    return await db.collection('doctors')
      .find(filter)
      .sort({ 'personalInfo.lastName': 1, 'personalInfo.firstName': 1 })
      .toArray();
  }

  // Buscar doctores por especialidad
  static async findBySpecialty(specialty) {
    const db = getDB();
    return await db.collection('doctors').find({
      'professional.specialties': specialty,
      status: 'active'
    }).toArray();
  }

  // Actualizar doctor
  static async update(doctorId, updateData) {
    const db = getDB();
    updateData.updatedAt = new Date();
    
    const result = await db.collection('doctors').updateOne(
      { _id: doctorId },
      { $set: updateData }
    );
    
    return result;
  }

  // Verificar disponibilidad del doctor
  static async checkAvailability(doctorId, dateTime, duration = 30) {
    const db = getDB();
    
    const doctor = await this.findById(doctorId);
    if (!doctor) {
      throw new Error('Doctor no encontrado');
    }

    const appointmentDate = new Date(dateTime);
    const appointmentEnd = new Date(appointmentDate.getTime() + duration * 60000);

    // Verificar si está dentro del horario laboral
    const dayOfWeek = appointmentDate.toLocaleDateString('es-ES', { weekday: 'long' });
    if (!doctor.schedule.workingDays.includes(dayOfWeek)) {
      return { available: false, reason: 'El doctor no trabaja este día' };
    }

    const appointmentTime = appointmentDate.toTimeString().substring(0, 5);
    if (appointmentTime < doctor.schedule.startTime || appointmentTime > doctor.schedule.endTime) {
      return { available: false, reason: 'Fuera del horario laboral' };
    }

    // Verificar conflictos de citas
    const conflictingAppointment = await db.collection('appointments').findOne({
      doctorId: doctorId,
      dateTime: { $lt: appointmentEnd },
      $expr: { 
        $gt: [ 
          { $add: ["$dateTime", { $multiply: ["$duration", 60000] }] }, 
          appointmentDate 
        ] 
      },
      status: { $in: ['scheduled', 'confirmed'] }
    });

    if (conflictingAppointment) {
      return { available: false, reason: 'El doctor ya tiene una cita en este horario' };
    }

    return { available: true };
  }

  // Obtener horarios disponibles del doctor
  static async getAvailableSlots(doctorId, date) {
    const db = getDB();
    const doctor = await this.findById(doctorId);
    
    if (!doctor) {
      throw new Error('Doctor no encontrado');
    }

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.toLocaleDateString('es-ES', { weekday: 'long' });
    
    if (!doctor.schedule.workingDays.includes(dayOfWeek)) {
      return []; // No trabaja este día
    }

    const [startHour, startMinute] = doctor.schedule.startTime.split(':').map(Number);
    const [endHour, endMinute] = doctor.schedule.endTime.split(':').map(Number);
    
    const startTime = new Date(targetDate);
    startTime.setHours(startHour, startMinute, 0, 0);
    
    const endTime = new Date(targetDate);
    endTime.setHours(endHour, endMinute, 0, 0);

    // Obtener citas existentes para este día
    const existingAppointments = await db.collection('appointments').find({
      doctorId: doctorId,
      dateTime: { 
        $gte: startTime, 
        $lt: endTime 
      },
      status: { $in: ['scheduled', 'confirmed'] }
    }).toArray();

    // Generar slots disponibles
    const availableSlots = [];
    let currentTime = new Date(startTime);

    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime.getTime() + 30 * 60000);
      
      const isAvailable = !existingAppointments.some(apt => {
        const aptEnd = new Date(apt.dateTime.getTime() + apt.duration * 60000);
        return currentTime < aptEnd && slotEnd > apt.dateTime;
      });

      if (isAvailable) {
        availableSlots.push(new Date(currentTime));
      }

      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }

    return availableSlots;
  }

  // Obtener estadísticas de doctores
  static async getStats() {
    const db = getDB();
    
    const stats = await db.collection('doctors').aggregate([
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

  // Validar datos del doctor
  validate() {
    const errors = [];
    
    if (!this.personalInfo.firstName) {
      errors.push('El nombre es requerido');
    }
    
    if (!this.personalInfo.lastName) {
      errors.push('El apellido es requerido');
    }
    
    if (!this.professional.licenseNumber) {
      errors.push('El número de licencia es requerido');
    }
    
    if (!this.professional.specialties || this.professional.specialties.length === 0) {
      errors.push('Al menos una especialidad es requerida');
    }
    
    return errors;
  }
}

module.exports = Doctor;