# 📚 API REST - Sistema de Gestión de Citas Médicas

## 🏥 Descripción General
API RESTful completa con operaciones CRUD para gestionar pacientes, doctores, citas y registros médicos.

**Base URL:** `http://localhost:3000/api`

---

## 👥 PACIENTES (`/api/patients`)

### ✅ CREATE - Crear Paciente
**POST** `/api/patients`
```json
{
  "personalInfo": {
    "firstName": "Juan",
    "lastName": "Pérez",
    "dateOfBirth": "1990-01-15",
    "gender": "M",
    "nationalId": "12345678A"
  },
  "contact": {
    "email": "juan@email.com",
    "phone": "+34612345678",
    "address": {
      "street": "Calle Principal 123",
      "city": "Madrid",
      "postalCode": "28001",
      "country": "España"
    }
  }
}
```

### 📖 READ - Obtener Pacientes
**GET** `/api/patients` - Obtener todos los pacientes
**GET** `/api/patients/:id` - Obtener paciente por ID

### ✏️ UPDATE - Actualizar Paciente
**PUT** `/api/patients/:id`
```json
{
  "personalInfo": { "firstName": "Juan Carlos" },
  "contact": { "phone": "+34687654321" },
  "status": "active"
}
```

### 🗑️ DELETE - Eliminar Paciente
**DELETE** `/api/patients/:id` - Desactiva el paciente (soft delete)

---

## 🩺 DOCTORES (`/api/doctors`)

### ✅ CREATE - Crear Doctor
**POST** `/api/doctors`
```json
{
  "personalInfo": {
    "firstName": "María",
    "lastName": "González",
    "dateOfBirth": "1985-06-20",
    "gender": "F"
  },
  "professional": {
    "licenseNumber": "MED123456",
    "specialties": ["Cardiología", "Medicina Interna"],
    "yearsExperience": 10
  },
  "contact": {
    "email": "maria.gonzalez@hospital.com",
    "phone": "+34699887766"
  },
  "schedule": [
    { "day": "monday", "startTime": "09:00", "endTime": "17:00" },
    { "day": "tuesday", "startTime": "09:00", "endTime": "17:00" }
  ]
}
```

### 📖 READ - Obtener Doctores
**GET** `/api/doctors` - Obtener todos los doctores
**GET** `/api/doctors/:id` - Obtener doctor por ID
**GET** `/api/doctors/specialty/:specialty` - Obtener doctores por especialidad

### ✏️ UPDATE - Actualizar Doctor
**PUT** `/api/doctors/:id`
```json
{
  "professional": {
    "specialties": ["Cardiología", "Medicina Interna", "Geriatría"]
  },
  "status": "active"
}
```

### 🗑️ DELETE - Eliminar Doctor
**DELETE** `/api/doctors/:id` - Desactiva el doctor (soft delete)

---

## 📅 CITAS (`/api/appointments`)

### ✅ CREATE - Crear Cita
**POST** `/api/appointments`
```json
{
  "doctorId": "673abc123def456789012345",
  "patientId": "673def456abc789012345678",
  "dateTime": "2024-12-15T10:30:00",
  "duration": 30,
  "reason": "Consulta general"
}
```

### 📖 READ - Obtener Citas
**GET** `/api/appointments` - Obtener todas las citas
**GET** `/api/appointments/:id` - Obtener cita por ID
**GET** `/api/appointments/doctor/:doctorId` - Citas por doctor (con $lookup)

### ✏️ UPDATE - Actualizar Cita
**PUT** `/api/appointments/:id` - Actualizar cita completa
```json
{
  "dateTime": "2024-12-15T11:00:00",
  "duration": 45,
  "status": "confirmed"
}
```

**PUT** `/api/appointments/:id/status` - Actualizar solo estado
```json
{
  "status": "confirmed"
}
```
Estados válidos: `scheduled`, `confirmed`, `completed`, `cancelled`, `no-show`

### 🗑️ DELETE - Eliminar Cita
**DELETE** `/api/appointments/:id` - Elimina la cita permanentemente

---

## 📋 REGISTROS MÉDICOS (`/api/medical-records`)

### ✅ CREATE - Crear Registro Médico
**POST** `/api/medical-records`
```json
{
  "patientId": "673def456abc789012345678",
  "doctorId": "673abc123def456789012345",
  "date": "2024-11-18",
  "diagnosis": "Hipertensión arterial",
  "treatment": "Medicación antihipertensiva",
  "prescriptions": [
    {
      "name": "Enalapril",
      "dosage": "10mg cada 12 horas",
      "duration": "30 días"
    }
  ],
  "notes": "Control en 30 días",
  "vitalSigns": {
    "bloodPressure": "140/90",
    "heartRate": 80,
    "temperature": 36.5
  }
}
```

