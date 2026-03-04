import axios from 'axios';

// Replace with your machine's IP address (found via ipconfig)
// Replace with your machine's IP address or production domain
const BASE_DOMAIN = 'app.chithodehappykids.com';
const API_URL = `https://${BASE_DOMAIN}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

/**
 * Resolves a media path to a full URL.
 * Handles:
 * - Full URLs (http/https)
 * - Base64 strings
 * - Relative paths (announcements/img.jpg)
 * - Paths with storage/ prefix
 */
export const getMediaUrl = (path: string | undefined): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  
  // Normalize: remove leading slashes and handle backslashes
  const clean = path.trim().replace(/\\/g, '/').replace(/^\/+/, '');
  
  // Return the path relative to the domain root's storage
  // Some Hostinger setups might need /public/storage/ if subdomain isn't pointed to public
  return `https://${BASE_DOMAIN}/storage/${clean.replace(/^storage\//i, '')}`;
};

/**
 * Prepares a FormData object for file uploads.
 */
export const getFormData = (uri: string, name: string = 'file', type: string = 'image/jpeg') => {
  const formData = new FormData();
  const filename = uri.split('/').pop() || 'upload.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const ext = match ? match[1] : 'jpg';
  
  // @ts-ignore
  formData.append(name, {
    uri,
    name: filename,
    type: type.includes('/') ? type : `image/${ext}`,
  });
  
  return formData;
};

export default api;
