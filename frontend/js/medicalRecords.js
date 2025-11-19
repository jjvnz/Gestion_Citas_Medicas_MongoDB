// Módulo para gestión de historiales médicos

// ============================================
// CARGAR DATOS INICIALES
// ============================================

async function loadMedicalRecordsPage() {
    try {
        await loadPatientsForDropdown();
        await loadDoctorsForDropdown();
        setupEventListeners();
    } catch (error) {
        console.error('Error al cargar página de historiales:', error);
    }
}

async function loadPatientsForDropdown() {
    try {
        const pacientes = await apiHelper.get('/patients');
        const select = document.getElementById('paciente-historial');
        
        select.innerHTML = '<option value="">Seleccionar paciente...</option>';
        pacientes.forEach(paciente => {
            if (paciente.status === 'active') {
                const option = document.createElement('option');
                option.value = paciente._id;
                option.textContent = `${paciente.personalInfo.firstName} ${paciente.personalInfo.lastName} - ${paciente.personalInfo.nationalId}`;
                select.appendChild(option);
            }
        });
    } catch (error) {
        console.error('Error al cargar pacientes:', error);
    }
}

async function loadDoctorsForDropdown() {
    try {
        const doctors = await apiHelper.get('/doctors');
        
        // Guardamos globalmente para usar en el modal
        window.doctorsList = doctors.filter(doc => doc.status === 'active');
    } catch (error) {
        console.error('Error al cargar doctores:', error);
    }
}

function setupEventListeners() {
    const selectPaciente = document.getElementById('paciente-historial');
    selectPaciente.addEventListener('change', handlePatientChange);
}

// ============================================
// CARGAR HISTORIAL DE PACIENTE
// ============================================

async function handlePatientChange(e) {
    const patientId = e.target.value;
    
    if (!patientId) {
        document.getElementById('historial-contenido').innerHTML = '';
        return;
    }
    
    await loadMedicalHistory(patientId);
}

async function loadMedicalHistory(patientId) {
    try {
        const records = await apiHelper.get(`/medical-records/patient/${patientId}`);
        displayMedicalRecords(records);
    } catch (error) {
        console.error('Error al cargar historial:', error);
        document.getElementById('historial-contenido').innerHTML = `
            <div class="error-message">Error al cargar el historial médico</div>
        `;
    }
}