### 📖 READ - Obtener Registros Médicos
**GET** `/api/medical-records` - Obtener todos los registros
**GET** `/api/medical-records/:id` - Obtener registro por ID (con $lookup)
**GET** `/api/medical-records/patient/:patientId` - Registros por paciente (con $lookup)

### ✏️ UPDATE - Actualizar Registro Médico
**PUT** `/api/medical-records/:id`
```json
{
  "diagnosis": "Hipertensión arterial controlada",
  "treatment": "Continuar medicación",
  "notes": "Mejora en lecturas de presión arterial"
}
```

### 🗑️ DELETE - Eliminar Registro Médico
**DELETE** `/api/medical-records/:id` - Elimina el registro permanentemente

---

## 🔍 Características Especiales

### 🔗 Búsquedas por Referencia ($lookup)
El sistema implementa **agregaciones con $lookup** para obtener datos relacionados:

1. **Citas con información de pacientes**
   - Endpoint: `GET /api/appointments/doctor/:doctorId`
   - Une `appointments` con `patients`

2. **Registros médicos con doctor y paciente**
   - Endpoint: `GET /api/medical-records/patient/:patientId`
   - Une `medical_records` con `doctors` y `patients`

3. **Registro médico individual con relaciones**
   - Endpoint: `GET /api/medical-records/:id`
   - Une `medical_records` con `doctors` y `patients`

### 📊 Validación de Esquemas
Todas las colecciones tienen validación JSON Schema en MongoDB:
- ✅ Tipos de datos validados
- ✅ Campos requeridos definidos
- ✅ Enumeraciones para estados
- ✅ Índices únicos (cédula, licencia)

### 🔐 Índices Optimizados
- `patients`: nationalId (único), email
- `doctors`: licenseNumber (único), specialties
- `appointments`: doctorId + dateTime, patientId + dateTime, status + dateTime
- `medical_records`: patientId + date, doctorId + date

---

## ✅ Verificación de Requisitos

| Requisito | Implementado | Detalles |
|-----------|--------------|----------|
| MongoDB | ✅ | Base de datos con 4 colecciones |
| Aplicación Web | ✅ | Frontend HTML/CSS/JS + Backend Node.js/Express |
| Múltiples colecciones | ✅ | patients, doctors, appointments, medical_records |
| Búsqueda por referencia | ✅ | 3 endpoints con $lookup implementados |
| CRUD Completo | ✅ | Create, Read, Update, Delete en todas las colecciones |

---

## 🚀 Endpoints Resumen

### Pacientes (5 endpoints)
- `POST /api/patients` - Crear
- `GET /api/patients` - Listar todos
- `GET /api/patients/:id` - Obtener uno
- `PUT /api/patients/:id` - Actualizar
- `DELETE /api/patients/:id` - Eliminar

### Doctores (6 endpoints)
- `POST /api/doctors` - Crear
- `GET /api/doctors` - Listar todos
- `GET /api/doctors/:id` - Obtener uno
- `GET /api/doctors/specialty/:specialty` - Por especialidad
- `PUT /api/doctors/:id` - Actualizar
- `DELETE /api/doctors/:id` - Eliminar

### Citas (7 endpoints)
- `POST /api/appointments` - Crear
- `GET /api/appointments` - Listar todas
- `GET /api/appointments/:id` - Obtener una
- `GET /api/appointments/doctor/:doctorId` - Por doctor (con $lookup)
- `PUT /api/appointments/:id` - Actualizar completa
- `PUT /api/appointments/:id/status` - Actualizar estado
- `DELETE /api/appointments/:id` - Eliminar

### Registros Médicos (6 endpoints)
- `POST /api/medical-records` - Crear
- `GET /api/medical-records` - Listar todos
- `GET /api/medical-records/:id` - Obtener uno (con $lookup)
- `GET /api/medical-records/patient/:patientId` - Por paciente (con $lookup)
- `PUT /api/medical-records/:id` - Actualizar
- `DELETE /api/medical-records/:id` - Eliminar

**Total: 24 endpoints REST implementados** 🎉

---

## 📝 Notas Técnicas

- Soft delete en pacientes y doctores (cambia estado a 'inactive')
- Hard delete en citas y registros médicos
- Validación de campos requeridos en todos los POST
- Manejo de errores con códigos HTTP apropiados
- Timestamps automáticos (createdAt, updatedAt)
- ObjectId validado en todas las referencias

---

**Desarrollado con:** Node.js, Express, MongoDB
**Versión:** 1.0.0
**Fecha:** Noviembre 2025
