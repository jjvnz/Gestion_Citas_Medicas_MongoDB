// Insertar doctores
const doctors = db.doctors.insertMany([
  {
    personalInfo: {
      firstName: "Ana",
      lastName: "García",
      dateOfBirth: ISODate("1978-05-20"),
      gender: "F"
    },
    professional: {
      licenseNumber: "MED12345",
      specialties: ["Cardiología", "Medicina Interna"],
      yearsExperience: 15,
      education: ["Universidad de Madrid", "Especialización en Cardiología"]
    },
    contact: {
      email: "ana.garcia@hospital.com",
      phone: "+34611223344",
      address: {
        street: "Av. Medicina 456",
        city: "Madrid",
        postalCode: "28045"
      }
    },
    schedule: {
      workingDays: ["Lunes", "Martes", "Miércoles", "Jueves"],
      startTime: "09:00",
      endTime: "17:00"
    },
    status: "active",
    createdAt: new Date()
  },
  {
    personalInfo: {
      firstName: "Carlos",
      lastName: "Rodríguez",
      dateOfBirth: ISODate("1980-11-15"),
      gender: "M"
    },
    professional: {
      licenseNumber: "MED67890",
      specialties: ["Pediatría", "Alergología"],
      yearsExperience: 12,
      education: ["Universidad de Barcelona", "Especialización en Pediatría"]
    },
    contact: {
      email: "carlos.rodriguez@hospital.com",
      phone: "+34655667788",
      address: {
        street: "Calle Pediatría 789",
        city: "Barcelona",
        postalCode: "08015"
      }
    },
    schedule: {
      workingDays: ["Lunes", "Miércoles", "Viernes"],
      startTime: "10:00",
      endTime: "18:00"
    },
    status: "active",
    createdAt: new Date()
  }
])

// Insertar pacientes
const patients = db.patients.insertMany([
  {
    personalInfo: {
      firstName: "María",
      lastName: "López",
      dateOfBirth: ISODate("1990-08-12"),
      gender: "F",
      nationalId: "87654321B"
    },
    contact: {
      email: "maria.lopez@email.com",
      phone: "+34699887766",
      address: {
        street: "Calle Salud 123",
        city: "Madrid",
        postalCode: "28013",
        country: "España"
      }
    },
    medicalInfo: {
      bloodType: "A+",
      allergies: ["polvo", "mariscos"],
      chronicConditions: ["asma"],
      insuranceProvider: "Adeslas",
      insuranceNumber: "ADE987654"
    },
    emergencyContact: {
      name: "José López",
      relationship: "esposo",
      phone: "+34611223344"
    },
    status: "active",
    createdAt: new Date()
  },
  {
    personalInfo: {
      firstName: "Pedro",
      lastName: "Martínez",
      dateOfBirth: ISODate("1985-03-25"),
      gender: "M",
      nationalId: "12345678A"
    },
    contact: {
      email: "pedro.martinez@email.com",
      phone: "+34655443322",
      address: {
        street: "Av. Bienestar 456",
        city: "Barcelona",
        postalCode: "08025",
        country: "España"
      }
    },
    medicalInfo: {
      bloodType: "O-",
      allergies: ["penicilina"],
      chronicConditions: ["hipertensión"],
      insuranceProvider: "Sanitas",
      insuranceNumber: "SAN123456"
    },
    emergencyContact: {
      name: "Laura Martínez",
      relationship: "esposa",
      phone: "+34666778899"
    },
    status: "active",
    createdAt: new Date()
  },
  {
    personalInfo: {
      firstName: "Elena",
      lastName: "Gómez",
      dateOfBirth: ISODate("1975-12-05"),
      gender: "F",
      nationalId: "11223344C"
    },
    contact: {
      email: "elena.gomez@email.com",
      phone: "+34677665544",
      address: {
        street: "Plaza Medicina 789",
        city: "Valencia",
        postalCode: "46004",
        country: "España"
      }
    },
    medicalInfo: {
      bloodType: "B+",
      allergies: [],
      chronicConditions: ["diabetes", "artritis"],
      insuranceProvider: "MAPFRE",
      insuranceNumber: "MAP456789"
    },
    emergencyContact: {
      name: "Miguel Gómez",
      relationship: "hermano",
      phone: "+34688776655"
    },
    status: "active",
    createdAt: new Date()
  }
])

// Insertar citas
const appointments = db.appointments.insertMany([
  {
    doctorId: doctors.insertedIds[0],
    patientId: patients.insertedIds[0],
    dateTime: ISODate("2024-01-15T10:00:00Z"),
    duration: 30,
    status: "completed",
    reason: "Control rutina cardiología",
    notes: "Paciente estable, continuar tratamiento actual",
    createdAt: new Date()
  },
  {
    doctorId: doctors.insertedIds[0],
    patientId: patients.insertedIds[1],
    dateTime: ISODate("2024-01-15T11:00:00Z"),
    duration: 30,
    status: "confirmed",
    reason: "Consulta por hipertensión",
    createdAt: new Date()
  },
  {
    doctorId: doctors.insertedIds[1],
    patientId: patients.insertedIds[2],
    dateTime: ISODate("2024-01-16T16:00:00Z"),
    duration: 45,
    status: "scheduled",
    reason: "Control diabetes y artritis",
    createdAt: new Date()
  },
  {
    doctorId: doctors.insertedIds[0],
    patientId: patients.insertedIds[2],
    dateTime: ISODate("2024-01-17T09:30:00Z"),
    duration: 30,
    status: "scheduled",
    reason: "Evaluación cardíaca",
    createdAt: new Date()
  },
  {
    doctorId: doctors.insertedIds[1],
    patientId: patients.insertedIds[0],
    dateTime: ISODate("2024-01-18T17:00:00Z"),
    duration: 30,
    status: "cancelled",
    reason: "Alergia estacional",
    cancellationReason: "Paciente no pudo asistir",
    createdAt: new Date()
  }
])

// Insertar registros médicos
db.medical_records.insertMany([
  {
    patientId: patients.insertedIds[0],
    doctorId: doctors.insertedIds[0],
    date: ISODate("2024-01-15T10:00:00Z"),
    diagnosis: "Hipertensión controlada",
    treatment: "Continuar con enalapril 10mg diarios",
    prescriptions: [
      {
        medication: "Enalapril",
        dosage: "10mg",
        frequency: "Una vez al día",
        duration: "30 días"
      }
    ],
    notes: "Paciente responde bien al tratamiento, presión arterial dentro de rangos normales",
    vitalSigns: {
      bloodPressure: "120/80",
      heartRate: 72,
      temperature: 36.5,
      weight: ""
    },
    createdAt: new Date()
  },
  {
    patientId: patients.insertedIds[2],
    doctorId: doctors.insertedIds[1],
    date: ISODate("2024-01-10T11:00:00Z"),
    diagnosis: "Diabetes tipo 2, Artritis reumatoide",
    treatment: "Control glucosa y medicación antiinflamatoria",
    prescriptions: [
      {
        medication: "Metformina",
        dosage: "500mg",
        frequency: "Dos veces al día",
        duration: "60 días"
      },
      {
        medication: "Ibuprofeno",
        dosage: "400mg",
        frequency: "Cada 8 horas si hay dolor",
        duration: "20 días"
      }
    ],
    notes: "Paciente estable, recomendar ejercicio moderado y dieta controlada",
    vitalSigns: {
      bloodPressure: "130/85",
      heartRate: 68,
      temperature: 36.7,
      weight: ""
    },
    createdAt: new Date()
  }
])

print("✅ Datos de ejemplo insertados exitosamente")