function displayMedicalRecords(records) {
    const container = document.getElementById('historial-contenido');
    const userRole = localStorage.getItem('userRole');
    
    if (!records || records.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>Sin Registros Médicos</h3>
                <p>Este paciente aún no tiene registros médicos en el sistema</p>
                ${userRole === 'admin' || userRole === 'doctor' ? 
                    '<button class="btn-primary" onclick="showMedicalRecordModal()"><i class="fas fa-plus-circle"></i> Crear Primer Registro</button>' : ''}
            </div>
        `;
        return;
    }
    
    // Botón para crear nuevo registro
    let html = '';
    if (userRole === 'admin' || userRole === 'doctor') {
        html += `
            <div class="record-header">
                <div class="header-info">
                    <i class="fas fa-clipboard-list"></i>
                    <span>${records.length} registro${records.length !== 1 ? 's' : ''} encontrado${records.length !== 1 ? 's' : ''}</span>
                </div>
                <button class="btn-primary" onclick="showMedicalRecordModal()">
                    <i class="fas fa-plus-circle"></i> Nuevo Registro Médico
                </button>
            </div>
        `;
    }
    
    // Ordenar por fecha descendente
    records.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Crear tarjetas para cada registro
    html += '<div class="records-grid">';
    records.forEach(record => {
        html += createRecordCard(record);
    });
    html += '</div>';
    
    container.innerHTML = html;
}

function createRecordCard(record) {
    const userRole = localStorage.getItem('userRole');
    const date = new Date(record.date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const doctorName = record.doctorInfo?.[0] 
        ? `Dr. ${record.doctorInfo[0].personalInfo.firstName} ${record.doctorInfo[0].personalInfo.lastName}`
        : 'Doctor no asignado';
    
    const specialty = record.doctorInfo?.[0]?.specialization || 
                     record.doctorInfo?.[0]?.professional?.specialties?.[0] || 
                     '';
    
    return `
        <div class="medical-record-card">
            <div class="record-card-header">
                <div class="header-left">
                    <i class="fas fa-calendar-alt"></i>
                    <div>
                        <div class="record-date">${date}</div>
                        <div class="record-time">${new Date(record.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                </div>
                <div class="header-right">
                    <div class="record-doctor">${doctorName}</div>
                    ${specialty ? `<div class="record-specialty">${specialty}</div>` : ''}
                </div>
            </div>
            
            <div class="record-card-body">
                <div class="record-section">
                    <h4><i class="fas fa-stethoscope"></i> Diagnóstico</h4>
                    <p>${record.diagnosis || 'No especificado'}</p>
                </div>
                
                ${record.treatment ? `
                    <div class="record-section">
                        <h4><i class="fas fa-pills"></i> Tratamiento</h4>
                        <p>${record.treatment}</p>
                    </div>
                ` : ''}
                
                ${record.prescriptions && record.prescriptions.length > 0 ? `
                    <div class="record-section">
                        <h4><i class="fas fa-prescription-bottle-alt"></i> Prescripciones</h4>
                        <ul class="prescriptions-list">
                            ${record.prescriptions.map(p => {
                                if (typeof p === 'string') {
                                    return `<li>${p}</li>`;
                                } else if (p && typeof p === 'object') {
                                    const medication = p.medication || '';
                                    const dosage = p.dosage || '';
                                    const frequency = p.frequency || '';
                                    const duration = p.duration || '';
                                    
                                    if (!medication && !dosage && !frequency && !duration) {
                                        return '';
                                    }
                                    
                                    return `<li>
                                        <strong>${medication}</strong>${dosage ? ` - ${dosage}` : ''}
                                        ${frequency ? `<br><small><i class="fas fa-clock"></i> ${frequency}</small>` : ''}
                                        ${duration ? `<br><small><i class="fas fa-calendar-check"></i> Duración: ${duration}</small>` : ''}
                                    </li>`;
                                }
                                return '';
                            }).filter(item => item).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${record.vitalSigns && Object.keys(record.vitalSigns).length > 0 ? `
                    <div class="record-section">
                        <h4><i class="fas fa-heartbeat"></i> Signos Vitales</h4>
                        <div class="vital-signs-grid">
                            ${record.vitalSigns.bloodPressure ? `
                                <div class="vital-sign-item">
                                    <i class="fas fa-heart"></i>
                                    <strong>Presión Arterial</strong>
                                    <span>${record.vitalSigns.bloodPressure}</span>
                                </div>
                            ` : ''}
                            ${record.vitalSigns.heartRate ? `
                                <div class="vital-sign-item">
                                    <i class="fas fa-heartbeat"></i>
                                    <strong>Frecuencia Cardíaca</strong>
                                    <span>${record.vitalSigns.heartRate} bpm</span>
                                </div>
                            ` : ''}
                            ${record.vitalSigns.temperature ? `
                                <div class="vital-sign-item">
                                    <i class="fas fa-thermometer-half"></i>
                                    <strong>Temperatura</strong>
                                    <span>${record.vitalSigns.temperature}°C</span>
                                </div>
                            ` : ''}
                            ${record.vitalSigns.weight ? `
                                <div class="vital-sign-item">
                                    <i class="fas fa-weight"></i>
                                    <strong>Peso</strong>
                                    <span>${record.vitalSigns.weight} kg</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}
                
                ${record.notes ? `
                    <div class="record-section">
                        <h4><i class="fas fa-notes-medical"></i> Notas Adicionales</h4>
                        <p>${record.notes}</p>
                    </div>
                ` : ''}
            </div>
            
            ${userRole === 'admin' ? `
                <div class="record-card-actions">
                    <div class="alert-info">
                        <i class="fas fa-info-circle"></i>
                        <span>Los registros médicos son permanentes y no pueden ser editados por razones legales y de auditoría.</span>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

// ============================================
// MODAL CREAR/EDITAR REGISTRO
// ============================================

function showMedicalRecordModal(recordId = null) {
    const patientId = document.getElementById('paciente-historial').value;
    
    if (!patientId) {
        alert('Por favor selecciona un paciente primero');
        return;
    }
    
    // Verificar que haya doctores disponibles
    if (!window.doctorsList || window.doctorsList.length === 0) {
        alert('No hay doctores disponibles. Por favor recarga la página.');
        return;
    }
    
    const isEdit = recordId !== null;
    const title = isEdit ? 'Editar Registro Médico' : 'Nuevo Registro Médico';
    const icon = isEdit ? 'fa-edit' : 'fa-plus-circle';
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <h3><i class="fas ${icon}"></i> ${title}</h3>
            <form id="medical-record-modal-form">
                <div class="form-group">
                    <label for="modal-doctor">Doctor:</label>
                    <select id="modal-doctor" required>
                        <option value="">Seleccionar doctor...</option>
                        ${window.doctorsList.map(doc => {
                            const specialty = doc.specialization || doc.professional?.specialties?.[0] || 'Medicina General';
                            return `
                                <option value="${doc._id}">
                                    Dr. ${doc.personalInfo.firstName} ${doc.personalInfo.lastName} - ${specialty}
                                </option>
                            `;
                        }).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="modal-date">Fecha:</label>
                    <input type="date" id="modal-date" required>
                </div>
                
                <div class="form-group">
                    <label for="modal-diagnosis">Diagnóstico:</label>
                    <textarea id="modal-diagnosis" required placeholder="Descripción del diagnóstico"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="modal-treatment">Tratamiento:</label>
                    <textarea id="modal-treatment" placeholder="Tratamiento prescrito"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="modal-prescriptions">Prescripciones (una por línea):</label>
                    <textarea id="modal-prescriptions" placeholder="Medicamento 1&#10;Medicamento 2"></textarea>
                </div>
                
                <div class="form-group">
                    <label>Signos Vitales:</label>
                    <div class="vital-signs-inputs">
                        <input type="text" id="modal-blood-pressure" placeholder="Presión arterial (ej: 120/80)">
                        <input type="number" id="modal-heart-rate" placeholder="Frecuencia cardíaca (bpm)">
                        <input type="number" step="0.1" id="modal-temperature" placeholder="Temperatura (°C)">
                        <input type="number" step="0.1" id="modal-weight" placeholder="Peso (kg)">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="modal-notes">Notas Adicionales:</label>
                    <textarea id="modal-notes" placeholder="Observaciones del doctor"></textarea>
                </div>
                
                <div class="modal-actions">
                    <button type="submit" class="btn-primary">${isEdit ? 'Actualizar' : 'Crear'} Registro</button>
                    <button type="button" class="btn-secondary" onclick="closeModal()">Cancelar</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Establecer fecha actual si es nuevo registro
    if (!isEdit) {
        document.getElementById('modal-date').valueAsDate = new Date();
    }
    
    // Si es edición, cargar datos
    if (isEdit) {
        loadRecordDataToModal(recordId);
    }
    
    // Manejar submit
    document.getElementById('medical-record-modal-form').addEventListener('submit', (e) => {
        e.preventDefault();
        if (isEdit) {
            updateMedicalRecord(recordId);
        } else {
            createMedicalRecord();
        }
    });
    
    // Cerrar al hacer click fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

async function loadRecordDataToModal(recordId) {
    try {
        const record = await apiHelper.get(`/medical-records/${recordId}`);
        
        document.getElementById('modal-doctor').value = record.doctorId;
        document.getElementById('modal-date').valueAsDate = new Date(record.date);
        document.getElementById('modal-diagnosis').value = record.diagnosis || '';
        document.getElementById('modal-treatment').value = record.treatment || '';
        
        // Convertir prescripciones a formato de texto
        if (record.prescriptions && record.prescriptions.length > 0) {
            const prescriptionsText = record.prescriptions.map(p => {
                if (typeof p === 'string') return p;
                if (typeof p === 'object') {
                    const parts = [];
                    if (p.medication) parts.push(p.medication);
                    if (p.dosage) parts.push(p.dosage);
                    if (p.frequency) parts.push(p.frequency);
                    if (p.duration) parts.push(p.duration);
                    return parts.join(' - ');
                }
                return '';
            }).filter(p => p).join('\n');
            document.getElementById('modal-prescriptions').value = prescriptionsText;
        } else {
            document.getElementById('modal-prescriptions').value = '';
        }
        
        document.getElementById('modal-notes').value = record.notes || '';
        
        if (record.vitalSigns) {
            document.getElementById('modal-blood-pressure').value = record.vitalSigns.bloodPressure || '';
            document.getElementById('modal-heart-rate').value = record.vitalSigns.heartRate || '';
            document.getElementById('modal-temperature').value = record.vitalSigns.temperature || '';
            document.getElementById('modal-weight').value = record.vitalSigns.weight || '';
        }
    } catch (error) {
        console.error('Error al cargar datos del registro:', error);
        alert('Error al cargar los datos del registro');
        closeModal();
    }
}

function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// ============================================
// OPERACIONES CRUD
// ============================================

async function createMedicalRecord() {
    try {
        const patientId = document.getElementById('paciente-historial').value;
        const prescriptionsText = document.getElementById('modal-prescriptions').value.trim();
        
        // Convertir prescripciones de texto a array de strings
        const prescriptions = prescriptionsText ? 
            prescriptionsText.split('\n').filter(p => p.trim()).map(p => p.trim()) : 
            [];
        
        const data = {
            patientId,
            doctorId: document.getElementById('modal-doctor').value,
            date: document.getElementById('modal-date').value,
            diagnosis: document.getElementById('modal-diagnosis').value.trim(),
            treatment: document.getElementById('modal-treatment').value.trim(),
            prescriptions: prescriptions,
            notes: document.getElementById('modal-notes').value.trim(),
            vitalSigns: {
                bloodPressure: document.getElementById('modal-blood-pressure').value.trim(),
                heartRate: document.getElementById('modal-heart-rate').value,
                temperature: document.getElementById('modal-temperature').value,
                weight: document.getElementById('modal-weight').value
            }
        };
        
        await apiHelper.post('/medical-records', data);
        alert('Registro médico creado exitosamente');
        closeModal();
        await loadMedicalHistory(patientId);
    } catch (error) {
        console.error('Error al crear registro:', error);
        alert('Error al crear el registro médico: ' + (error.message || 'Error desconocido'));
    }
}
