import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.dlouis.ddnss.de/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const csrf = getCsrfTokenFromCookie('csrf_token');
  if (csrf) {
    config.headers = config.headers || {};
    (config.headers as any)['X-CSRF-Token'] = csrf;
  }
  return config;
});

function getCsrfTokenFromCookie(name: string) {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : '';
}


