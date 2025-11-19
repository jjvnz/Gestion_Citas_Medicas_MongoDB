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
        } catch (error) {}
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

function logout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
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
