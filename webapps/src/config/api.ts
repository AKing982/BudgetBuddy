interface ApiEnvironments {
    [key: string]: string;
}

// const apiUrl = process.env.REACT_APP_API_OVERRIDE
//     ? process.env.REACT_APP_API_OVERRIDE
//     : (process.env.NODE_ENV === 'production'
//         ? process.env.REACT_APP_API_URL
//         : 'http://localhost:8080/api');

// Define available environments
const API_ENVIRONMENTS: ApiEnvironments = {
    production: 'https://budgetbuddy-app2-30f69a583595.herokuapp.com/api',
    development: 'http://localhost:8080/api',
    docker: 'http://localhost:8080/api',
    custom: localStorage.getItem('customApiUrl') || ''
};
// Auto-detect which environment to use based on the current URL
const autoDetectEnvironment = (): string => {
    const hostname = window.location.hostname;
    const port = window.location.port;
    let environment = "";
    // Production environment detection
    if (hostname.includes('herokuapp.com') || hostname.includes('budgetbuddy-app2')) {
        console.log('Detected production environment');
        environment = 'production';
    }

    // Local environment detection
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Docker typically runs on specific ports, customize as needed
        if (port === '3000' || port === '8080') {
            console.log('Detected Docker environment');
            environment = 'docker';
        }

        console.log('Detected development environment');
        environment = 'development';
    }

    // Default to development for safety
    console.log('Environment not explicitly detected, defaulting to development');

    console.log('Environment: {}', environment);
    return environment;
};

// Get the active environment - either auto-detected or manually set
const getActiveEnvironment = (): string => {
    return autoDetectEnvironment();
};

// Export the current API URL
export const apiUrl: string = API_ENVIRONMENTS[getActiveEnvironment()];
export const getCurrentEnvironment = (): string => getActiveEnvironment();
export const getAvailableEnvironments = (): string[] => Object.keys(API_ENVIRONMENTS);
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://budgetbuddy-app2-30f69a583595.herokuapp.com/api';

// export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';