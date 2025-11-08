import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add token to all requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Handle 401 - Unauthorized (token expired or invalid)
      if (error.response.status === 401) {
        const currentPath = window.location.pathname;
        
        // Only redirect if not already on login page
        if (!currentPath.includes('/login')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          toast.error('Sessão expirada. Faça login novamente.');
          window.location.href = '/login';
        }
      }
      
      // Handle 403 - Forbidden
      else if (error.response.status === 403) {
        toast.error('Acesso negado');
      }
      
      // Handle 404 - Not Found
      else if (error.response.status === 404) {
        toast.error('Recurso não encontrado');
      }
      
      // Handle 500 - Server Error
      else if (error.response.status === 500) {
        toast.error('Erro no servidor. Tente novamente.');
      }
    } else if (error.request) {
      // Network error
      toast.error('Erro de conexão. Verifique sua internet.');
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
