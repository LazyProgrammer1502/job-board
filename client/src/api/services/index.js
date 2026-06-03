import api from '../axios';

export const jobsService = {
  getAll: (params) => api.get('/jobs', { params }),
  getOne: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post('/jobs', data),
  update: (id, data) => api.put(`/jobs/${id}`, data),
  remove: (id) => api.delete(`/jobs/${id}`),
  getMyJobs: () => api.get('/jobs/my-jobs'),
  toggleSave: (id) => api.put(`/jobs/${id}/save`),
  getSaved: () => api.get('/jobs/saved'),
};

export const applicationsService = {
  apply: (jobId, formData) => api.post(`/applications/${jobId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMy: () => api.get('/applications/my'),
  withdraw: (id) => api.delete(`/applications/${id}`),
  getJobApplicants: (jobId, params) => api.get(`/applications/job/${jobId}`, { params }),
  updateStatus: (id, data) => api.put(`/applications/${id}/status`, data),
};

export const companiesService = {
  create: (formData) => api.post('/companies', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (formData) => api.put('/companies', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMy: () => api.get('/companies/me'),
  getOne: (id) => api.get(`/companies/${id}`),
};
