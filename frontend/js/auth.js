// Sistema de autenticación simulado

// Verificar si hay sesión activa al cargar
document.addEventListener('DOMContentLoaded', function() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userName = localStorage.getItem('userName');
    
    if (isLoggedIn === 'true') {
        showMainApp(userName);
    } else {
        showLoginScreen();
    }
    
    // Configurar formulario de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Actualizar fecha actual
    updateCurrentDate();
});

function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Validación simple (en producción esto sería con backend)
    if (username === 'admin' && password === 'admin123') {
        // Login exitoso
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userName', 'Administrador');
        
        showNotification('¡Bienvenido! Inicio de sesión exitoso', 'success');
        
        setTimeout(() => {
            showMainApp('Administrador');
        }, 500);
    } else {
        showNotification('Usuario o contraseña incorrectos', 'error');
        
        // Shake animation en el formulario
        const loginBox = document.querySelector('.login-box');
        loginBox.classList.add('shake');
        setTimeout(() => {
            loginBox.classList.remove('shake');
        }, 500);
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
        }, 100);
    }
    
    // Actualizar nombre de usuario en la interfaz
    const userNameElements = document.querySelectorAll('#user-name, #welcome-user');
    userNameElements.forEach(el => {
        if (el) el.textContent = userName;
    });
    
    // Cargar datos del dashboard
    if (typeof loadDashboardStats === 'function') {
        loadDashboardStats();
    }
}

function logout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userName');
        
        showNotification('Sesión cerrada exitosamente', 'info');
        
        setTimeout(() => {
            showLoginScreen();
            // Limpiar formulario
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
    
    // Actualizar cada minuto
    setInterval(() => {
        const newDate = new Date().toLocaleDateString('es-ES', options);
        dateElement.textContent = newDate.charAt(0).toUpperCase() + newDate.slice(1);
    }, 60000);
}

// Prevenir cierre de sesión accidental
window.addEventListener('beforeunload', function(e) {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
        // Solo mostrar advertencia si hay datos no guardados
        // e.preventDefault();
        // e.returnValue = '';
    }
});
