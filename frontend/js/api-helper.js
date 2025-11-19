let isRedirectingToLogin = false;

function getAuthToken() {
    return localStorage.getItem('authToken');
}

async function authenticatedFetch(url, options = {}) {
    const token = getAuthToken();
    
    if (!token) {
        throw new Error('No autenticado');
    }
    
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };
    
    if (token !== 'demo-token') {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
        ...options,
        headers
    };
    
    try {
        const response = await fetch(url, config);
        
        if (response.status === 401 && !isRedirectingToLogin) {
            isRedirectingToLogin = true;
            localStorage.removeItem('authToken');
            localStorage.removeItem('userName');
            localStorage.removeItem('userRole');
            
            if (typeof showNotification === 'function') {
                showNotification('Sesión expirada. Por favor inicia sesión nuevamente.', 'warning');
            }
            
            setTimeout(() => {
                if (typeof showLoginScreen === 'function') {
                    showLoginScreen();
                }
                isRedirectingToLogin = false;
            }, 1500);
            
            throw new Error('Sesión expirada');
        }
        
        return response;
    } catch (error) {
        throw error;
    }
}

window.authenticatedFetch = authenticatedFetch;
window.getAuthToken = getAuthToken;
