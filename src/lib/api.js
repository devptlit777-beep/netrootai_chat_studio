const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:3001' : '');
export const PYTHON_API_BASE = import.meta.env.VITE_PYTHON_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '/edit-api');
export default API_BASE;
