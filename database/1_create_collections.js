
// Crear colecciones con validación
db.createCollection("patients", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["personalInfo", "contact", "status"],
      properties: {
        personalInfo: {
          bsonType: "object",
          required: ["firstName", "lastName", "dateOfBirth"],
          properties: {
            firstName: { bsonType: "string" },
            lastName: { bsonType: "string" },
            dateOfBirth: { bsonType: "date" },
            gender: { bsonType: "string" },
            nationalId: { bsonType: "string" }
          }
        },
        contact: {
          bsonType: "object",
          properties: {
            email: { bsonType: "string" },
            phone: { bsonType: "string" },
            address: { bsonType: "object" }
          }
        },
        status: { bsonType: "string", enum: ["active", "inactive"] }
      }
    }
  }
})

db.createCollection("doctors", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["personalInfo", "professional", "status"],
      properties: {
        personalInfo: {
          bsonType: "object",
          required: ["firstName", "lastName"],
          properties: {
            firstName: { bsonType: "string" },
            lastName: { bsonType: "string" },
            dateOfBirth: { bsonType: "date" }
          }
        },
        professional: {
          bsonType: "object",
          required: ["licenseNumber", "specialties"],
          properties: {
            licenseNumber: { bsonType: "string" },
            specialties: { bsonType: "array" }
          }
        },
        status: { bsonType: "string", enum: ["active", "inactive", "vacation"] }
      }
    }
  }
})

db.createCollection("appointments", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["doctorId", "patientId", "dateTime", "status"],
      properties: {
        doctorId: { bsonType: "objectId" },
        patientId: { bsonType: "objectId" },
        dateTime: { bsonType: "date" },
        duration: { bsonType: "int" },
        status: { 
          bsonType: "string", 
          enum: ["scheduled", "confirmed", "completed", "cancelled", "no-show"] 
        },
        reason: { bsonType: "string" }
      }
    }
  }
})

db.createCollection("medical_records", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["patientId", "date", "doctorId"],
      properties: {
        patientId: { bsonType: "objectId" },
        doctorId: { bsonType: "objectId" },
        date: { bsonType: "date" },
        diagnosis: { bsonType: "string" },
        treatment: { bsonType: "string" },
        prescriptions: { bsonType: "array" },
        notes: { bsonType: "string" }
      }
    }
  }
})

// Crear índices para optimizar consultas
db.patients.createIndex({ "personalInfo.nationalId": 1 }, { unique: true })
db.patients.createIndex({ "contact.email": 1 })
db.doctors.createIndex({ "professional.licenseNumber": 1 }, { unique: true })
db.doctors.createIndex({ "professional.specialties": 1 })
db.appointments.createIndex({ doctorId: 1, dateTime: 1 })
db.appointments.createIndex({ patientId: 1, dateTime: -1 })
db.appointments.createIndex({ status: 1, dateTime: 1 })
db.medical_records.createIndex({ patientId: 1, date: -1 })
db.medical_records.createIndex({ doctorId: 1, date: -1 })

print("✅ Colecciones e índices creados exitosamente")