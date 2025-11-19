print("=== CONSULTAS DEMOSTRATIVAS ===")

// 1. BÚSQUEDA POR REFERENCIA (Requisito del proyecto)
print("\n1. 📋 Historial médico completo de un paciente con información del doctor:")
const patientMedicalHistory = db.medical_records.aggregate([
  {
    $match: { 
      patientId: db.patients.findOne({"personalInfo.nationalId": "87654321B"})._id 
    }
  },
  {
    $lookup: {
      from: "doctors",
      localField: "doctorId",
      foreignField: "_id",
      as: "doctorInfo"
    }
  },
  {
    $lookup: {
      from: "patients",
      localField: "patientId",
      foreignField: "_id",
      as: "patientInfo"
    }
  },
  {
    $project: {
      "date": 1,
      "diagnosis": 1,
      "treatment": 1,
      "prescriptions": 1,
      "doctorName": { $arrayElemAt: ["$doctorInfo.personalInfo", 0] },
      "patientName": { $arrayElemAt: ["$patientInfo.personalInfo", 0] }
    }
  },
  { $sort: { date: -1 } }
]).toArray()

printjson(patientMedicalHistory)

// 2. Consulta con referencia: Citas de un médico específico
print("\n2. 🗓️ Citas del Dr. Ana García:")
const doctorAppointments = db.appointments.aggregate([
  {
    $lookup: {
      from: "doctors",
      localField: "doctorId",
      foreignField: "_id",
      as: "doctor"
    }
  },
  {
    $lookup: {
      from: "patients",
      localField: "patientId",
      foreignField: "_id",
      as: "patient"
    }
  },
  {
    $match: {
      "doctor.personalInfo.firstName": "Ana",
      "doctor.personalInfo.lastName": "García"
    }
  },
  {
    $project: {
      "dateTime": 1,
      "status": 1,
      "reason": 1,
      "patientName": { 
        $concat: [
          { $arrayElemAt: ["$patient.personalInfo.firstName", 0] },
          " ",
          { $arrayElemAt: ["$patient.personalInfo.lastName", 0] }
        ]
      },
      "duration": 1
    }
  },
  { $sort: { dateTime: 1 } }
]).toArray()

printjson(doctorAppointments)

// 3. Agregación: Estadísticas de citas por estado
print("\n3. 📊 Estadísticas de citas por estado:")
const appointmentStats = db.appointments.aggregate([
  {
    $group: {
      _id: "$status",
      total: { $sum: 1 },
      averageDuration: { $avg: "$duration" }
    }
  },
  { $sort: { total: -1 } }
]).toArray()

printjson(appointmentStats)

// 4. Agregación: Citas por día de la semana
print("\n4. 📅 Citas agrupadas por día de la semana:")
const appointmentsByDay = db.appointments.aggregate([
  {
    $group: {
      _id: { $dayOfWeek: "$dateTime" },
      total: { $sum: 1 },
      dates: { $push: "$dateTime" }
    }
  },
  {
    $project: {
      day: {
        $switch: {
          branches: [
            { case: { $eq: ["$_id", 1] }, then: "Domingo" },
            { case: { $eq: ["$_id", 2] }, then: "Lunes" },
            { case: { $eq: ["$_id", 3] }, then: "Martes" },
            { case: { $eq: ["$_id", 4] }, then: "Miércoles" },
            { case: { $eq: ["$_id", 5] }, then: "Jueves" },
            { case: { $eq: ["$_id", 6] }, then: "Viernes" },
            { case: { $eq: ["$_id", 7] }, then: "Sábado" }
          ],
          default: "Desconocido"
        }
      },
      total: 1,
      dates: 1
    }
  },
  { $sort: { total: -1 } }
]).toArray()

printjson(appointmentsByDay)

// 5. Búsqueda por especialidad médica
print("\n5. 🩺 Médicos por especialidad (Cardiología):")
const cardiologists = db.doctors.find({
  "professional.specialties": "Cardiología"
}).toArray()

printjson(cardiologists)

// 6. Consulta pacientes con condiciones crónicas específicas
print("\n6. 🏥 Pacientes con diabetes:")
const diabeticPatients = db.patients.find({
  "medicalInfo.chronicConditions": "diabetes"
}).toArray()

printjson(diabeticPatients.map(p => p.personalInfo))

// 7. Citas próximas (próximos 7 días)
print("\n7. ⏰ Citas próximas (próximos 7 días):")
const nextWeek = new Date()
nextWeek.setDate(nextWeek.getDate() + 7)

const upcomingAppointments = db.appointments.aggregate([
  {
    $match: {
      dateTime: { $gte: new Date(), $lte: nextWeek },
      status: { $in: ["scheduled", "confirmed"] }
    }
  },
  {
    $lookup: {
      from: "doctors",
      localField: "doctorId",
      foreignField: "_id",
      as: "doctor"
    }
  },
  {
    $lookup: {
      from: "patients",
      localField: "patientId",
      foreignField: "_id",
      as: "patient"
    }
  },
  {
    $project: {
      dateTime: 1,
      reason: 1,
      status: 1,
      doctorName: {
        $concat: [
          { $arrayElemAt: ["$doctor.personalInfo.firstName", 0] },
          " ",
          { $arrayElemAt: ["$doctor.personalInfo.lastName", 0] }
        ]
      },
      patientName: {
        $concat: [
          { $arrayElemAt: ["$patient.personalInfo.firstName", 0] },
          " ",
          { $arrayElemAt: ["$patient.personalInfo.lastName", 0] }
        ]
      }
    }
  },
  { $sort: { dateTime: 1 } }
]).toArray()

printjson(upcomingAppointments)

// 8. Actualización de estado de cita
print("\n8. ✏️ Actualizar estado de cita:")
const appointmentToUpdate = db.appointments.findOne({ status: "scheduled" })
if (appointmentToUpdate) {
  db.appointments.updateOne(
    { _id: appointmentToUpdate._id },
    { $set: { status: "confirmed", updatedAt: new Date() } }
  )
  print("✅ Cita actualizada a 'confirmed'")
}

// 9. Eliminar cita cancelada
print("\n9. 🗑️ Eliminar citas canceladas antiguas:")
const oneMonthAgo = new Date()
oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

const deleteResult = db.appointments.deleteMany({
  status: "cancelled",
  dateTime: { $lt: oneMonthAgo }
})

print(`✅ Eliminadas ${deleteResult.deletedCount} citas canceladas antiguas`)