// Doctors frontend logic

async function loadDoctors() {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/doctors`);
        const doctors = await response.json();
        
        const container = document.getElementById('lista-doctores');
        if (!container) return;
        
        if (doctors.length === 0) {
            container.innerHTML = '<p>No hay doctores registrados</p>';
            return;
        }
        
        container.innerHTML = doctors.map(doctor => `
            <div class="card">
                <h4>Dr. ${doctor.personalInfo.firstName} ${doctor.personalInfo.lastName}</h4>
                <p><strong>Especialidades:</strong> ${doctor.professional.specialties.join(', ')}</p>
                <p><strong>Licencia:</strong> ${doctor.professional.licenseNumber}</p>
                <p><strong>Email:</strong> ${doctor.contact.email}</p>
                <p><strong>Teléfono:</strong> ${doctor.contact.phone}</p>
                <p><strong>Estado:</strong> <span class="status ${doctor.status}">${doctor.status === 'active' ? 'Activo' : 'Inactivo'}</span></p>
                ${doctor.schedule && doctor.schedule.length > 0 ? `
                    <div class="schedule">
                        <p><strong>Horario:</strong></p>
                        <ul>
                            ${doctor.schedule.map(s => `
                                <li>${getDayName(s.day)}: ${s.startTime} - ${s.endTime}</li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `).join('');
        
    } catch (error) {
        showNotification('Error cargando doctores', 'error');
    }
}

function getDayName(day) {
    const days = {
        'monday': 'Lunes',
        'tuesday': 'Martes',
        'wednesday': 'Miércoles',
        'thursday': 'Jueves',
        'friday': 'Viernes',
        'saturday': 'Sábado',
        'sunday': 'Domingo'
    };
    return days[day] || day;
}
