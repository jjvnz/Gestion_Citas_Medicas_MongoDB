document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    updateCurrentDate();
});

async function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    
    if (token) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                const user = data.data.user;
                const userName = user.profile?.firstName || user.username || 'Usuario';
                localStorage.setItem('userName', userName);
                localStorage.setItem('userRole', user.role);
                showMainApp(userName);
                return;
            }
        } catch (error) {
            console.error('Error during token validation:', error);
            showNotification('Error de conexión al validar sesión. Intenta nuevamente.', 'error');
        }
    }
    
    showLoginScreen();
}

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            localStorage.setItem('authToken', data.data.token);
            const user = data.data.user;
            const userName = user.profile?.firstName || user.username || 'Usuario';
            localStorage.setItem('userName', userName);
            localStorage.setItem('userRole', user.role);
            
            showNotification('¡Bienvenido! Inicio de sesión exitoso', 'success');
            
            setTimeout(() => {
                showMainApp(userName);
            }, 500);
        } else {
            showNotification(data.message || 'Usuario o contraseña incorrectos', 'error');
            
            const loginBox = document.querySelector('.login-box');
            loginBox.classList.add('shake');
            setTimeout(() => {
                loginBox.classList.remove('shake');
            }, 500);
        }
    } catch (error) {
        showNotification('Error de conexión. Intenta nuevamente.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

function showLoginScreen() {
    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');
    
    if (loginScreen && mainApp) {
        loginScreen.classList.add('active');
        mainApp.classList.remove('active');
    }
}

function showMainApp(userName) {
    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');
    
    if (loginScreen && mainApp) {
        loginScreen.classList.remove('active');
        setTimeout(() => {
            mainApp.classList.add('active');
            
            if (typeof showSection === 'function') {
                showSection('inicio');
            } else if (typeof loadDashboardStats === 'function') {
                loadDashboardStats();
            }
        }, 100);
    }
    
    const userNameElements = document.querySelectorAll('#user-name, #welcome-user');
    userNameElements.forEach(el => {
        if (el) el.textContent = userName;
    });
}

function showConfirmModal(title, message, onConfirm) {
    // Crear el overlay
    const overlay = document.createElement('div');
    overlay.className = 'confirm-modal-overlay';
    
    // Crear el modal
    overlay.innerHTML = `
        <div class="confirm-modal">
            <div class="confirm-modal-header">
                <div class="confirm-modal-icon">
                    <i class="fas fa-sign-out-alt"></i>
                </div>
                <h3 class="confirm-modal-title">${title}</h3>
                <p class="confirm-modal-message">${message}</p>
            </div>
            <div class="confirm-modal-actions">
                <button class="confirm-modal-btn confirm-modal-btn-cancel" id="confirm-cancel">
                    <i class="fas fa-times"></i>
                    <span>Cancelar</span>
                </button>
                <button class="confirm-modal-btn confirm-modal-btn-confirm" id="confirm-accept">
                    <i class="fas fa-check"></i>
                    <span>Sí, cerrar sesión</span>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Manejar la confirmación
    const acceptBtn = overlay.querySelector('#confirm-accept');
    const cancelBtn = overlay.querySelector('#confirm-cancel');
    
    const closeModal = () => {
        overlay.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => overlay.remove(), 200);
    };
    
    acceptBtn.addEventListener('click', () => {
        closeModal();
        if (onConfirm) onConfirm();
    });
    
    cancelBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
}

function logout() {
    showConfirmModal(
        '¿Cerrar sesión?',
        'Estás a punto de cerrar tu sesión actual. ¿Deseas continuar?',
        () => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userName');
            localStorage.removeItem('userRole');
            
            showNotification('Sesión cerrada exitosamente', 'info');
            
            setTimeout(() => {
                showLoginScreen();
                const loginForm = document.getElementById('login-form');
                if (loginForm) {
                    loginForm.reset();
                }
            }, 500);
        }
    );
}

function updateCurrentDate() {
    const dateElement = document.getElementById('current-date');
    if (!dateElement) return;
    
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const currentDate = new Date().toLocaleDateString('es-ES', options);
    dateElement.textContent = currentDate.charAt(0).toUpperCase() + currentDate.slice(1);
    
    setInterval(() => {
        const newDate = new Date().toLocaleDateString('es-ES', options);
        dateElement.textContent = newDate.charAt(0).toUpperCase() + newDate.slice(1);
    }, 60000);
}
