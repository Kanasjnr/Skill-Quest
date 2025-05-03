const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'https://api.skillquest.io';

export const API_ENDPOINTS = {
  CERTIFICATE: (id) => `${API_BASE_URL}/certificate/${id}`,
  COURSE: (id) => `${API_BASE_URL}/course/${id}`,
  USER: (address) => `${API_BASE_URL}/user/${address}`,
  INSTRUCTOR: (address) => `${API_BASE_URL}/instructor/${address}`,
};

export default API_ENDPOINTS; 