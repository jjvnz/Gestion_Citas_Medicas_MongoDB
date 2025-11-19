// Patients frontend logic

async function loadPatients() {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/patients`);
        const patients = await response.json();
        const userRole = getUserRole();
        
        const container = document.getElementById('lista-pacientes');
        if (!container) return;
        
        if (patients.length === 0) {
            container.innerHTML = '<p>No hay pacientes registrados</p>';
            return;
        }
        
        container.innerHTML = patients.map(patient => {
            const fullName = escapeHtml(`${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`);
            return `
            <div class="card">
                <h4>${fullName}</h4>
                <p><strong>Cédula:</strong> ${escapeHtml(patient.personalInfo.nationalId)}</p>
                <p><strong>Email:</strong> ${escapeHtml(patient.contact.email)}</p>
                <p><strong>Teléfono:</strong> ${escapeHtml(patient.contact.phone)}</p>
                <p><strong>Estado:</strong> <span class="status ${patient.status}">${patient.status === 'active' ? 'Activo' : 'Inactivo'}</span></p>
                ${['admin', 'receptionist'].includes(userRole) ? `
                    <div class="card-actions">
                        <button onclick="editPatient('${patient._id}')" class="btn-small btn-primary">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        ${userRole === 'admin' ? `
                            ${patient.status === 'active' ? `
                                <button onclick="deletePatient('${patient._id}', '${escapeHtml(fullName).replace(/'/g, "\\'").replace(/"/g, '&quot;')}')" 
                                        class="btn-small btn-danger">
                                    <i class="fas fa-trash"></i> Desactivar
                                </button>
                            ` : `
                                <button onclick="reactivatePatient('${patient._id}', '${escapeHtml(fullName).replace(/'/g, "\\'").replace(/"/g, '&quot;')}')" 
                                        class="btn-small btn-success">
                                    <i class="fas fa-check-circle"></i> Reactivar
                                </button>
                            `}
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `}).join('');
        
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
                        ${escapeHtml(patient.personalInfo.firstName)} ${escapeHtml(patient.personalInfo.lastName)} - 
                        ${escapeHtml(patient.personalInfo.nationalId)}
                    </option>
                `).join('');
        }
        
        // Cargar en el selector de creación de registro
        const selectRegistro = document.getElementById('paciente-registro');
        if (selectRegistro) {
            selectRegistro.innerHTML = '<option value="">Seleccionar paciente...</option>' +
                patients.map(patient => `
                    <option value="${patient._id}">
                        ${escapeHtml(patient.personalInfo.firstName)} ${escapeHtml(patient.personalInfo.lastName)} - 
                        ${escapeHtml(patient.personalInfo.nationalId)}
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
                        Dr. ${escapeHtml(doctor.personalInfo.firstName)} ${escapeHtml(doctor.personalInfo.lastName)} - 
                        ${escapeHtml(doctor.professional.specialties.join(', '))}
                    </option>
                `).join('');
                
    } catch (error) {
        console.error('Error cargando doctores:', error);
        showNotification('Error cargando doctores', 'error');
    }
}

function editPatient(patientId) {
    // Buscar el paciente en la lista actual
    authenticatedFetch(`${API_BASE_URL}/patients/${patientId}`)
        .then(res => res.json())
        .then(patient => {
            showEditPatientModal(patient);
        })
        .catch(error => {
            console.error('Error cargando paciente:', error);
            showNotification('Error cargando datos del paciente', 'error');
        });
}

