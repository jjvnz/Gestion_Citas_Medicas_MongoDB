// Appointments frontend logic
// Funciones específicas para la gestión de citas

async function loadAppointments() {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/appointments`);
        const appointments = await response.json();
        
        const container = document.getElementById('lista-citas');
        if (!container) return;
        
        if (appointments.length === 0) {
            container.innerHTML = '<p>No hay citas programadas</p>';
            return;
        }
        
        container.innerHTML = appointments.map(appointment => `
            <div class="card">
                <h4>${new Date(appointment.dateTime).toLocaleString('es-ES')}</h4>
                <p><strong>Estado:</strong> <span class="status ${appointment.status}">${getStatusText(appointment.status)}</span></p>
                <p><strong>Motivo:</strong> ${appointment.reason || 'No especificado'}</p>
                <p><strong>Duración:</strong> ${appointment.duration} minutos</p>
                <div class="card-actions">
                    <button onclick="updateAppointmentStatus('${appointment._id}', 'confirmed')" 
                            ${appointment.status !== 'scheduled' ? 'disabled' : ''}
                            class="btn-small btn-success">Confirmar</button>
                    <button onclick="updateAppointmentStatus('${appointment._id}', 'cancelled')" 
                            ${['cancelled', 'completed'].includes(appointment.status) ? 'disabled' : ''}
                            class="btn-small btn-danger">Cancelar</button>
                    <button onclick="updateAppointmentStatus('${appointment._id}', 'completed')" 
                            ${appointment.status !== 'confirmed' ? 'disabled' : ''}
                            class="btn-small btn-primary">Completar</button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error cargando citas:', error);
        showNotification('Error cargando citas', 'error');
    }
}

async function loadDoctorsForAppointments() {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/doctors`);
        const doctors = await response.json();
        
        const select = document.getElementById('doctor-cita');
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

async function loadPatientsForAppointments() {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/patients`);
        const patients = await response.json();
        
        const select = document.getElementById('paciente-cita');
        if (!select) return;
        
        select.innerHTML = '<option value="">Seleccionar paciente...</option>' +
            patients.filter(patient => patient.status === 'active')
                .map(patient => `
                    <option value="${patient._id}">
                        ${patient.personalInfo.firstName} ${patient.personalInfo.lastName} - 
                        ${patient.personalInfo.nationalId}
                    </option>
                `).join('');
                
    } catch (error) {
        console.error('Error cargando pacientes:', error);
        showNotification('Error cargando pacientes', 'error');
    }
}

async function updateAppointmentStatus(appointmentId, newStatus) {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/appointments/${appointmentId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
            showNotification(`Cita ${getStatusText(newStatus).toLowerCase()} exitosamente`, 'success');
            await loadAppointments();
        } else {
            showNotification('Error actualizando cita', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
        console.error('Error:', error);
    }
}

function getStatusText(status) {
    const statusMap = {
        'scheduled': 'Programada',
        'confirmed': 'Confirmada',
        'completed': 'Completada',
        'cancelled': 'Cancelada',
        'no-show': 'No Presentado'
    };
    return statusMap[status] || status;
}