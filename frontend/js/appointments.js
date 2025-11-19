// Appointments frontend logic
// Funciones específicas para la gestión de citas

async function loadAppointments() {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/appointments`);
        const appointments = await response.json();
        const userRole = getUserRole();
        
        const container = document.getElementById('lista-citas');
        if (!container) return;
        
        if (appointments.length === 0) {
            container.innerHTML = '<p class="no-data">No hay citas programadas</p>';
            return;
        }
        
        container.innerHTML = appointments.map(appointment => `
            <div class="card">
                <h4>${new Date(appointment.dateTime).toLocaleString('es-ES')}</h4>
                <p><strong>Estado:</strong> <span class="status ${appointment.status}">${getStatusText(appointment.status)}</span></p>
                <p><strong>Motivo:</strong> ${appointment.reason || 'No especificado'}</p>
                <p><strong>Duración:</strong> ${appointment.duration} minutos</p>
                ${['receptionist', 'admin', 'doctor'].includes(userRole) ? `
                    <div class="card-actions">
                        ${userRole !== 'doctor' ? `
                            <button onclick="updateAppointmentStatus('${appointment._id}', 'confirmed')" 
                                    ${appointment.status !== 'scheduled' ? 'disabled' : ''}
                                    class="btn-small btn-success">
                                <i class="fas fa-check"></i> Confirmar
                            </button>
                        ` : ''}
                        <button onclick="updateAppointmentStatus('${appointment._id}', 'cancelled')" 
                                ${['cancelled', 'completed'].includes(appointment.status) ? 'disabled' : ''}
                                class="btn-small btn-danger">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                        <button onclick="updateAppointmentStatus('${appointment._id}', 'completed')" 
                                ${appointment.status !== 'confirmed' ? 'disabled' : ''}
                                class="btn-small btn-primary">
                            <i class="fas fa-check-double"></i> Completar
                        </button>
                        ${['admin', 'receptionist'].includes(userRole) ? `
                            <button onclick="editAppointment('${appointment._id}')" 
                                    class="btn-small" style="background: var(--info); color: white;">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                        ` : ''}
                        ${userRole === 'admin' ? `
                            <button onclick="deleteAppointment('${appointment._id}')" 
                                    class="btn-small btn-danger">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        ` : ''}
                    </div>
                ` : ''}
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
        select.disabled = false;
                
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

async function editAppointment(appointmentId) {
    try {
        const [appointmentRes, doctorsRes, patientsRes] = await Promise.all([
            authenticatedFetch(`${API_BASE_URL}/appointments/${appointmentId}`),
            authenticatedFetch(`${API_BASE_URL}/doctors`),
            authenticatedFetch(`${API_BASE_URL}/patients`)
        ]);
        
        const appointment = await appointmentRes.json();
        const doctors = await doctorsRes.json();
        const patients = await patientsRes.json();
        
        if (!Array.isArray(doctors) || doctors.length === 0) {
            showNotification('No hay doctores disponibles', 'warning');
            return;
        }
        
        if (!Array.isArray(patients) || patients.length === 0) {
            showNotification('No hay pacientes disponibles', 'warning');
            return;
        }
        
        showEditAppointmentModal(appointment, doctors, patients);
    } catch (error) {
        console.error('Error cargando datos:', error);
        showNotification('Error cargando datos de la cita', 'error');
    }
}

function showEditAppointmentModal(appointment, doctors, patients) {
    const overlay = document.createElement('div');
    overlay.className = 'edit-modal-overlay';
    
    // Formatear la fecha para el input datetime-local
    const appointmentDate = new Date(appointment.dateTime);
    const formattedDate = appointmentDate.toISOString().slice(0, 16);
    
    overlay.innerHTML = `
        <div class="edit-modal">
            <div class="edit-modal-header">
                <h3 class="edit-modal-title">
                    <i class="fas fa-calendar-edit"></i>
                    Editar Cita
                </h3>
            </div>
            <div class="edit-modal-body">
                <form id="edit-appointment-form">
                    <div class="form-group">
                        <label for="edit-patient">Paciente:</label>
                        <select id="edit-patient" required>
                            <option value="">Seleccionar paciente...</option>
                            ${patients.filter(p => p.status === 'active').map(p => `
                                <option value="${p._id}" ${appointment.patientId && p._id === appointment.patientId._id ? 'selected' : ''}>
                                    ${escapeHtml(p.personalInfo.firstName)} ${escapeHtml(p.personalInfo.lastName)} - ${escapeHtml(p.personalInfo.nationalId)}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-doctor">Doctor:</label>
                        <select id="edit-doctor" required>
                            <option value="">Seleccionar doctor...</option>
                            ${doctors.filter(d => d.status === 'active').map(d => `
                                <option value="${d._id}" ${appointment.doctorId && d._id === appointment.doctorId._id ? 'selected' : ''}>
                                    Dr. ${escapeHtml(d.personalInfo.firstName)} ${escapeHtml(d.personalInfo.lastName)} - ${escapeHtml(d.professional.specialties.join(', '))}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-datetime">Fecha y Hora:</label>
                        <input type="datetime-local" id="edit-datetime" value="${formattedDate}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-reason">Motivo de la Consulta:</label>
                        <textarea id="edit-reason" rows="3" required>${escapeHtml(appointment.reason)}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="edit-status">Estado:</label>
                        <select id="edit-status" required>
                            <option value="scheduled" ${appointment.status === 'scheduled' ? 'selected' : ''}>Programada</option>
                            <option value="confirmed" ${appointment.status === 'confirmed' ? 'selected' : ''}>Confirmada</option>
                            <option value="completed" ${appointment.status === 'completed' ? 'selected' : ''}>Completada</option>
                            <option value="cancelled" ${appointment.status === 'cancelled' ? 'selected' : ''}>Cancelada</option>
                            <option value="no-show" ${appointment.status === 'no-show' ? 'selected' : ''}>No Asistió</option>
                        </select>
                    </div>
                </form>
            </div>
            <div class="edit-modal-actions">
                <button class="edit-modal-btn edit-modal-btn-cancel" id="edit-cancel">
                    <i class="fas fa-times"></i>
                    <span>Cancelar</span>
                </button>
                <button class="edit-modal-btn edit-modal-btn-save" id="edit-save">
                    <i class="fas fa-save"></i>
                    <span>Guardar Cambios</span>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    const closeModal = () => {
        overlay.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => overlay.remove(), 200);
    };
    
    document.getElementById('edit-cancel').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
    
    document.getElementById('edit-save').addEventListener('click', async () => {
        const formData = {
            patientId: document.getElementById('edit-patient').value,
            doctorId: document.getElementById('edit-doctor').value,
            dateTime: document.getElementById('edit-datetime').value,
            reason: document.getElementById('edit-reason').value,
            status: document.getElementById('edit-status').value
        };
        
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/appointments/${appointment._id}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                showNotification('Cita actualizada exitosamente', 'success');
                closeModal();
                await loadAppointments();
            } else {
                showNotification('Error al actualizar cita: ' + (result.message || result.error), 'error');
            }
        } catch (error) {
            showNotification('Error de conexión', 'error');
            console.error('Error:', error);
        }
    });
}

async function deleteAppointment(appointmentId) {
    showConfirmModal(
        '¿Eliminar cita?',
        '¿Estás seguro de que deseas eliminar esta cita permanentemente?',
        async () => {
            try {
                const response = await authenticatedFetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
                    method: 'DELETE'
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    showNotification('Cita eliminada exitosamente', 'success');
                    await loadAppointments();
                } else {
                    showNotification('Error al eliminar cita: ' + (result.message || result.error), 'error');
                }
            } catch (error) {
                showNotification('Error de conexión', 'error');
                console.error('Error:', error);
            }
        }
    );
}