function showEditPatientModal(patient) {
    const overlay = document.createElement('div');
    overlay.className = 'edit-modal-overlay';
    
    overlay.innerHTML = `
        <div class="edit-modal">
            <div class="edit-modal-header">
                <h3 class="edit-modal-title">
                    <i class="fas fa-user-edit"></i>
                    Editar Paciente
                </h3>
            </div>
            <div class="edit-modal-body">
                <form id="edit-patient-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="edit-nombre">Nombre:</label>
                            <input type="text" id="edit-nombre" value="${escapeHtml(patient.personalInfo.firstName)}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-apellido">Apellido:</label>
                            <input type="text" id="edit-apellido" value="${escapeHtml(patient.personalInfo.lastName)}" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="edit-cedula">Cédula:</label>
                        <input type="text" id="edit-cedula" value="${escapeHtml(patient.personalInfo.nationalId)}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-email">Email:</label>
                        <input type="email" id="edit-email" value="${escapeHtml(patient.contact.email)}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-telefono">Teléfono:</label>
                        <input type="tel" id="edit-telefono" value="${escapeHtml(patient.contact.phone)}" required>
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
            personalInfo: {
                firstName: document.getElementById('edit-nombre').value,
                lastName: document.getElementById('edit-apellido').value,
                nationalId: document.getElementById('edit-cedula').value,
                dateOfBirth: patient.personalInfo.dateOfBirth,
                gender: patient.personalInfo.gender
            },
            contact: {
                email: document.getElementById('edit-email').value,
                phone: document.getElementById('edit-telefono').value,
                address: patient.contact.address
            },
            medicalInfo: patient.medicalInfo,
            emergencyContact: patient.emergencyContact,
            status: patient.status
        };
        
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/patients/${patient._id}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                showNotification('Paciente actualizado exitosamente', 'success');
                closeModal();
                await loadPatients();
            } else {
                showNotification('Error al actualizar paciente: ' + (result.message || result.error), 'error');
            }
        } catch (error) {
            showNotification('Error de conexión', 'error');
            console.error('Error:', error);
        }
    });
}

async function deletePatient(patientId, patientName) {
    showConfirmModal(
        '¿Desactivar paciente?',
        `¿Estás seguro de que deseas desactivar al paciente <strong>${escapeHtml(patientName)}</strong>? Podrás reactivarlo más tarde si es necesario.`,
        async () => {
            try {
                const response = await authenticatedFetch(`${API_BASE_URL}/patients/${patientId}`, {
                    method: 'DELETE'
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    showNotification('Paciente desactivado exitosamente', 'success');
                    await loadPatients();
                } else if (response.status === 400) {
                    // Error de validación de negocio (ya inactivo o tiene citas)
                    showNotification(result.error, 'warning');
                    await loadPatients(); // Recargar para actualizar la vista
                } else if (response.status === 404) {
                    showNotification('Paciente no encontrado', 'error');
                    await loadPatients();
                } else {
                    showNotification('Error al desactivar paciente: ' + (result.message || result.error), 'error');
                }
            } catch (error) {
                showNotification('Error de conexión', 'error');
                console.error('Error:', error);
            }
        }
    );
}

async function reactivatePatient(patientId, patientName) {
    showConfirmModal(
        '¿Reactivar paciente?',
        `¿Estás seguro de que deseas reactivar al paciente <strong>${escapeHtml(patientName)}</strong>?`,
        async () => {
            try {
                const response = await authenticatedFetch(`${API_BASE_URL}/patients/${patientId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ status: 'active' })
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    showNotification('Paciente reactivado exitosamente', 'success');
                    await loadPatients();
                } else {
                    showNotification('Error al reactivar paciente: ' + (result.message || result.error), 'error');
                }
            } catch (error) {
                showNotification('Error de conexión', 'error');
                console.error('Error:', error);
            }
        }
    );
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
                ${record.doctorName ? `<p><strong>👨‍⚕️ Doctor:</strong> ${escapeHtml(record.doctorName)}</p>` : ''}
                <p><strong>🩺 Diagnóstico:</strong> ${escapeHtml(record.diagnosis || 'No especificado')}</p>
                ${record.treatment ? `<p><strong>💊 Tratamiento:</strong> ${escapeHtml(record.treatment)}</p>` : ''}
                ${record.prescriptions && record.prescriptions.length > 0 ? `
                    <div>
                        <p><strong>Medicamentos:</strong></p>
                        <ul>
                            ${record.prescriptions.map(med => `<li>${escapeHtml(med.name || med)} - ${escapeHtml(med.dosage || '')}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                ${record.notes ? `<p><strong>📝 Notas:</strong> ${escapeHtml(record.notes)}</p>` : ''}
            </div>
        `).join('');
        
    } catch (error) {
        showNotification('Error cargando historial médico', 'error');
    }
}
