# 🏥 Sistema de Gestión de Citas Médicas con MongoDB

Sistema web completo para la gestión de citas médicas desarrollado con MongoDB, Node.js y JavaScript.

## 🚀 Características

- ✅ Gestión completa de pacientes y doctores
- ✅ Sistema de agendamiento de citas con validaciones
- ✅ Historial médico digital
- ✅ Búsquedas por referencia entre colecciones
- ✅ Interfaz web responsive
- ✅ API RESTful completa

## 🗄️ Estructura de la Base de Datos

### Colecciones Principales

1. **patients** - Información de pacientes
2. **doctors** - Información de doctores
3. **appointments** - Citas médicas
4. **medical_records** - Historial médico

### Índices Implementados

- `personalInfo.nationalId` (único) en patients
- `professional.licenseNumber` (único) en doctors
- `doctorId + dateTime` en appointments
- `patientId + date` en medical_records

## 🛠️ Instalación y Configuración

### Prerrequisitos

- MongoDB 5.0+
- Node.js 16+
- Navegador web moderno

### 1. Clonar o crear la estructura del proyecto

```bash
mkdir Proyecto_Gestion_Citas_Medicas_MongoDB
cd Proyecto_Gestion_Citas_Medicas_MongoDB