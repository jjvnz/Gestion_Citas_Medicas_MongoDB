const CONFIG = {
    isProduction: window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1',
    
    get API_BASE_URL() {
        if (this.isProduction) {
            return `${window.location.origin}/api`;
        } else {
            return 'http://localhost:3000/api';
        }
    }
};

const API_BASE_URL = CONFIG.API_BASE_URL;
