function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 2rem;
        border-radius: 5px;
        color: white;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    
    if (type === 'success') notification.style.background = '#28a745';
    else if (type === 'error') notification.style.background = '#dc3545';
    else notification.style.background = '#17a2b8';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Navegación entre secciones
function showSection(sectionId) {
    // Ocultar todas las secciones
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remover active de todos los enlaces
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Mostrar sección seleccionada
    document.getElementById(sectionId).classList.add('active');
    
    // Activar enlace correspondiente
    document.querySelector(`[href="#${sectionId}"]`).classList.add('active');
    
    // Cargar datos específicos de la sección
    loadSectionData(sectionId);
}

async function loadSectionData(sectionId) {
    if (!getAuthToken || !getAuthToken()) {
        return;
    }
    
    switch(sectionId) {
        case 'inicio':
            await loadDashboardStats();
            break;
        case 'citas':
            await loadAppointments();
            await loadDoctorsForAppointments();
            await loadPatientsForAppointments();
            break;
        case 'pacientes':
            await loadPatients();
            break;
        case 'doctores':
            await loadDoctors();
            break;
        case 'historial':
            await loadPatientsForHistory();
            await loadDoctorsForHistory();
            break;
    }
}

async function loadDashboardStats() {
    if (!getAuthToken || !getAuthToken()) {
        return;
    }
    
    try {
        const [patientsRes, doctorsRes, appointmentsRes] = await Promise.all([
            authenticatedFetch(`${API_BASE_URL}/patients`),
            authenticatedFetch(`${API_BASE_URL}/doctors`),
            authenticatedFetch(`${API_BASE_URL}/appointments`)
        ]);
        
        const patients = await patientsRes.json();
        const doctors = await doctorsRes.json();
        const appointments = await appointmentsRes.json();
        
        // Validar que sean arrays
        const patientsArray = Array.isArray(patients) ? patients : [];
        const doctorsArray = Array.isArray(doctors) ? doctors : [];
        const appointmentsArray = Array.isArray(appointments) ? appointments : [];
        
        const today = new Date().toISOString().split('T')[0];
        const appointmentsToday = appointmentsArray.filter(apt => 
            apt.dateTime && apt.dateTime.startsWith(today) && 
            ['scheduled', 'confirmed'].includes(apt.status)
        );
        
        const pendingAppointments = appointmentsArray.filter(apt => 
            ['scheduled', 'confirmed'].includes(apt.status)
        );
        
        document.getElementById('total-pacientes').textContent = patientsArray.length;
        document.getElementById('total-doctores').textContent = 
            doctorsArray.filter(d => d.status === 'active').length;
        document.getElementById('citas-hoy').textContent = appointmentsToday.length;
        document.getElementById('citas-pendientes').textContent = pendingAppointments.length;
        
    } catch (error) {
        const totalPacientes = document.getElementById('total-pacientes');
        const totalDoctores = document.getElementById('total-doctores');
        const citasHoy = document.getElementById('citas-hoy');
        const citasPendientes = document.getElementById('citas-pendientes');
        
        if (totalPacientes) totalPacientes.textContent = '0';
        if (totalDoctores) totalDoctores.textContent = '0';
        if (citasHoy) citasHoy.textContent = '0';
        if (citasPendientes) citasPendientes.textContent = '0';
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Configurar navegación
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('href').substring(1);
            showSection(sectionId);
        });
    });
    
    setupFormHandlers();
});

// Configurar manejadores de formularios
function setupFormHandlers() {
    // Formulario de citas
    const citaForm = document.getElementById('cita-form');
    if (citaForm) {
        citaForm.addEventListener('submit', handleCitaSubmit);
    }
    
    // Formulario de pacientes
    const pacienteForm = document.getElementById('paciente-form');
    if (pacienteForm) {
        pacienteForm.addEventListener('submit', handlePacienteSubmit);
    }
    
    // Selector de historial
    const pacienteHistorial = document.getElementById('paciente-historial');
    if (pacienteHistorial) {
        pacienteHistorial.addEventListener('change', handleHistorialChange);
    }
    
    // Formulario de historial médico
    const historialForm = document.getElementById('historial-form');
    if (historialForm) {
        historialForm.addEventListener('submit', handleHistorialSubmit);
    }
}

