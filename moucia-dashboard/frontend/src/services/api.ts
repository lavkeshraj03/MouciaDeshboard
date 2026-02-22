import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor to add JWT
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response Interceptor to handle unauth
api.interceptors.response.use((response) => response, (error) => {
    if (error.response && error.response.status === 401) {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    } else if (error.response && error.response.status === 403) {
        if (typeof window !== 'undefined') {
            alert("Access denied. Admin privileges required.");
            window.location.href = '/dashboard/employee';
        }
    }
    return Promise.reject(error);
});

export default api;
