import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'https://email-scheduler-api.up.railway.app';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

export default api;
