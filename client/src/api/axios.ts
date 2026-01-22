import axios from 'axios';
import { usePendingRequests } from '../hooks/usePendingRequests';

export const API_URL = import.meta.env.VITE_API_URL || 'https://emails.up.railway.app';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

// Request interceptor
api.interceptors.request.use((config) => {
    usePendingRequests.getState().increment();
    return config;
}, (error) => {
    usePendingRequests.getState().decrement();
    return Promise.reject(error);
});

// Response interceptor
api.interceptors.response.use((response) => {
    usePendingRequests.getState().decrement();
    return response;
}, (error) => {
    usePendingRequests.getState().decrement();
    return Promise.reject(error);
});

export default api;
