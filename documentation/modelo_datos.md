# 📊 Modelo de Datos - Sistema de Gestión de Citas Médicas

## 🗄️ Arquitectura de Base de Datos

Este sistema utiliza **MongoDB** como base de datos NoSQL, implementando un diseño orientado a documentos con referencias entre colecciones para optimizar consultas y mantener la integridad de datos.

---

## 📋 Colecciones Principales

### 1. 👥 **Patients** (Pacientes)

Almacena información completa de los pacientes registrados en el sistema.

#### Estructura del Documento:

```javascript
{
  _id: ObjectId("..."),
  personalInfo: {
    firstName: String,        // Nombre del paciente
    lastName: String,         // Apellido del paciente
    dateOfBirth: Date,        // Fecha de nacimiento
    gender: String,           // Género (M/F/Otro)
    nationalId: String        // Cédula de identidad (único)
  },
  contact: {
    email: String,           // Correo electrónico
    phone: String,           // Teléfono
    address: {
      street: String,        // Calle
      city: String,          // Ciudad
      postalCode: String,    // Código postal
      country: String        // País
    }
  },
  medicalInfo: {
    bloodType: String,              // Tipo de sangre (A+, O-, etc.)
    allergies: [String],            // Lista de alergias
    chronicConditions: [String],    // Condiciones crónicas
    insuranceProvider: String,      // Proveedor de seguro
    insuranceNumber: String         // Número de póliza
  },
  emergencyContact: {
    name: String,             // Nombre del contacto
    relationship: String,     // Relación con el paciente
    phone: String            // Teléfono de emergencia
  },
  status: String,            // Estado: "active" | "inactive"
  createdAt: Date,          // Fecha de creación
  updatedAt: Date           // Fecha de última actualización
}
```

#### Validación de Esquema:

```javascript
{
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
        status: { 
          bsonType: "string", 
          enum: ["active", "inactive"] 
        }
      }
    }
  }
}
```

#### Índices:

- `personalInfo.nationalId` - **ÚNICO** (búsqueda rápida por cédula)
- `contact.email` - (búsqueda por email)
- `status` - (filtrado por estado)

---

### 2. 🩺 **Doctors** (Doctores)

Almacena información de los médicos que atienden en el sistema.

#### Estructura del Documento:

```javascript
{
  _id: ObjectId("..."),
  personalInfo: {
    firstName: String,        // Nombre del doctor
    lastName: String,         // Apellido del doctor
    dateOfBirth: Date,        // Fecha de nacimiento
    gender: String           // Género
  },
  professional: {
    licenseNumber: String,       // Número de licencia médica (único)
    specialties: [String],       // Especialidades médicas
    yearsExperience: Number,     // Años de experiencia
    education: [String]          // Formación académica
  },
  contact: {
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      postalCode: String
    }
  },
  schedule: {
    workingDays: [String],    // Días laborables ["Lunes", "Martes", ...]
    startTime: String,        // Hora de inicio "09:00"
    endTime: String          // Hora de fin "17:00"
  },
  status: String,            // Estado: "active" | "inactive" | "vacation"
  createdAt: Date,
  updatedAt: Date
}
```

#### Validación de Esquema:

```javascript
{
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
        status: { 
          bsonType: "string", 
          enum: ["active", "inactive", "vacation"] 
        }
      }
    }
  }
}
```

#### Índices:

- `professional.licenseNumber` - **ÚNICO** (validación de licencia)
- `professional.specialties` - (búsqueda por especialidad)
- `status` - (filtrado de doctores activos)

---

### 3. 📅 **Appointments** (Citas)

Gestiona las citas médicas entre pacientes y doctores.

#### Estructura del Documento:

```javascript
{
  _id: ObjectId("..."),
  doctorId: ObjectId("..."),      // Referencia al doctor
  patientId: ObjectId("..."),     // Referencia al paciente
  dateTime: Date,                 // Fecha y hora de la cita
  duration: Number,               // Duración en minutos (default: 30)
  status: String,                 // Estado de la cita
  reason: String,                 // Motivo de la consulta
  notes: String,                  // Notas adicionales
  cancellationReason: String,     // Razón de cancelación (si aplica)
  createdAt: Date,
  updatedAt: Date
}
```

#### Estados Posibles:

