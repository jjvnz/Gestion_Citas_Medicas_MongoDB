// Rules script

// Función para crear cita con validaciones de negocio
function crearCita(doctorId, patientId, dateTime, reason) {
  // Validar que el doctor existe y está activo
  const doctor = db.doctors.findOne({ 
    _id: doctorId, 
    status: "active" 
  })
  
  if (!doctor) {
    return { 
      success: false, 
      message: "❌ Doctor no encontrado o no activo" 
    }
  }

  // Validar que el paciente existe y está activo
  const patient = db.patients.findOne({ 
    _id: patientId, 
    status: "active" 
  })
  
  if (!patient) {
    return { 
      success: false, 
      message: "❌ Paciente no encontrado o no activo" 
    }
  }

  // Validar horario laboral del doctor
  const appointmentDate = new Date(dateTime)
  const dayOfWeek = appointmentDate.toLocaleDateString('es-ES', { weekday: 'long' })
  const time = appointmentDate.toTimeString().substring(0, 5)
  
  if (!doctor.schedule.workingDays.includes(dayOfWeek)) {
    return { 
      success: false, 
      message: `❌ El doctor no trabaja los ${dayOfWeek}` 
    }
  }

  if (time < doctor.schedule.startTime || time > doctor.schedule.endTime) {
    return { 
      success: false, 
      message: `❌ Horario no válido. Doctor disponible de ${doctor.schedule.startTime} a ${doctor.schedule.endTime}` 
    }
  }

  // Validar conflicto de horarios
  const endTime = new Date(appointmentDate.getTime() + 30 * 60000) // 30 minutos
  
  const conflicto = db.appointments.findOne({
    doctorId: doctorId,
    dateTime: { $lt: endTime },
    $expr: { 
      $gt: [ 
        { $add: ["$dateTime", { $multiply: ["$duration", 60000] }] }, 
        appointmentDate 
      ] 
    },
    status: { $in: ["scheduled", "confirmed"] }
  })

  if (conflicto) {
    return { 
      success: false, 
      message: "❌ El doctor ya tiene una cita en ese horario" 
    }
  }

  // Validar que el paciente no tenga otra cita en el mismo horario
  const conflictoPaciente = db.appointments.findOne({
    patientId: patientId,
    dateTime: { $lt: endTime },
    $expr: { 
      $gt: [ 
        { $add: ["$dateTime", { $multiply: ["$duration", 60000] }] }, 
        appointmentDate 
      ] 
    },
    status: { $in: ["scheduled", "confirmed"] }
  })

  if (conflictoPaciente) {
    return { 
      success: false, 
      message: "❌ El paciente ya tiene una cita en ese horario" 
    }
  }

  // Crear la cita
  const nuevaCita = {
    doctorId: doctorId,
    patientId: patientId,
    dateTime: appointmentDate,
    duration: 30,
    status: "scheduled",
    reason: reason,
    createdAt: new Date()
  }

  const resultado = db.appointments.insertOne(nuevaCita)

  return { 
    success: true, 
    message: "✅ Cita creada exitosamente",
    appointmentId: resultado.insertedId 
  }
}

// Función para cancelar cita
function cancelarCita(appointmentId, reason) {
  const cita = db.appointments.findOne({ _id: appointmentId })
  
  if (!cita) {
    return { success: false, message: "❌ Cita no encontrada" }
  }

  if (cita.status === "cancelled") {
    return { success: false, message: "❌ La cita ya está cancelada" }
  }

  if (cita.status === "completed") {
    return { success: false, message: "❌ No se puede cancelar una cita completada" }
  }

  // Validar que no se cancele con menos de 24 horas de anticipación
  const ahora = new Date()
  const diferenciaHoras = (cita.dateTime - ahora) / (1000 * 60 * 60)
  
  if (diferenciaHoras < 24) {
    return { 
      success: false, 
      message: "❌ No se puede cancelar con menos de 24 horas de anticipación" 
    }
  }

  db.appointments.updateOne(
    { _id: appointmentId },
    { 
      $set: { 
        status: "cancelled",
        cancellationReason: reason,
        cancelledAt: new Date()
      } 
    }
  )

  return { success: true, message: "✅ Cita cancelada exitosamente" }
}

