// Configuración del entorno
// Detecta automáticamente si estamos en desarrollo o producción

const CONFIG = {
    // Detectar entorno
    isProduction: window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1',
    
    // URL base de la API
    get API_BASE_URL() {
        if (this.isProduction) {
            // En producción, usar la misma URL del servidor (Render)
            return `${window.location.origin}/api`;
        } else {
            // En desarrollo, usar localhost
            return 'http://localhost:3000/api';
        }
    }
};

// Exportar para uso global
const API_BASE_URL = CONFIG.API_BASE_URL;

console.log('🌍 Entorno:', CONFIG.isProduction ? 'PRODUCCIÓN' : 'DESARROLLO');
console.log('🔗 API URL:', API_BASE_URL);