- `scheduled` - Cita programada
- `confirmed` - Cita confirmada
- `completed` - Cita completada
- `cancelled` - Cita cancelada
- `no-show` - Paciente no asistió

#### Validación de Esquema:

```javascript
{
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
}
```

#### Índices:

- `doctorId, dateTime` - **COMPUESTO** (evitar conflictos de horarios)
- `patientId, dateTime` - (historial de citas del paciente)
- `status, dateTime` - (consultas por estado)

---

### 4. 📋 **Medical Records** (Historial Médico)

Registra el historial médico de cada consulta realizada.

#### Estructura del Documento:

```javascript
{
  _id: ObjectId("..."),
  patientId: ObjectId("..."),     // Referencia al paciente
  doctorId: ObjectId("..."),      // Referencia al doctor
  date: Date,                     // Fecha de la consulta
  diagnosis: String,              // Diagnóstico
  treatment: String,              // Tratamiento prescrito
  prescriptions: [                // Recetas médicas
    {
      medication: String,         // Nombre del medicamento
      dosage: String,            // Dosis
      frequency: String,         // Frecuencia
      duration: String          // Duración del tratamiento
    }
  ],
  notes: String,                 // Notas adicionales del doctor
  vitalSigns: {                  // Signos vitales
    bloodPressure: String,       // Presión arterial "120/80"
    heartRate: Number,           // Frecuencia cardíaca
    temperature: Number          // Temperatura corporal
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### Validación de Esquema:

```javascript
{
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
}
```

#### Índices:

- `patientId, date` - **COMPUESTO** (historial cronológico del paciente)
- `doctorId, date` - (registros por doctor)

---

## 🔗 Relaciones entre Colecciones

### Diagrama de Relaciones:

```
┌─────────────┐
│  Patients   │
│  (Pacientes)│
└──────┬──────┘
       │ 1:N
       ├─────────────┐
       │             │
       ▼             ▼
┌─────────────┐ ┌──────────────┐
│Appointments │ │Medical Records│
│   (Citas)   │ │  (Historial) │
└──────┬──────┘ └──────┬───────┘
       │               │
       │ N:1           │ N:1
       ▼               ▼
