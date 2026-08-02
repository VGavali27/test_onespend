import api from '@/services/api';

// Upload an image file — returns { url: '/uploads/<file>' } in the response data
export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/uploads', formData);
};
