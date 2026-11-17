const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:3001' : '');
export const PYTHON_API_BASE = import.meta.env.VITE_PYTHON_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '/edit-api');
const rawPptUrl = import.meta.env.VITE_PPT_API_URL;
export const PPT_API_BASE = (rawPptUrl && (!import.meta.env.PROD || (!rawPptUrl.includes('127.0.0.1') && !rawPptUrl.includes('localhost'))))
  ? rawPptUrl
  : (import.meta.env.DEV ? 'http://127.0.0.1:8001' : '/ppt-api');
export default API_BASE;
