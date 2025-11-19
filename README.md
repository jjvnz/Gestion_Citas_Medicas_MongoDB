# 🏥 Sistema de Gestión de Citas Médicas con MongoDB

Sistema web completo para la gestión de citas médicas desarrollado con MongoDB, Node.js y JavaScript.

## 🚀 Características

- ✅ **Autenticación JWT** con Passport.js
- ✅ **Gestión de usuarios** con roles (admin, doctor, user)
- ✅ Gestión completa de pacientes y doctores
- ✅ Sistema de agendamiento de citas con validaciones
- ✅ Historial médico digital
- ✅ Búsquedas por referencia entre colecciones
- ✅ Interfaz web responsive
- ✅ API RESTful completa
- ✅ Contraseñas hasheadas con bcrypt

## 🗄️ Estructura de la Base de Datos

### Colecciones Principales

1. **users** - Usuarios del sistema (con autenticación JWT)
2. **patients** - Información de pacientes
3. **doctors** - Información de doctores
4. **appointments** - Citas médicas
5. **medical_records** - Historial médico

### Índices Implementados

- `email` y `username` (únicos) en users
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