// Función para buscar disponibilidad de doctor
function buscarDisponibilidad(doctorId, fecha) {
  const doctor = db.doctors.findOne({ _id: doctorId })
  if (!doctor) {
    return { success: false, message: "Doctor no encontrado" }
  }

  const fechaBusqueda = new Date(fecha)
  const dayOfWeek = fechaBusqueda.toLocaleDateString('es-ES', { weekday: 'long' })
  
  if (!doctor.schedule.workingDays.includes(dayOfWeek)) {
    return { success: false, message: `Doctor no trabaja los ${dayOfWeek}` }
  }

  // Generar horarios disponibles (cada 30 minutos)
  const horariosDisponibles = []
  const [startHour, startMinute] = doctor.schedule.startTime.split(':').map(Number)
  const [endHour, endMinute] = doctor.schedule.endTime.split(':').map(Number)
  
  let horaActual = new Date(fechaBusqueda)
  horaActual.setHours(startHour, startMinute, 0, 0)
  
  const horaFin = new Date(fechaBusqueda)
  horaFin.setHours(endHour, endMinute, 0, 0)

  while (horaActual < horaFin) {
    const horaFinSlot = new Date(horaActual.getTime() + 30 * 60000)
    
    // Verificar si hay conflicto
    const conflicto = db.appointments.findOne({
      doctorId: doctorId,
      dateTime: { $lt: horaFinSlot },
      $expr: { 
        $gt: [ 
          { $add: ["$dateTime", { $multiply: ["$duration", 60000] }] }, 
          horaActual 
        ] 
      },
      status: { $in: ["scheduled", "confirmed"] }
    })

    if (!conflicto) {
      horariosDisponibles.push(horaActual.toISOString())
    }

    horaActual.setMinutes(horaActual.getMinutes() + 30)
  }

  return {
    success: true,
    doctor: `${doctor.personalInfo.firstName} ${doctor.personalInfo.lastName}`,
    date: fechaBusqueda.toISOString().split('T')[0],
    availableSlots: horariosDisponibles
  }
}

// Ejemplos de uso
print("=== PRUEBAS DE REGLAS DE NEGOCIO ===")

// Ejemplo 1: Crear cita válida
print("\n1. Probando creación de cita válida:")
const doctor = db.doctors.findOne()
const patient = db.patients.findOne()

if (doctor && patient) {
  const fechaCita = new Date()
  fechaCita.setDate(fechaCita.getDate() + 2)
  fechaCita.setHours(10, 0, 0, 0)
  
  const resultadoCita = crearCita(
    doctor._id, 
    patient._id, 
    fechaCita, 
    "Consulta de rutina"
  )
  printjson(resultadoCita)
}

// Ejemplo 2: Buscar disponibilidad
print("\n2. Probando búsqueda de disponibilidad:")
if (doctor) {
  const fechaBusqueda = new Date()
  fechaBusqueda.setDate(fechaBusqueda.getDate() + 3)
  
  const disponibilidad = buscarDisponibilidad(doctor._id, fechaBusqueda)
  printjson(disponibilidad)
}

// Ejemplo 3: Cancelar cita
print("\n3. Probando cancelación de cita:")
const citaParaCancelar = db.appointments.findOne({ status: "scheduled" })
if (citaParaCancelar) {
  // Modificar la fecha para que sea cancelable (más de 24 horas en el futuro)
  db.appointments.updateOne(
    { _id: citaParaCancelar._id },
    { $set: { dateTime: new Date(Date.now() + 25 * 60 * 60 * 1000) } }
  )
  
  const resultadoCancelacion = cancelarCita(citaParaCancelar._id, "Paciente no puede asistir")
  printjson(resultadoCancelacion)
}