// Manejador de envío de formulario de citas
async function handleCitaSubmit(e) {
    e.preventDefault();
    
    const formData = {
        doctorId: document.getElementById('doctor-cita').value,
        patientId: document.getElementById('paciente-cita').value,
        dateTime: document.getElementById('fecha-cita').value,
        reason: document.getElementById('motivo-cita').value
    };
    
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/appointments`, {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Cita agendada exitosamente', 'success');
            document.getElementById('cita-form').reset();
            await loadAppointments();
        } else {
            showNotification('Error al agendar cita: ' + result.message, 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
    }
}

async function handlePacienteSubmit(e) {
    e.preventDefault();
    
    const formData = {
        personalInfo: {
            firstName: document.getElementById('nombre-paciente').value,
            lastName: document.getElementById('apellido-paciente').value,
            nationalId: document.getElementById('cedula-paciente').value
        },
        contact: {
            email: document.getElementById('email-paciente').value,
            phone: document.getElementById('telefono-paciente').value
        },
        status: 'active'
    };
    
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/patients`, {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showNotification('Paciente registrado exitosamente', 'success');
            document.getElementById('paciente-form').reset();
            await loadPatients();
        } else {
            const errorMsg = result.error || result.message || 'Error desconocido';
            showNotification('Error al registrar paciente: ' + errorMsg, 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
    }
}

async function handleHistorialChange(e) {
    const patientId = e.target.value;
    if (patientId) {
        await loadMedicalHistory(patientId);
    } else {
        const container = document.getElementById('historial-contenido');
        if (container) {
            container.innerHTML = '<p class="no-data">Seleccione un paciente para ver su historial</p>';
        }
    }
}

async function loadMedicalHistory(patientId) {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/medical-records/patient/${patientId}`);
        const records = await response.json();
        
        const container = document.getElementById('historial-contenido');
        if (!container) return;
        
        if (!records || records.length === 0) {
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
                ${record.doctorName ? `<p><strong>👨‍⚕️ Doctor:</strong> Dr. ${record.doctorName}</p>` : ''}
                <p><strong>🩺 Diagnóstico:</strong> ${record.diagnosis}</p>
                ${record.treatment ? `<p><strong>💊 Tratamiento:</strong> ${record.treatment}</p>` : ''}
                ${record.prescriptions && record.prescriptions.length > 0 ? `
                    <div>
                        <p><strong>📋 Medicamentos:</strong></p>
                        <ul>
                            ${record.prescriptions.map(med => `
                                <li>${typeof med === 'string' ? med : `${med.name || ''} ${med.dosage ? '- ' + med.dosage : ''}`}</li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
                ${record.notes ? `<p><strong>📝 Notas:</strong> ${record.notes}</p>` : ''}
                ${record.vitalSigns && Object.keys(record.vitalSigns).length > 0 ? `
                    <div>
                        <p><strong>💓 Signos Vitales:</strong></p>
                        <ul>
                            ${record.vitalSigns.bloodPressure ? `<li>Presión: ${record.vitalSigns.bloodPressure}</li>` : ''}
                            ${record.vitalSigns.heartRate ? `<li>Frecuencia cardíaca: ${record.vitalSigns.heartRate} bpm</li>` : ''}
                            ${record.vitalSigns.temperature ? `<li>Temperatura: ${record.vitalSigns.temperature}°C</li>` : ''}
                            ${record.vitalSigns.weight ? `<li>Peso: ${record.vitalSigns.weight} kg</li>` : ''}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `).join('');
    } catch (error) {
        const container = document.getElementById('historial-contenido');
        if (container) {
            container.innerHTML = '<p class="no-data">Error cargando historial médico</p>';
        }
    }
}

// Manejador de envío de formulario de historial médico
async function handleHistorialSubmit(e) {
    e.preventDefault();
    
    const formData = {
        patientId: document.getElementById('paciente-registro').value,
        doctorId: document.getElementById('doctor-registro').value,
        date: document.getElementById('fecha-registro').value,
        diagnosis: document.getElementById('diagnostico').value,
        treatment: document.getElementById('tratamiento').value || '',
        notes: document.getElementById('notas-registro').value || '',
        prescriptions: []
    };
    
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/medical-records`, {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showNotification('Registro médico creado exitosamente', 'success');
            document.getElementById('historial-form').reset();
            
            const selectedPatient = document.getElementById('paciente-historial').value;
            if (selectedPatient) {
                await loadMedicalHistory(selectedPatient);
            }
        } else {
            const errorMsg = result.error || result.message || 'Error desconocido';
            showNotification('Error al crear registro: ' + errorMsg, 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
    }
}