┌─────────────┐ ┌─────────────┐
│   Doctors   │◄┘   Doctors   │
│  (Doctores) │    (Doctores) │
└─────────────┘ └─────────────┘
```

### Tipos de Relación:

1. **Patient ↔ Appointments** (1:N)
   - Un paciente puede tener múltiples citas
   - Una cita pertenece a un solo paciente

2. **Doctor ↔ Appointments** (1:N)
   - Un doctor puede tener múltiples citas
   - Una cita es atendida por un solo doctor

3. **Patient ↔ Medical Records** (1:N)
   - Un paciente puede tener múltiples registros médicos
   - Un registro médico pertenece a un solo paciente

4. **Doctor ↔ Medical Records** (1:N)
   - Un doctor puede crear múltiples registros
   - Un registro es creado por un solo doctor

---

## 🔍 Estrategia de Índices

### Índices por Colección:

| Colección | Campo(s) | Tipo | Propósito |
|-----------|----------|------|-----------|
| Patients | `personalInfo.nationalId` | ÚNICO | Evitar duplicados de cédula |
| Patients | `contact.email` | SIMPLE | Búsqueda rápida por email |
| Doctors | `professional.licenseNumber` | ÚNICO | Validar licencia médica |
| Doctors | `professional.specialties` | ARRAY | Búsqueda por especialidad |
| Appointments | `doctorId, dateTime` | COMPUESTO | Prevenir conflictos de horario |
| Appointments | `patientId, dateTime` | COMPUESTO | Historial de citas |
| Appointments | `status, dateTime` | COMPUESTO | Filtrado eficiente |
| Medical Records | `patientId, date` | COMPUESTO | Historial médico cronológico |
| Medical Records | `doctorId, date` | COMPUESTO | Registros por doctor |

### Beneficios de la Indexación:

✅ **Búsquedas Rápidas**: O(log n) en lugar de O(n)  
✅ **Integridad de Datos**: Índices únicos previenen duplicados  
✅ **Ordenamiento Eficiente**: Índices compuestos optimizan queries complejas  
✅ **Validación Automática**: Restricciones de unicidad a nivel de BD  

---

## 📐 Patrones de Diseño Utilizados

### 1. **Embedding (Documentos Embebidos)**

Usado para datos que:
- Siempre se consultan juntos
- No cambian frecuentemente
- Tienen relación 1:1 o 1:pocos

**Ejemplos:**
- `personalInfo` dentro de `Patient`
- `contact` dentro de `Doctor`
- `vitalSigns` dentro de `MedicalRecord`

### 2. **Referencing (Referencias)**

Usado para:
- Relaciones N:M
- Datos que cambian independientemente
- Evitar duplicación de datos grandes

**Ejemplos:**
- `doctorId` y `patientId` en `Appointments`
- Referencias por ObjectId entre colecciones

### 3. **Schema Validation**

Implementado con `$jsonSchema` para:
- Validar tipos de datos
- Requerir campos obligatorios
- Definir valores permitidos (enum)

---

## 🎯 Consultas Optimizadas

### Ejemplos de Queries Comunes:

#### 1. Buscar paciente por cédula:
```javascript
db.patients.findOne({ "personalInfo.nationalId": "12345678A" })
```
✅ Usa índice único en `personalInfo.nationalId`

#### 2. Listar citas de un doctor para hoy:
```javascript
db.appointments.find({
  doctorId: ObjectId("..."),
  dateTime: { 
    $gte: ISODate("2025-01-15T00:00:00Z"),
    $lt: ISODate("2025-01-16T00:00:00Z")
  },
  status: { $in: ["scheduled", "confirmed"] }
})
```
✅ Usa índice compuesto `doctorId, dateTime`

#### 3. Historial médico de un paciente:
```javascript
db.medical_records.find({
  patientId: ObjectId("...")
}).sort({ date: -1 })
```
✅ Usa índice compuesto `patientId, date`

#### 4. Buscar doctores por especialidad:
```javascript
db.doctors.find({
  "professional.specialties": "Cardiología",
  status: "active"
})
```
✅ Usa índice en `professional.specialties`

---

## 📊 Ejemplo de Datos

### Paciente:
```javascript
{
  "_id": ObjectId("6741a1b2c3d4e5f6g7h8i9j0"),
  "personalInfo": {
    "firstName": "María",
    "lastName": "López",
    "dateOfBirth": ISODate("1990-08-12"),
    "gender": "F",
    "nationalId": "87654321B"
  },
  "contact": {
    "email": "maria.lopez@email.com",
    "phone": "+34699887766",
    "address": {
      "street": "Calle Salud 123",
      "city": "Madrid",
      "postalCode": "28013",
      "country": "España"
    }
  },
  "medicalInfo": {
    "bloodType": "A+",
    "allergies": ["polvo", "mariscos"],
    "chronicConditions": ["asma"],
    "insuranceProvider": "Adeslas",
    "insuranceNumber": "ADE987654"
  },
  "emergencyContact": {
    "name": "José López",
    "relationship": "esposo",
    "phone": "+34611223344"
  },
  "status": "active",
  "createdAt": ISODate("2025-01-10T10:00:00Z")
}
```

### Doctor:
```javascript
{
  "_id": ObjectId("5631b2c3d4e5f6g7h8i9j0k1"),
  "personalInfo": {
    "firstName": "Ana",
    "lastName": "García",
    "dateOfBirth": ISODate("1978-05-20"),
    "gender": "F"
  },
  "professional": {
    "licenseNumber": "MED12345",
    "specialties": ["Cardiología", "Medicina Interna"],
    "yearsExperience": 15,
    "education": [
      "Universidad de Madrid",
      "Especialización en Cardiología"
    ]
  },
  "contact": {
    "email": "ana.garcia@hospital.com",
    "phone": "+34611223344"
  },
  "schedule": {
    "workingDays": ["Lunes", "Martes", "Miércoles", "Jueves"],
    "startTime": "09:00",
    "endTime": "17:00"
  },
  "status": "active",
  "createdAt": ISODate("2025-01-08T08:00:00Z")
}
```

---

## ✅ Ventajas del Modelo de Datos

1. **Flexibilidad**: Estructura de documentos adaptable
2. **Performance**: Índices optimizados para consultas frecuentes
3. **Integridad**: Validación de esquema a nivel de BD
4. **Escalabilidad**: Diseño preparado para crecimiento
5. **Mantenibilidad**: Relaciones claras y documentadas

---

**Última actualización**: Noviembre 2025  
**Versión del modelo**: 1.0
