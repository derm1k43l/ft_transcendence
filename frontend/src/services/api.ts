import axios from 'https://esm.sh/axios';

export const api = axios.create({
	// baseURL: 'http://localhost:3000/api',
	baseURL: '/api',
	headers: { 'Content-Type': 'application/json' },
});

// this request interceptor will be run each time we make an api call
// it includes the auth_token in the 'Authorization' header
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});
