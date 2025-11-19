// Patients frontend logic

async function loadPatients() {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/patients`);
        const patients = await response.json();
        
        const container = document.getElementById('lista-pacientes');
        if (!container) return;
        
        if (patients.length === 0) {
            container.innerHTML = '<p>No hay pacientes registrados</p>';
            return;
        }
        
        container.innerHTML = patients.map(patient => `
            <div class="card">
                <h4>${patient.personalInfo.firstName} ${patient.personalInfo.lastName}</h4>
                <p><strong>Cédula:</strong> ${patient.personalInfo.nationalId}</p>
                <p><strong>Email:</strong> ${patient.contact.email}</p>
                <p><strong>Teléfono:</strong> ${patient.contact.phone}</p>
                <p><strong>Estado:</strong> <span class="status ${patient.status}">${patient.status === 'active' ? 'Activo' : 'Inactivo'}</span></p>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error cargando pacientes:', error);
        showNotification('Error cargando pacientes', 'error');
    }
}

async function loadPatientsForHistory() {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/patients`);
        const patients = await response.json();
        
        // Cargar en el selector de visualización de historial
        const selectHistorial = document.getElementById('paciente-historial');
        if (selectHistorial) {
            selectHistorial.innerHTML = '<option value="">Seleccionar paciente...</option>' +
                patients.map(patient => `
                    <option value="${patient._id}">
                        ${patient.personalInfo.firstName} ${patient.personalInfo.lastName} - 
                        ${patient.personalInfo.nationalId}
                    </option>
                `).join('');
        }
        
        // Cargar en el selector de creación de registro
        const selectRegistro = document.getElementById('paciente-registro');
        if (selectRegistro) {
            selectRegistro.innerHTML = '<option value="">Seleccionar paciente...</option>' +
                patients.map(patient => `
                    <option value="${patient._id}">
                        ${patient.personalInfo.firstName} ${patient.personalInfo.lastName} - 
                        ${patient.personalInfo.nationalId}
                    </option>
                `).join('');
        }
            
    } catch (error) {
        console.error('Error cargando pacientes para historial:', error);
        showNotification('Error cargando pacientes para historial', 'error');
    }
}

async function loadDoctorsForHistory() {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/doctors`);
        const doctors = await response.json();
        
        const select = document.getElementById('doctor-registro');
        if (!select) return;
        
        select.innerHTML = '<option value="">Seleccionar doctor...</option>' +
            doctors.filter(doctor => doctor.status === 'active')
                .map(doctor => `
                    <option value="${doctor._id}">
                        Dr. ${doctor.personalInfo.firstName} ${doctor.personalInfo.lastName} - 
                        ${doctor.professional.specialties.join(', ')}
                    </option>
                `).join('');
                
    } catch (error) {
        console.error('Error cargando doctores:', error);
        showNotification('Error cargando doctores', 'error');
    }
}

async function loadPatientHistory(patientId) {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/medical-records/patient/${patientId}`);
        const records = await response.json();
        
        const container = document.getElementById('historial-contenido');
        if (!container) return;
        
        if (records.length === 0) {
            container.innerHTML = '<p class="no-data">No hay registros médicos para este paciente</p>';
            return;
        }
        
        container.innerHTML = records.map(record => `
            <div class="card">
                <h4>📅 ${new Date(record.date).toLocaleDateString('es-ES', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</h4>
                ${record.doctorName ? `<p><strong>👨‍⚕️ Doctor:</strong> ${record.doctorName}</p>` : ''}
                <p><strong>🩺 Diagnóstico:</strong> ${record.diagnosis || 'No especificado'}</p>
                ${record.treatment ? `<p><strong>💊 Tratamiento:</strong> ${record.treatment}</p>` : ''}
                ${record.prescriptions && record.prescriptions.length > 0 ? `
                    <div>
                        <p><strong>Medicamentos:</strong></p>
                        <ul>
                            ${record.prescriptions.map(med => `<li>${med.name || med} - ${med.dosage || ''}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                ${record.notes ? `<p><strong>📝 Notas:</strong> ${record.notes}</p>` : ''}
            </div>
        `).join('');
        
    } catch (error) {
        showNotification('Error cargando historial médico', 'error');
    }
}
