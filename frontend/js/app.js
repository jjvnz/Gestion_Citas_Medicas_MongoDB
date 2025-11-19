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
    
    // Inicializar sección de historial médico si corresponde
    if (sectionId === 'historial' && typeof loadMedicalRecordsPage === 'function') {
        loadMedicalRecordsPage();
    }
    
    // Cargar datos específicos de la sección
    loadSectionData(sectionId);
}

function getUserRole() {
    return localStorage.getItem('userRole') || 'user';
}

async function loadSectionData(sectionId) {
    if (!getAuthToken()) {
        return;
    }
    
    const userRole = getUserRole();
    
    switch(sectionId) {
        case 'inicio':
            await loadDashboardStats();
            break;
        case 'citas':
            await loadAppointments();
            await loadDoctorsForAppointments();
            await loadPatientsForAppointments();
            
            // Receptionist y admin pueden crear/gestionar citas
            if (['receptionist', 'admin'].includes(userRole)) {
                const formSection = document.querySelector('#citas .form-section');
                if (formSection) formSection.style.display = 'block';
            } else if (userRole === 'doctor') {
                // Doctor solo ve y completa citas, no crea
                const formSection = document.querySelector('#citas .form-section');
                if (formSection) formSection.style.display = 'none';
                const listTitle = document.querySelector('#citas .list-section h3');
                if (listTitle) listTitle.textContent = 'Mis Citas Programadas';
            }
            break;
        case 'pacientes':
            await loadPatients();
            
            // Receptionist y admin pueden crear/editar pacientes
            if (['receptionist', 'admin'].includes(userRole)) {
                const formSection = document.querySelector('#pacientes .form-section');
                if (formSection) formSection.style.display = 'block';
            } else if (userRole === 'doctor') {
                // Doctor solo ve pacientes, no crea/edita
                const formSection = document.querySelector('#pacientes .form-section');
                if (formSection) formSection.style.display = 'none';
            }
            break;
        case 'doctores':
            await loadDoctors();
            break;
        case 'historial':
            // Solo doctor y admin tienen acceso al historial médico
            if (['doctor', 'admin'].includes(userRole)) {
                const formSection = document.querySelector('#historial .form-section');
                const listSection = document.querySelector('#historial .list-section');
                if (formSection) formSection.style.display = 'block';
                if (listSection) {
                    const selectGroup = listSection.querySelector('.form-group');
                    if (selectGroup) selectGroup.style.display = 'block';
                }
                await loadPatientsForHistory();
                await loadDoctorsForHistory();
            } else {
                // Receptionist no tiene acceso
                const historialSection = document.getElementById('historial');
                if (historialSection) {
                    historialSection.innerHTML = `
                        <div style="text-align: center; padding: 4rem; background: white; border-radius: 16px; box-shadow: var(--shadow-md);">
                            <i class="fas fa-lock" style="font-size: 4rem; color: var(--warning); margin-bottom: 1rem;"></i>
                            <h2 style="color: var(--gray-800); margin-bottom: 1rem;">Acceso Restringido</h2>
                            <p style="color: var(--gray-600);">El historial médico es información sensible y privada.</p>
                            <p style="color: var(--gray-600);">Solo doctores y administradores tienen acceso a esta sección.</p>
                        </div>
                    `;
                }
            }
            break;
    }
}

async function loadDashboardStats() {
    if (!getAuthToken || !getAuthToken()) {
        return;
    }
    
    const userRole = getUserRole();
    
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
        
        // Estadísticas para todos los roles
        document.getElementById('total-pacientes').textContent = patientsArray.length;
        document.getElementById('total-doctores').textContent = 
            doctorsArray.filter(d => d.status === 'active').length;
        document.getElementById('citas-hoy').textContent = appointmentsToday.length;
        document.getElementById('citas-pendientes').textContent = pendingAppointments.length;
        
        // Ajustar textos según rol
        if (userRole === 'doctor') {
            const statCard = document.querySelector('.stat-card-warning p');
            if (statCard) statCard.textContent = 'Mis Citas Hoy';
            const statCard2 = document.querySelector('.stat-card-info p');
            if (statCard2) statCard2.textContent = 'Mis Citas Pendientes';
        }
        
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
    
}

// Evento para cargar página de historiales cuando se muestra la sección
function initMedicalRecordsSection() {
    if (typeof loadMedicalRecordsPage === 'function') {
        loadMedicalRecordsPage();
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
            nationalId: document.getElementById('cedula-paciente').value,
            dateOfBirth: document.getElementById('fecha-nacimiento-paciente').value,
            gender: document.getElementById('genero-paciente').value
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
            // Mostrar detalles de validación si existen
            let errorMsg = result.error || result.message || 'Error desconocido';
            if (result.details && Array.isArray(result.details)) {
                errorMsg += ': ' + result.details.join(', ');
            }
            showNotification(errorMsg, 'error');
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
        
        // Verificar si la respuesta es exitosa
        if (!response.ok) {
            const errorData = await response.json();
            
            if (response.status === 403) {
                const container = document.getElementById('historial-contenido');
                if (container) {
                    container.innerHTML = `
                        <div class="no-data" style="background: #FEF3C7; color: #92400E; padding: 2rem; border-radius: 12px; border-left: 4px solid #F59E0B;">
                            <i class="fas fa-lock" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                            <p style="font-weight: 600; margin-bottom: 0.5rem;">Acceso restringido</p>
                            <p>No tienes permisos para ver el historial médico de este paciente.</p>
                            <p style="font-size: 0.9rem; margin-top: 0.5rem;">Solo usuarios con rol de Doctor o Administrador pueden acceder a esta información.</p>
                        </div>
                    `;
                }
                return;
            }
            
            throw new Error(errorData.message || 'Error al cargar historial médico');
        }
        
        const records = await response.json();
        
        const container = document.getElementById('historial-contenido');
        if (!container) return;
        
        // Manejar diferentes formatos de respuesta
        const recordsArray = Array.isArray(records) ? records : 
                           (records.data && Array.isArray(records.data) ? records.data : []);
        
        if (recordsArray.length === 0) {
            container.innerHTML = `
                <div class="no-data" style="background: #DBEAFE; color: #1E40AF; padding: 2rem; border-radius: 12px; border-left: 4px solid #3B82F6;">
                    <i class="fas fa-info-circle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p style="font-weight: 600; margin-bottom: 0.5rem;">Sin registros médicos</p>
                    <p>Este paciente aún no tiene registros médicos en el sistema.</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem; opacity: 0.8;">
                        <strong>Nota:</strong> Las citas y los registros médicos son diferentes. 
                        Usa el formulario superior para crear un nuevo registro médico después de una consulta.
                    </p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = recordsArray.map(record => `
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
        console.error('Error cargando historial médico:', error);
        const container = document.getElementById('historial-contenido');
        if (container) {
            container.innerHTML = `
                <div class="no-data" style="background: #FEE2E2; color: #991B1B; padding: 2rem; border-radius: 12px; border-left: 4px solid #EF4444;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p style="font-weight: 600; margin-bottom: 0.5rem;">Error al cargar historial médico</p>
                    <p style="font-size: 0.9rem;">${error.message || 'Ocurrió un error inesperado'}</p>
                </div>
            `;
        }
    }
}

// Función eliminada - ahora se usa medicalRecords.js