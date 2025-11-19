let isRedirectingToLogin = false;

// HTML escaping function to prevent XSS attacks
function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) {
        return '';
    }
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

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
        
        if (!response.ok && response.status >= 500) {
            const errorData = await response.clone().json().catch(() => ({}));
            const env = typeof window !== 'undefined' && window.NODE_ENV ? window.NODE_ENV : 'production';
            if (env === 'development') {
                console.error('Error del servidor:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: url,
                    error: errorData
                });
            } else {
                console.error('Error del servidor. Consulte al administrador.');
            }
        }
        
        return response;
    } catch (error) {
        const env = typeof window !== 'undefined' && window.NODE_ENV ? window.NODE_ENV : 'production';
        if (env === 'development') {
            console.error('Error en authenticatedFetch:', error);
        } else {
            console.error('Error en authenticatedFetch. Consulte al administrador.');
        }
        throw error;
    }
}

window.authenticatedFetch = authenticatedFetch;
window.getAuthToken = getAuthToken;
window.escapeHtml = escapeHtml;

// Helper to safely parse JSON response and handle errors
async function parseJsonResponse(response) {
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    let data = null;
    if (isJson) {
        try {
            data = await response.json();
        } catch (e) {
            data = null;
        }
    }
    if (!response.ok) {
        const errorMessage = data && data.message
            ? data.message
            : `HTTP error! status: ${response.status}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        throw error;
    }
    return data;
}

// API Helper para usar en otros módulos
window.apiHelper = {
    get: async (endpoint) => {
        const response = await authenticatedFetch(`${API_BASE_URL}${endpoint}`);
        return parseJsonResponse(response);
    },
    post: async (endpoint, data) => {
        const response = await authenticatedFetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        return parseJsonResponse(response);
    },
    put: async (endpoint, data) => {
        const response = await authenticatedFetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        return parseJsonResponse(response);
    },
    delete: async (endpoint) => {
        const response = await authenticatedFetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE'
        });
        return parseJsonResponse(response);
    }
};
