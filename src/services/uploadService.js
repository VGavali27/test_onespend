import api from '@/services/api';

// Upload a file — returns { url: '/uploads/<file>' } in the response data.
// Pass `folder` (e.g. 'vendor') to store it in uploads/<folder>/ — the folder field
// must be appended before the file so multer sees it.
export const uploadImage = (file, folder) => {
  const formData = new FormData();
  if (folder) formData.append('folder', folder);
  formData.append('file', file);
  return api.post('/uploads', formData);
};
